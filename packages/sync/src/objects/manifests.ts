// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import {
  CHUNK_MAX_BYTES,
  CHUNK_MIN_BYTES,
  CHUNK_TARGET_BYTES,
  MANIFEST_SCHEMA_VERSION,
  MAX_BUFFERED_SYNC_BYTES,
} from "../protocol/constants.js";
import { randomHex, sha256Hex } from "../protocol/bytes.js";

export type TreeEntry = {
  name: string;
  type: "tree" | "file";
  object: string;
  epoch: number;
  fileId?: string;
};

export type TreeManifest = {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  type: "tree";
  entries: TreeEntry[];
};

export type FileContent =
  | { mode: "single"; object: string; epoch: number; contentId?: string }
  | {
      mode: "chunks";
      algorithm: "fastcdc-v1" | "fixed-v1";
      minSize: number;
      targetSize: number;
      maxSize: number;
      chunks: {
        object: string;
        plainSize: number;
        epoch: number;
        contentId?: string;
      }[];
    };

export type FileManifest = {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  type: "file";
  fileId: string;
  size: number;
  contentType?: string;
  content: FileContent;
};

const FORBIDDEN_NAMES = new Set([".", ".."]);

export function createFileId(): string {
  return randomHex(16);
}

export function normalizeComponent(name: string): string {
  const normalized = name.normalize("NFC");
  if (
    !normalized ||
    FORBIDDEN_NAMES.has(normalized) ||
    /[\\/\u0000-\u001f]/u.test(normalized)
  ) {
    throw new Error(`Invalid path component: ${name}`);
  }
  return normalized;
}

export function splitPath(path: string): string[] {
  if (path === "") return [];
  const parts = path.split("/").map(normalizeComponent);
  if (parts.join("/") !== path || /^[A-Za-z]:/u.test(path))
    throw new Error("Invalid or noncanonical path");
  return parts;
}

export function joinPath(parts: string[]): string {
  return parts.map(normalizeComponent).join("/");
}

export function createTreeManifest(entries: TreeEntry[]): TreeManifest {
  const normalized = entries
    .map((entry) => ({
      ...entry,
      name: normalizeComponent(entry.name),
    }))
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
  const seen = new Map<string, string>();
  for (const entry of normalized) {
    const folded = entry.name.toLowerCase();
    const previous = seen.get(folded);
    if (previous !== undefined) {
      throw new Error(`Case-colliding names ${previous} and ${entry.name}`);
    }
    seen.set(folded, entry.name);
  }
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    type: "tree",
    entries: normalized,
  };
}

export function parseTreeManifest(
  value: unknown,
  fallbackEpoch = 1,
): TreeManifest {
  const record = asRecord(value);
  if (
    (record.schemaVersion !== 1 &&
      record.schemaVersion !== MANIFEST_SCHEMA_VERSION) ||
    record.type !== "tree"
  ) {
    throw new Error("Unsupported tree manifest");
  }
  if (!Array.isArray(record.entries)) {
    throw new Error("Tree manifest entries are required");
  }
  if (record.entries.length > 100_000)
    throw new Error("Tree manifest entry limit exceeded");
  return createTreeManifest(
    record.entries.map((entry) => {
      const item = asRecord(entry);
      if (item.type !== "tree" && item.type !== "file") {
        throw new Error("Unsupported tree entry type");
      }
      if (typeof item.name !== "string" || typeof item.object !== "string") {
        throw new Error("Tree entry is incomplete");
      }
      requireObjectHash(item.object);
      return {
        name: item.name,
        type: item.type,
        object: item.object,
        epoch:
          record.schemaVersion === 1
            ? fallbackEpoch
            : positiveInteger(item.epoch, "Tree entry epoch"),
        fileId: typeof item.fileId === "string" ? item.fileId : undefined,
      };
    }),
  );
}

export function parseFileManifest(
  value: unknown,
  fallbackEpoch = 1,
): FileManifest {
  const record = asRecord(value);
  if (
    (record.schemaVersion !== 1 &&
      record.schemaVersion !== MANIFEST_SCHEMA_VERSION) ||
    record.type !== "file"
  ) {
    throw new Error("Unsupported file manifest");
  }
  if (typeof record.fileId !== "string" || typeof record.size !== "number") {
    throw new Error("File manifest is incomplete");
  }
  if (!record.fileId || !Number.isSafeInteger(record.size) || record.size < 0)
    throw new Error("File manifest size or identity is invalid");
  const content = parseFileContent(record.content, fallbackEpoch);
  if (
    content.mode === "chunks" &&
    content.chunks.reduce((total, chunk) => total + chunk.plainSize, 0) !==
      record.size
  )
    throw new Error("Chunk sizes do not match file size");
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    type: "file",
    fileId: record.fileId,
    size: record.size,
    contentType:
      typeof record.contentType === "string" ? record.contentType : undefined,
    content,
  };
}

export function chunkPlaintext(
  bytes: Uint8Array,
  minSize = CHUNK_MIN_BYTES,
  targetSize = CHUNK_TARGET_BYTES,
  maxSize = CHUNK_MAX_BYTES,
): { plainSize: number; bytes: Uint8Array }[] {
  validateChunkSizes(minSize, targetSize, maxSize);
  if (bytes.byteLength <= minSize) {
    return [{ plainSize: bytes.byteLength, bytes }];
  }
  const chunks: { plainSize: number; bytes: Uint8Array }[] = [];
  for (let offset = 0; offset < bytes.byteLength;) {
    const end = findFastCdcBoundary(
      bytes,
      offset,
      minSize,
      targetSize,
      maxSize,
    );
    const slice = bytes.slice(offset, end);
    chunks.push({ plainSize: slice.byteLength, bytes: slice });
    offset = end;
  }
  return chunks;
}

export async function* chunkPlaintextStream(
  stream: ReadableStream<Uint8Array>,
  minSize = CHUNK_MIN_BYTES,
  targetSize = CHUNK_TARGET_BYTES,
  maxSize = CHUNK_MAX_BYTES,
): AsyncGenerator<{ plainSize: number; bytes: Uint8Array }> {
  validateChunkSizes(minSize, targetSize, maxSize);
  const reader = stream.getReader();
  let buffered: Uint8Array = new Uint8Array(0);
  const sourceChunkLimit = MAX_BUFFERED_SYNC_BYTES - 2 * maxSize;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (value && value.byteLength > sourceChunkLimit) {
        throw new Error(
          `Vault read chunk exceeds the ${sourceChunkLimit}-byte streaming safety limit`,
        );
      }
      let inputOffset = 0;
      while (value && inputOffset < value.byteLength) {
        const take = Math.min(
          value.byteLength - inputOffset,
          maxSize - buffered.byteLength,
        );
        buffered = appendBytes(
          buffered,
          value.subarray(inputOffset, inputOffset + take),
        );
        inputOffset += take;
        if (buffered.byteLength === maxSize) {
          const boundary = findFastCdcBoundary(
            buffered,
            0,
            minSize,
            targetSize,
            maxSize,
            false,
          );
          const bytes = buffered.slice(0, boundary);
          buffered = buffered.slice(boundary);
          yield { plainSize: bytes.byteLength, bytes };
        }
      }
      if (done) break;
    }
    if (buffered.byteLength > 0) {
      yield { plainSize: buffered.byteLength, bytes: buffered };
    }
  } finally {
    reader.releaseLock();
  }
}

export function contentFingerprint(bytes: Uint8Array): string {
  return sha256Hex(bytes);
}

function parseFileContent(value: unknown, fallbackEpoch: number): FileContent {
  const record = asRecord(value);
  if (record.mode === "single" && typeof record.object === "string") {
    requireObjectHash(record.object);
    return {
      mode: "single",
      object: record.object,
      epoch:
        record.epoch === undefined
          ? fallbackEpoch
          : positiveInteger(record.epoch, "File content epoch"),
      contentId:
        typeof record.contentId === "string" ? record.contentId : undefined,
    };
  }
  if (record.mode === "chunks" && Array.isArray(record.chunks)) {
    if (
      record.algorithm !== undefined &&
      record.algorithm !== "fastcdc-v1" &&
      record.algorithm !== "fixed-v1"
    )
      throw new Error("Unsupported chunk algorithm");
    if (record.chunks.length < 1 || record.chunks.length > 100_000)
      throw new Error("Invalid chunk count");
    const legacyChunkSize =
      typeof record.chunkSize === "number" ? record.chunkSize : CHUNK_MAX_BYTES;
    validateChunkSizes(
      typeof record.minSize === "number" ? record.minSize : legacyChunkSize,
      typeof record.targetSize === "number"
        ? record.targetSize
        : legacyChunkSize,
      typeof record.maxSize === "number" ? record.maxSize : legacyChunkSize,
    );
    return {
      mode: "chunks",
      algorithm: record.algorithm === "fastcdc-v1" ? "fastcdc-v1" : "fixed-v1",
      minSize:
        typeof record.minSize === "number" ? record.minSize : legacyChunkSize,
      targetSize:
        typeof record.targetSize === "number"
          ? record.targetSize
          : legacyChunkSize,
      maxSize:
        typeof record.maxSize === "number" ? record.maxSize : legacyChunkSize,
      chunks: record.chunks.map((chunk) => {
        const item = asRecord(chunk);
        if (
          typeof item.object !== "string" ||
          typeof item.plainSize !== "number"
        ) {
          throw new Error("Chunk descriptor is incomplete");
        }
        requireObjectHash(item.object);
        if (
          !Number.isSafeInteger(item.plainSize) ||
          item.plainSize < 0 ||
          item.plainSize > CHUNK_MAX_BYTES
        )
          throw new Error("Invalid chunk size");
        return {
          object: item.object,
          plainSize: item.plainSize,
          epoch:
            item.epoch === undefined
              ? fallbackEpoch
              : positiveInteger(item.epoch, "Chunk epoch"),
          contentId:
            typeof item.contentId === "string" ? item.contentId : undefined,
        };
      }),
    };
  }
  throw new Error("Unsupported file content mode");
}

function requireObjectHash(value: string): void {
  if (!/^[0-9a-f]{64}$/u.test(value))
    throw new Error("Invalid ciphertext object hash");
}

const FASTCDC_GEAR = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = (0x9e3779b9 ^ index) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0;
  return (value ^ (value >>> 15)) >>> 0;
});

function findFastCdcBoundary(
  bytes: Uint8Array,
  start: number,
  minSize: number,
  targetSize: number,
  maxSize: number,
  final = true,
): number {
  const remaining = bytes.byteLength - start;
  if (final && remaining <= maxSize) return bytes.byteLength;
  const minimum = start + minSize;
  const normal = Math.min(start + targetSize, bytes.byteLength);
  const maximum = Math.min(start + maxSize, bytes.byteLength);
  let hash = 0;
  for (let index = minimum; index < normal; index += 1) {
    hash = ((hash >>> 1) + FASTCDC_GEAR[bytes[index]!]!) >>> 0;
    if ((hash & 0x00ff_ffff) === 0) return index + 1;
  }
  for (let index = normal; index < maximum; index += 1) {
    hash = ((hash >>> 1) + FASTCDC_GEAR[bytes[index]!]!) >>> 0;
    if ((hash & 0x003f_ffff) === 0) return index + 1;
  }
  return maximum;
}

function appendBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  if (left.byteLength === 0) return right.slice();
  const joined = new Uint8Array(left.byteLength + right.byteLength);
  joined.set(left);
  joined.set(right, left.byteLength);
  return joined;
}

function validateChunkSizes(
  minSize: number,
  targetSize: number,
  maxSize: number,
): void {
  if (
    !Number.isSafeInteger(minSize) ||
    !Number.isSafeInteger(targetSize) ||
    !Number.isSafeInteger(maxSize) ||
    minSize < 1 ||
    minSize > targetSize ||
    targetSize > maxSize
  ) {
    throw new Error("Invalid FastCDC chunk bounds");
  }
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object");
  }
  return value as Record<string, unknown>;
}
