// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import {
  CHUNK_MAX_BYTES,
  CHUNK_MIN_BYTES,
  CHUNK_TARGET_BYTES,
  MANIFEST_SCHEMA_VERSION,
  MAX_BUFFERED_SYNC_BYTES,
} from "../protocol/constants.js";
import { canonicalize } from "../protocol/canonical-json.js";
import { sha256Hex } from "../protocol/bytes.js";
import type { SyncCryptoProvider } from "../protocol/crypto-provider.js";
import type { BlobStore } from "../protocol/types.js";
import {
  chunkPlaintext,
  chunkPlaintextStream,
  createFileId,
  createTreeManifest,
  joinPath,
  parseFileManifest,
  parseTreeManifest,
  splitPath,
  type FileManifest,
  type TreeManifest,
} from "./manifests.js";

export type PathRecord = {
  fileId: string;
  fileManifestHash: string;
  fileManifestEpoch: number;
  contentFingerprint: string;
  contentGeneration?: number;
};

export type LocalObjectIndex = {
  revisionEventId: string | null;
  rootHash: string | null;
  paths: Record<string, PathRecord>;
  treeHashes: Record<string, string>;
  treeEpochs: Record<string, number>;
};

export type VaultSnapshot = Record<string, Uint8Array>;

export type BuiltGraph = {
  rootHash: string;
  index: LocalObjectIndex;
  newObjectHashes: string[];
};

export type StreamingVaultFile = {
  path: string;
  fileId: string;
  contentGeneration: number;
  hostFileId?: string;
  openRead(): Promise<ReadableStream<Uint8Array>>;
};

export type RemoteObjectGraphFile = {
  path: string;
  fileId: string;
  fileManifestHash: string;
  fileManifestEpoch: number;
  contentFingerprint: string;
  size: number;
  contentObjects: string[];
  openRead(): ReadableStream<Uint8Array>;
};

export type InspectedObjectGraph = {
  files: RemoteObjectGraphFile[];
  treeHashes: Record<string, string>;
  treeEpochs: Record<string, number>;
};

const IGNORED_PREFIXES = [".obsidian/", ".lapis/", ".git/", ".jj/"];

export function isIgnoredPath(path: string): boolean {
  return IGNORED_PREFIXES.some(
    (prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix),
  );
}

export async function buildObjectGraph(options: {
  vault: VaultSnapshot;
  previous?: LocalObjectIndex;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
  fileIds?: Record<string, string>;
}): Promise<BuiltGraph> {
  const previous = options.previous ?? emptyIndex();
  const newObjectHashes: string[] = [];
  const paths: Record<string, PathRecord> = Object.create(null);
  const fileIds = { ...options.fileIds };

  const entriesByDir = new Map<
    string,
    {
      name: string;
      type: "file" | "tree";
      object: string;
      epoch: number;
      fileId?: string;
    }[]
  >();

  const files = Object.entries(options.vault)
    .filter(([path]) => !isIgnoredPath(path))
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

  for (const [path, bytes] of files) {
    const parts = splitPath(path);
    if (parts.length === 0) throw new Error("Empty file path");
    const requestedId = fileIds[path];
    const previousPath = requestedId
      ? Object.values(previous.paths).find(
          (record) => record.fileId === requestedId,
        )
      : Object.hasOwn(previous.paths, path)
        ? previous.paths[path]
        : undefined;
    const previousEpoch = previousPath?.fileManifestEpoch ?? options.epoch;
    const previousFingerprint = previousPath
      ? await options.crypto.calculateContentId({
          epoch: previousEpoch,
          plaintext: bytes,
        })
      : null;
    const unchanged =
      previousPath !== undefined &&
      previousPath.contentFingerprint === previousFingerprint;
    const fileId = requestedId ?? previousPath?.fileId ?? createFileId();
    if (Object.values(paths).some((record) => record.fileId === fileId))
      throw new Error("Duplicate file identity");
    let fileManifestHash = unchanged
      ? previousPath.fileManifestHash
      : undefined;
    const fileManifestEpoch = unchanged ? previousEpoch : options.epoch;
    let fingerprint = unchanged ? previousPath.contentFingerprint : undefined;
    if (!fileManifestHash || !fingerprint) {
      const stored = await putFile(
        bytes,
        fileId,
        options.crypto,
        options.epoch,
        options.blobs,
        newObjectHashes,
      );
      fileManifestHash = stored.hash;
      fingerprint = await options.crypto.calculateContentId({
        epoch: options.epoch,
        plaintext: bytes,
      });
    }
    if (!fileManifestHash) {
      throw new Error(`Missing file manifest for ${path}`);
    }
    paths[path] = {
      fileId,
      fileManifestHash,
      fileManifestEpoch,
      contentFingerprint: fingerprint,
    };
    const dir = parts.slice(0, -1).join("/");
    const name = parts[parts.length - 1] ?? path;
    pushEntry(entriesByDir, dir, {
      name,
      type: "file",
      object: fileManifestHash,
      epoch: fileManifestEpoch,
      fileId,
    });
  }

  const { rootHash, treeHashes, treeEpochs } = await buildTrees({
    entriesByDir,
    previous,
    paths,
    crypto: options.crypto,
    epoch: options.epoch,
    blobs: options.blobs,
    newObjectHashes,
  });
  return {
    rootHash,
    index: {
      revisionEventId: previous.revisionEventId,
      rootHash,
      paths,
      treeHashes,
      treeEpochs,
    },
    newObjectHashes,
  };
}

export async function buildObjectGraphFromStreams(options: {
  files: StreamingVaultFile[];
  previous?: LocalObjectIndex;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
}): Promise<BuiltGraph> {
  const previous = options.previous ?? emptyIndex();
  const previousByFileId = new Map(
    Object.values(previous.paths).map((record) => [record.fileId, record]),
  );
  const newObjectHashes: string[] = [];
  const paths: Record<string, PathRecord> = Object.create(null);
  const entriesByDir = new Map<
    string,
    {
      name: string;
      type: "file" | "tree";
      object: string;
      epoch: number;
      fileId?: string;
    }[]
  >();
  const seenIds = new Set<string>(),
    seenPaths = new Set<string>();
  for (const file of [...options.files].sort((left, right) =>
    left.path.localeCompare(right.path),
  )) {
    if (isIgnoredPath(file.path)) continue;
    if (splitPath(file.path).length === 0) throw new Error("Empty file path");
    if (!file.fileId || seenIds.has(file.fileId))
      throw new Error("Duplicate or missing file identity");
    if (seenPaths.has(file.path)) throw new Error("Duplicate file path");
    if (
      !Number.isSafeInteger(file.contentGeneration) ||
      file.contentGeneration < 0
    )
      throw new Error("Invalid file content generation");
    seenIds.add(file.fileId);
    seenPaths.add(file.path);
    const prior = previousByFileId.get(file.fileId);
    let record: PathRecord;
    if (
      prior &&
      prior.fileId === file.fileId &&
      prior.contentGeneration === file.contentGeneration
    ) {
      record = { ...prior, contentGeneration: file.contentGeneration };
    } else {
      const stored = await putStreamedFile(
        await file.openRead(),
        file.fileId,
        options.crypto,
        options.epoch,
        options.blobs,
        newObjectHashes,
      );
      record = {
        fileId: file.fileId,
        fileManifestHash: stored.hash,
        fileManifestEpoch: options.epoch,
        contentFingerprint: stored.contentFingerprint,
        contentGeneration: file.contentGeneration,
      };
    }
    paths[file.path] = record;
    const parts = splitPath(file.path);
    pushEntry(entriesByDir, parts.slice(0, -1).join("/"), {
      name: parts.at(-1) ?? file.path,
      type: "file",
      object: record.fileManifestHash,
      epoch: record.fileManifestEpoch,
      fileId: record.fileId,
    });
  }
  const { rootHash, treeHashes, treeEpochs } = await buildTrees({
    entriesByDir,
    previous,
    paths,
    crypto: options.crypto,
    epoch: options.epoch,
    blobs: options.blobs,
    newObjectHashes,
  });
  return {
    rootHash,
    index: {
      revisionEventId: previous.revisionEventId,
      rootHash,
      paths,
      treeHashes,
      treeEpochs,
    },
    newObjectHashes,
  };
}

export async function materialiseRoot(options: {
  rootHash: string;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
}): Promise<VaultSnapshot> {
  return (await materialiseRootWithFileIds(options)).snapshot;
}

export async function materialiseRootWithFileIds(options: {
  rootHash: string;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
}): Promise<{
  snapshot: VaultSnapshot;
  fileIds: Record<string, string>;
}> {
  const snapshot: VaultSnapshot = Object.create(null);
  const fileIds: Record<string, string> = Object.create(null);
  const graph = await inspectObjectGraph(options);
  let total = 0;
  for (const file of graph.files) {
    total += file.size;
    if (total > MAX_BUFFERED_SYNC_BYTES)
      throw new Error(
        "Use streamed reads for snapshots larger than the memory limit",
      );
    snapshot[file.path] = new Uint8Array(
      await new Response(file.openRead()).arrayBuffer(),
    );
    fileIds[file.path] = file.fileId;
  }
  return { snapshot, fileIds };
}

export async function collectReachableObjectHashes(options: {
  rootHash: string;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
}): Promise<Set<string>> {
  const graph = await inspectObjectGraph(options);
  return new Set([
    ...Object.values(graph.treeHashes),
    ...graph.files.flatMap((file) => [
      file.fileManifestHash,
      ...file.contentObjects,
    ]),
  ]);
}

export async function inspectObjectGraph(options: {
  rootHash: string;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
}): Promise<InspectedObjectGraph> {
  const files: RemoteObjectGraphFile[] = [];
  const treeHashes: Record<string, string> = Object.create(null);
  const treeEpochs: Record<string, number> = Object.create(null);
  const fileIds = new Set<string>();
  let visitedEntries = 0;
  const visit = async (
    hash: string,
    epoch: number,
    prefix: string[],
  ): Promise<void> => {
    if (prefix.length > 128 || ++visitedEntries > 100_000)
      throw new Error("Object graph traversal limit exceeded");
    const directory = joinPath(prefix);
    treeHashes[directory] = hash;
    treeEpochs[directory] = epoch;
    const tree = parseTreeManifest(
      JSON.parse(
        new TextDecoder().decode(
          await decryptObject(hash, epoch, "tree-manifest", options),
        ),
      ),
      epoch,
    );
    for (const entry of tree.entries) {
      if (++visitedEntries > 100_000)
        throw new Error("Object graph traversal limit exceeded");
      const next = [...prefix, entry.name];
      if (entry.type === "tree") {
        await visit(entry.object, entry.epoch, next);
        continue;
      }
      const file = parseFileManifest(
        JSON.parse(
          new TextDecoder().decode(
            await decryptObject(
              entry.object,
              entry.epoch,
              "file-manifest",
              options,
            ),
          ),
        ),
        entry.epoch,
      );
      if (
        fileIds.has(file.fileId) ||
        (entry.fileId !== undefined && entry.fileId !== file.fileId)
      )
        throw new Error("Invalid or duplicate graph file identity");
      fileIds.add(file.fileId);
      files.push({
        path: joinPath(next),
        fileId: file.fileId,
        fileManifestHash: entry.object,
        fileManifestEpoch: entry.epoch,
        contentFingerprint: manifestContentFingerprint(file),
        size: file.size,
        contentObjects:
          file.content.mode === "single"
            ? [file.content.object]
            : file.content.chunks.map((chunk) => chunk.object),
        openRead: () => readFileContentStream(file, options),
      });
    }
  };
  await visit(options.rootHash, options.epoch, []);
  return { files, treeHashes, treeEpochs };
}

export function emptyIndex(): LocalObjectIndex {
  return {
    revisionEventId: null,
    rootHash: null,
    paths: Object.create(null),
    treeHashes: Object.create(null),
    treeEpochs: Object.create(null),
  };
}

async function putFile(
  bytes: Uint8Array,
  fileId: string,
  crypto: SyncCryptoProvider,
  epoch: number,
  blobs: BlobStore,
  newObjectHashes: string[],
): Promise<{ hash: string; epoch: number }> {
  const chunks = chunkPlaintext(bytes);
  const uploaded = [];
  for (const chunk of chunks) {
    uploaded.push({
      object: await putBytes(
        chunk.bytes,
        crypto,
        epoch,
        blobs,
        newObjectHashes,
      ),
      plainSize: chunk.plainSize,
      epoch,
      contentId: await crypto.calculateContentId({
        epoch,
        plaintext: chunk.bytes,
      }),
    });
  }
  const manifest: FileManifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    type: "file",
    fileId,
    size: bytes.byteLength,
    content:
      uploaded.length === 1
        ? {
            mode: "single",
            object: uploaded[0]!.object,
            epoch,
            contentId: uploaded[0]!.contentId,
          }
        : {
            mode: "chunks",
            algorithm: "fastcdc-v1",
            minSize: CHUNK_MIN_BYTES,
            targetSize: CHUNK_TARGET_BYTES,
            maxSize: CHUNK_MAX_BYTES,
            chunks: uploaded,
          },
  };
  return {
    hash: await putJson(
      manifest,
      "file-manifest",
      crypto,
      epoch,
      blobs,
      newObjectHashes,
    ),
    epoch,
  };
}

async function putStreamedFile(
  stream: ReadableStream<Uint8Array>,
  fileId: string,
  crypto: SyncCryptoProvider,
  epoch: number,
  blobs: BlobStore,
  newObjectHashes: string[],
): Promise<{ hash: string; contentFingerprint: string }> {
  const uploaded: {
    object: string;
    plainSize: number;
    epoch: number;
    contentId: string;
  }[] = [];
  let size = 0;
  for await (const chunk of chunkPlaintextStream(stream)) {
    uploaded.push({
      object: await putBytes(
        chunk.bytes,
        crypto,
        epoch,
        blobs,
        newObjectHashes,
      ),
      plainSize: chunk.plainSize,
      epoch,
      contentId: await crypto.calculateContentId({
        epoch,
        plaintext: chunk.bytes,
      }),
    });
    size += chunk.plainSize;
  }
  if (uploaded.length === 0) {
    uploaded.push({
      object: await putBytes(
        new Uint8Array(),
        crypto,
        epoch,
        blobs,
        newObjectHashes,
      ),
      plainSize: 0,
      epoch,
      contentId: await crypto.calculateContentId({
        epoch,
        plaintext: new Uint8Array(),
      }),
    });
  }
  const content: FileManifest["content"] =
    uploaded.length === 1
      ? {
          mode: "single",
          object: uploaded[0]!.object,
          epoch,
          contentId: uploaded[0]!.contentId,
        }
      : {
          mode: "chunks",
          algorithm: "fastcdc-v1",
          minSize: CHUNK_MIN_BYTES,
          targetSize: CHUNK_TARGET_BYTES,
          maxSize: CHUNK_MAX_BYTES,
          chunks: uploaded,
        };
  const manifest: FileManifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    type: "file",
    fileId,
    size,
    content,
  };
  return {
    hash: await putJson(
      manifest,
      "file-manifest",
      crypto,
      epoch,
      blobs,
      newObjectHashes,
    ),
    contentFingerprint: manifestContentFingerprint(manifest),
  };
}

function readFileContentStream(
  file: FileManifest,
  options: { crypto: SyncCryptoProvider; epoch: number; blobs: BlobStore },
): ReadableStream<Uint8Array> {
  const descriptors =
    file.content.mode === "single"
      ? [{ object: file.content.object, epoch: file.content.epoch }]
      : file.content.chunks;
  const iterator = descriptors[Symbol.iterator]();
  let size = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = iterator.next();
      if (next.done) {
        if (size !== file.size)
          throw new Error("File content size does not match manifest");
        controller.close();
        return;
      }
      const bytes = await decryptObject(
        next.value.object,
        next.value.epoch,
        "file-content",
        options,
      );
      size += bytes.byteLength;
      if (
        bytes.byteLength > CHUNK_MAX_BYTES ||
        size > file.size ||
        ("plainSize" in next.value && bytes.byteLength !== next.value.plainSize)
      )
        throw new Error("File content chunk size mismatch");
      controller.enqueue(bytes);
    },
  });
}

function manifestContentFingerprint(file: FileManifest): string {
  return sha256Hex(new TextEncoder().encode(canonicalize(file.content)));
}

async function putBytes(
  bytes: Uint8Array,
  crypto: SyncCryptoProvider,
  epoch: number,
  blobs: BlobStore,
  newObjectHashes: string[],
): Promise<string> {
  const encrypted = await crypto.encryptObject({
    epoch,
    type: "file-content",
    plaintext: bytes,
  });
  const stored = await blobs.put(encrypted.bytes);
  if (encrypted.objectHash !== stored.hash) {
    throw new Error("Blob store returned a mismatched hash");
  }
  newObjectHashes.push(stored.hash);
  return stored.hash;
}

async function putJson(
  value: unknown,
  type: "file-manifest" | "tree-manifest",
  crypto: SyncCryptoProvider,
  epoch: number,
  blobs: BlobStore,
  newObjectHashes: string[],
): Promise<string> {
  const encrypted = await crypto.encryptObject({
    epoch,
    type,
    plaintext: new TextEncoder().encode(canonicalize(value)),
  });
  const stored = await blobs.put(encrypted.bytes);
  if (encrypted.objectHash !== stored.hash) {
    throw new Error("Blob store returned a mismatched hash");
  }
  newObjectHashes.push(stored.hash);
  return stored.hash;
}

async function decryptObject(
  hash: string,
  epoch: number,
  type: "file-content" | "file-manifest" | "tree-manifest",
  options: { crypto: SyncCryptoProvider; epoch: number; blobs: BlobStore },
): Promise<Uint8Array> {
  if (!/^[0-9a-f]{64}$/u.test(hash))
    throw new Error("Invalid ciphertext object hash");
  const envelope = await options.blobs.get(hash);
  const limit =
    type === "file-content"
      ? CHUNK_MAX_BYTES + 64
      : MAX_BUFFERED_SYNC_BYTES / 2 + 64;
  if (envelope.byteLength > limit)
    throw new Error("Encrypted object exceeds the memory limit");
  if (sha256Hex(envelope) !== hash) {
    throw new Error("Corrupt blob hash");
  }
  return options.crypto.decryptObject({
    epoch,
    type,
    envelope,
  });
}

function pushEntry(
  map: Map<
    string,
    {
      name: string;
      type: "file" | "tree";
      object: string;
      epoch: number;
      fileId?: string;
    }[]
  >,
  directory: string,
  entry: {
    name: string;
    type: "file" | "tree";
    object: string;
    epoch: number;
    fileId?: string;
  },
): void {
  const list = map.get(directory) ?? [];
  if (
    !list.some((item) => item.name === entry.name && item.type === entry.type)
  ) {
    list.push(entry);
  }
  map.set(directory, list);
}

function parentDirectory(path: string): string {
  const parts = splitPath(path);
  return parts.slice(0, -1).join("/");
}

async function buildTrees(options: {
  entriesByDir: Map<
    string,
    {
      name: string;
      type: "file" | "tree";
      object: string;
      epoch: number;
      fileId?: string;
    }[]
  >;
  previous: LocalObjectIndex;
  paths: Record<string, PathRecord>;
  crypto: SyncCryptoProvider;
  epoch: number;
  blobs: BlobStore;
  newObjectHashes: string[];
}): Promise<{
  rootHash: string;
  treeHashes: Record<string, string>;
  treeEpochs: Record<string, number>;
}> {
  const directories = new Set<string>(["", ...options.entriesByDir.keys()]);
  for (const directory of [...directories]) {
    let parent = parentDirectory(directory);
    while (directory && !directories.has(parent)) {
      directories.add(parent);
      if (!parent) break;
      parent = parentDirectory(parent);
    }
  }
  const ordered = [...directories].sort((left, right) => {
    const depth = splitPath(right).length - splitPath(left).length;
    return depth || right.localeCompare(left);
  });
  const treeHashes: Record<string, string> = Object.create(null);
  const treeEpochs: Record<string, number> = Object.create(null);
  for (const directory of ordered) {
    for (const child of ordered.filter(
      (candidate) =>
        candidate !== directory && parentDirectory(candidate) === directory,
    )) {
      const name = splitPath(child).at(-1);
      if (!name || !treeHashes[child]) continue;
      pushEntry(options.entriesByDir, directory, {
        name,
        type: "tree",
        object: treeHashes[child],
        epoch: treeEpochs[child] ?? options.epoch,
      });
    }
    const manifest = createTreeManifest(
      options.entriesByDir.get(directory) ?? [],
    );
    const previousHash = options.previous.treeHashes[directory];
    const unchanged =
      previousHash &&
      (options.previous.treeEpochs?.[directory] ?? options.epoch) ===
        options.epoch &&
      sameTree(
        options.previous,
        directory,
        manifest,
        treeHashes,
        options.paths,
      );
    treeHashes[directory] = unchanged
      ? previousHash
      : await putJson(
          manifest,
          "tree-manifest",
          options.crypto,
          options.epoch,
          options.blobs,
          options.newObjectHashes,
        );
    treeEpochs[directory] = options.epoch;
  }
  const rootHash = treeHashes[""];
  if (!rootHash) throw new Error("Failed to build root tree");
  return { rootHash, treeHashes, treeEpochs };
}

function sameTree(
  previous: LocalObjectIndex,
  directory: string,
  _manifest: TreeManifest,
  treeHashes: Record<string, string>,
  paths: Record<string, PathRecord>,
): boolean {
  const prefix = directory ? `${directory}/` : "";
  const previousPaths = Object.keys(previous.paths).filter((path) =>
    directory === "" ? true : path.startsWith(prefix),
  );
  const nextPaths = Object.keys(paths).filter((path) =>
    directory === "" ? true : path.startsWith(prefix),
  );
  if (previousPaths.length !== nextPaths.length) return false;
  return (
    nextPaths.every((path) => {
      const before = previous.paths[path];
      const after = paths[path];
      return (
        before &&
        after &&
        before.fileId === after.fileId &&
        before.fileManifestHash === after.fileManifestHash &&
        before.contentFingerprint === after.contentFingerprint
      );
    }) &&
    Object.entries(treeHashes).every(([child, hash]) => {
      if (parentDirectory(child) !== directory || child === directory)
        return true;
      return previous.treeHashes[child] === hash;
    })
  );
}
