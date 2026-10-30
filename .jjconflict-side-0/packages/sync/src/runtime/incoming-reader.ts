import { hexToBytes } from "@noble/hashes/utils.js";
import { sha256Hex } from "../protocol/bytes.js";
import {
  vaultHeadTag,
  vaultScopeTag,
  PROTOCOL_VERSION,
} from "../protocol/constants.js";
import {
  parseHeadPayload,
  parseRevisionPayload,
  unwrapDeviceTransportEvent,
  type HeadPayload,
  type RevisionPayload,
} from "../protocol/revision.js";
import {
  compareReplaceableEvents,
  replaceableEventAddress,
} from "../protocol/replaceable.js";
import type { BlobStore, SignedNostrEvent } from "../protocol/types.js";
import { inspectObjectGraph, isIgnoredPath } from "../objects/object-graph.js";
import type { LocalEngineOptions, LocalEngineState } from "./contracts.js";
import type {
  AuthorizedIncomingRecord,
  SyncIncomingAuthority,
} from "./incoming-contracts.js";
import { canonicalize } from "../protocol/canonical-json.js";
import {
  historyAuthorityContext,
  revisionAuthorityRecord,
} from "./history-context.js";

const HASH = /^[0-9a-f]{64}$/u;
const MAX_ARCHIVE_BYTES = 4 * 1024 * 1024;

export function cachedIncomingObjects(
  options: LocalEngineOptions,
  source: BlobStore,
): BlobStore {
  const local = options.repository.blobs;
  return {
    has: (hash) => local.has(hash),
    put: (bytes) => local.put(bytes),
    async get(hash) {
      if (!HASH.test(hash)) throw new Error("Invalid incoming object hash");
      const present = await local.has(hash);
      const bytes = await (present ? local.get(hash) : source.get(hash));
      if (bytes.byteLength > 32 * 1024 * 1024 + 64 || sha256Hex(bytes) !== hash)
        throw new Error("Corrupt incoming object");
      if (present) return bytes;
      const stored = await local.put(bytes);
      if (stored.hash !== hash || stored.size !== bytes.byteLength)
        throw new Error("Incoming object was not stored intact");
      return bytes;
    },
  };
}

export async function decryptIncoming(
  options: LocalEngineOptions,
  policy: SyncIncomingAuthority,
  type: "revision-payload" | "head-payload" | "revision-archive",
  envelope: Uint8Array,
): Promise<{ value: unknown; epoch: number }> {
  if (envelope.byteLength > MAX_ARCHIVE_BYTES)
    throw new Error("Incoming record exceeds size limit");
  const epochs = [...new Set(await policy.keyEpochs())];
  if (
    epochs.length === 0 ||
    epochs.length > 1024 ||
    epochs.some((epoch) => !Number.isSafeInteger(epoch) || epoch < 1)
  )
    throw new Error("Invalid installed key epoch set");
  for (const epoch of epochs) {
    let plaintext: Uint8Array;
    try {
      plaintext = await options.crypto.decryptObject({ epoch, type, envelope });
    } catch {
      continue;
    }
    try {
      return {
        value: JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(plaintext),
        ),
        epoch,
      };
    } finally {
      plaintext.fill(0);
    }
  }
  throw new Error(
    "Incoming ciphertext cannot be authenticated with installed keys",
  );
}

async function readRecord(
  options: LocalEngineOptions,
  policy: SyncIncomingAuthority,
  event: SignedNostrEvent,
  kind: 78 | 30078,
): Promise<AuthorizedIncomingRecord> {
  if (
    typeof event?.content !== "string" ||
    event.content.length > MAX_ARCHIVE_BYTES ||
    event.tags?.length > 256
  )
    throw new Error("Incoming event exceeds size limit");
  const unwrapped = unwrapDeviceTransportEvent(structuredClone(event), kind);
  const device = unwrapped.deviceEvent;
  const d = event.tags.find((tag) => tag[0] === "d")?.[1];
  const scope = vaultScopeTag(options.vaultId);
  if (
    kind === 78
      ? d !== scope
      : (d !== vaultHeadTag(options.vaultId) &&
          d !== vaultHeadTag(options.vaultId, device.pubkey)) ||
        (d === vaultHeadTag(options.vaultId, device.pubkey) &&
          !event.tags.some((tag) => tag[0] === "v" && tag[1] === scope))
  )
    throw new Error("Incoming event vault scope mismatch");
  if (!/^(?:[0-9a-f]{2})+$/u.test(device.content))
    throw new Error("Incoming encrypted payload is not hexadecimal");
  const decrypted = await decryptIncoming(
    options,
    policy,
    kind === 78 ? "revision-payload" : "head-payload",
    hexToBytes(device.content),
  );
  const payload =
    kind === 78
      ? parseRevisionPayload(decrypted.value)
      : parseHeadPayload(decrypted.value);
  validatePayload(payload, kind);
  if (
    payload.vaultId !== options.vaultId ||
    payload.keyEpoch !== decrypted.epoch
  )
    throw new Error("Incoming payload vault or epoch mismatch");
  const record = {
    event: structuredClone(event),
    devicePublicKey: device.pubkey,
    legacy: unwrapped.legacy,
    payload,
  };
  return record;
}

function validatePayload(payload: HeadPayload | RevisionPayload, kind: number) {
  if (!HASH.test(payload.root)) throw new Error("Invalid incoming root hash");
  if (kind === 30078) {
    const head = payload as HeadPayload;
    if (
      !HASH.test(head.revisionEventId) ||
      !HASH.test(head.revisionArchiveHash)
    )
      throw new Error("Invalid incoming HEAD reference");
  } else {
    const revision = payload as RevisionPayload;
    if (
      !Array.isArray(revision.parents) ||
      revision.parents.length > 64 ||
      revision.parents.some(
        (parent) =>
          !parent ||
          !HASH.test(parent.eventId) ||
          !HASH.test(parent.archiveHash),
      ) ||
      new Set(revision.parents.map((parent) => parent.eventId)).size !==
        revision.parents.length
    )
      throw new Error("Invalid incoming revision ancestry");
    if (
      !Array.isArray(revision.changes) ||
      revision.changes.length > 100_000 ||
      revision.changes.some(
        (change) =>
          !change ||
          typeof change.fileId !== "string" ||
          !change.fileId ||
          !["create", "modify", "rename", "delete"].includes(change.operation),
      )
    )
      throw new Error("Invalid incoming revision changes");
    if (
      typeof revision.message !== "string" ||
      revision.message.length > 1024 * 1024 ||
      ![
        "autosave",
        "checkpoint",
        "restore-file",
        "restore-vault",
        "merge",
      ].includes(revision.reason) ||
      !Number.isSafeInteger(revision.client?.protocolVersion) ||
      revision.client.protocolVersion < 1 ||
      revision.client.protocolVersion > PROTOCOL_VERSION
    )
      throw new Error("Unsupported incoming revision payload");
  }
}

/** Download, authenticate and durably stage an entire ancestry before returning new state. */
export async function ingestIncomingHeads(
  options: LocalEngineOptions,
  current: LocalEngineState,
  heads: SignedNostrEvent[],
  source: BlobStore,
  policy: SyncIncomingAuthority,
): Promise<LocalEngineState> {
  if (
    !policy ||
    typeof policy.authorize !== "function" ||
    typeof policy.keyEpochs !== "function"
  )
    throw new Error("Incoming history requires enrolled membership authority");
  if (heads.length > 1024) throw new Error("Incoming HEAD page exceeds limit");
  const state = structuredClone(current),
    blobs = cachedIncomingObjects(options, source);
  const incomingHeads: AuthorizedIncomingRecord[] = [];
  const visiting = new Set<string>();
  let visited = 0;
  const loadRevision = async (
    id: string,
    archiveHash: string,
  ): Promise<void> => {
    if (++visited > 10_000 || visiting.size > 1024)
      throw new Error("Incoming ancestry traversal limit exceeded");
    if (visiting.has(id)) throw new Error("Cyclic incoming ancestry");
    const known = state.revisions[id];
    if (known) {
      if (known.archiveHash === archiveHash) return;
      // The original protocol permits differently encrypted archives of one signed event.
      const alias = await decryptIncoming(
        options,
        policy,
        "revision-archive",
        await blobs.get(archiveHash),
      );
      const event = alias.value as SignedNostrEvent;
      unwrapDeviceTransportEvent(event, 78);
      if (canonicalize(event) !== canonicalize(known.event))
        throw new Error("Conflicting archive record");
      return;
    }
    visiting.add(id);
    try {
      const archive = await blobs.get(archiveHash);
      const decrypted = await decryptIncoming(
        options,
        policy,
        "revision-archive",
        archive,
      );
      const event = decrypted.value as SignedNostrEvent;
      if (event?.id !== id)
        throw new Error("Revision archive event ID mismatch");
      const record = await readRecord(options, policy, event, 78);
      const payload = record.payload as RevisionPayload;
      for (const parent of payload.parents)
        await loadRevision(parent.eventId, parent.archiveHash);
      const graph = await inspectObjectGraph({
        rootHash: payload.root,
        epoch: payload.keyEpoch,
        crypto: options.crypto,
        blobs,
      });
      for (const file of graph.files) {
        if (isIgnoredPath(file.path))
          throw new Error("Incoming graph includes excluded configuration");
        const reader = file.openRead().getReader();
        try {
          while (!(await reader.read()).done) {
            /* Authenticate and cache every content chunk before acceptance. */
          }
        } finally {
          reader.releaseLock();
        }
      }
      state.revisions[id] = {
        event: structuredClone(event),
        archiveHash,
        payload,
      };
    } finally {
      visiting.delete(id);
    }
  };
  for (const raw of heads) {
    const head = await readRecord(options, policy, raw, 30078);
    const payload = head.payload as HeadPayload;
    incomingHeads.push(head);
    await loadRevision(payload.revisionEventId, payload.revisionArchiveHash);
    if (state.revisions[payload.revisionEventId].payload.root !== payload.root)
      throw new Error("HEAD root does not match its revision");
    const address = replaceableEventAddress(raw),
      previous = state.heads[address];
    if (!previous || compareReplaceableEvents(raw, previous.event) < 0)
      state.heads[address] = { ...head, payload };
  }
  // Cutoff proofs need the authenticated graph, including ancestors just downloaded.
  // No candidate state is persisted until every reachable revision and HEAD is authorized.
  const context = historyAuthorityContext(state),
    checked = new Set<string>();
  const pending = incomingHeads.map(
    (head) => (head.payload as HeadPayload).revisionEventId,
  );
  while (pending.length) {
    const id = pending.pop()!;
    if (checked.has(id)) continue;
    checked.add(id);
    if (checked.size > 100_000)
      throw new Error("Incoming authority traversal limit exceeded");
    const revision = state.revisions[id];
    if (
      !revision ||
      (await policy.authorize(revisionAuthorityRecord(revision), context)) !==
        true
    )
      throw new Error("Incoming participant is not authorized");
    pending.push(...revision.payload.parents.map((parent) => parent.eventId));
  }
  for (const head of incomingHeads)
    if ((await policy.authorize(structuredClone(head), context)) !== true)
      throw new Error("Incoming participant is not authorized");
  return state;
}
