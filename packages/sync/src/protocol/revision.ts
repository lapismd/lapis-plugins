// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import { verifySignedEvent } from "./event-signatures.js";
export { verifySignedEvent } from "./event-signatures.js";
import {
  HEAD_KIND,
  REVISION_KIND,
  REVISION_SCHEMA_VERSION,
  TRANSPORT_ENVELOPE_SCHEMA_VERSION,
} from "./constants.js";
import { vaultHeadTag, vaultScopeTag } from "./constants.js";
import { canonicalize } from "./canonical-json.js";
import { bytesToHex as toHex } from "@noble/hashes/utils.js";
import type { SyncCryptoProvider } from "./crypto-provider.js";
import type { SignedNostrEvent } from "./types.js";

export type RevisionChange = {
  fileId: string;
  operation: "create" | "modify" | "rename" | "delete";
};

export type RevisionParent = {
  eventId: string;
  archiveHash: string;
};

export type RevisionPayload = {
  schemaVersion: typeof REVISION_SCHEMA_VERSION;
  vaultId: string;
  keyEpoch: number;
  currentEpoch: number;
  membershipGeneration: number;
  parents: RevisionParent[];
  root: string;
  changes: RevisionChange[];
  message: string;
  reason:
    | "autosave"
    | "checkpoint"
    | "restore-file"
    | "restore-vault"
    | "merge";
  client: { protocolVersion: number };
};

export type HeadPayload = {
  schemaVersion: typeof REVISION_SCHEMA_VERSION;
  vaultId: string;
  revisionEventId: string;
  revisionArchiveHash: string;
  root: string;
  keyEpoch: number;
  currentEpoch: number;
  membershipGeneration: number;
};

export type DeviceTransportEnvelope = {
  schemaVersion: typeof TRANSPORT_ENVELOPE_SCHEMA_VERSION;
  type: "lapis-sync-device-attestation";
  deviceEvent: SignedNostrEvent;
};

export type UnwrappedDeviceTransportEvent = {
  transportEvent: SignedNostrEvent;
  deviceEvent: SignedNostrEvent;
  legacy: boolean;
};

export function parseRevisionPayload(value: unknown): RevisionPayload {
  const record = asRecord(value);
  if (
    record.schemaVersion !== 1 &&
    record.schemaVersion !== REVISION_SCHEMA_VERSION
  ) {
    throw new Error("Unsupported revision schema");
  }
  if (typeof record.vaultId !== "string" || typeof record.root !== "string") {
    throw new Error("Revision payload is incomplete");
  }
  const keyEpoch = positiveInteger(record.keyEpoch, "Revision key epoch");
  return {
    ...(record as Omit<
      RevisionPayload,
      "schemaVersion" | "keyEpoch" | "currentEpoch" | "membershipGeneration"
    >),
    schemaVersion: REVISION_SCHEMA_VERSION,
    keyEpoch,
    currentEpoch:
      record.schemaVersion === 1
        ? keyEpoch
        : positiveInteger(record.currentEpoch, "Revision current epoch"),
    membershipGeneration:
      record.schemaVersion === 1
        ? 0
        : nonNegativeInteger(
            record.membershipGeneration,
            "Revision membership generation",
          ),
  };
}

export function parseHeadPayload(value: unknown): HeadPayload {
  const record = asRecord(value);
  if (
    record.schemaVersion !== 1 &&
    record.schemaVersion !== REVISION_SCHEMA_VERSION
  ) {
    throw new Error("Unsupported head schema");
  }
  if (
    typeof record.vaultId !== "string" ||
    typeof record.revisionEventId !== "string" ||
    typeof record.root !== "string"
  ) {
    throw new Error("HEAD payload is incomplete");
  }
  const keyEpoch = positiveInteger(record.keyEpoch, "HEAD key epoch");
  return {
    ...(record as Omit<
      HeadPayload,
      "schemaVersion" | "keyEpoch" | "currentEpoch" | "membershipGeneration"
    >),
    schemaVersion: REVISION_SCHEMA_VERSION,
    keyEpoch,
    currentEpoch:
      record.schemaVersion === 1
        ? keyEpoch
        : positiveInteger(record.currentEpoch, "HEAD current epoch"),
    membershipGeneration:
      record.schemaVersion === 1
        ? 0
        : nonNegativeInteger(
            record.membershipGeneration,
            "HEAD membership generation",
          ),
  };
}

export async function signRevisionEvent(options: {
  crypto: SyncCryptoProvider;
  vaultId: string;
  payload: RevisionPayload;
  createdAt: number;
  fileIds?: string[];
}): Promise<SignedNostrEvent> {
  const tags: string[][] = [["d", vaultScopeTag(options.vaultId)]];
  for (const fileId of options.fileIds ?? []) {
    tags.push(["f", fileId]);
  }
  const encrypted = await options.crypto.encryptObject({
    epoch: options.payload.keyEpoch,
    type: "revision-payload",
    plaintext: new TextEncoder().encode(canonicalize(options.payload)),
  });
  const deviceEvent = await options.crypto.signDeviceEvent({
    kind: REVISION_KIND,
    created_at: options.createdAt,
    tags,
    content: toHex(encrypted.bytes),
  });
  return wrapDeviceTransportEvent(options.crypto, deviceEvent);
}

export async function signHeadEvent(options: {
  crypto: SyncCryptoProvider;
  vaultId: string;
  payload: HeadPayload;
  createdAt: number;
}): Promise<SignedNostrEvent> {
  const encrypted = await options.crypto.encryptObject({
    epoch: options.payload.keyEpoch,
    type: "head-payload",
    plaintext: new TextEncoder().encode(canonicalize(options.payload)),
  });
  const tags = [
    ["d", vaultHeadTag(options.vaultId, options.crypto.publicKey)],
    ["v", vaultScopeTag(options.vaultId)],
  ];
  const deviceEvent = await options.crypto.signDeviceEvent({
    kind: HEAD_KIND,
    created_at: options.createdAt,
    tags,
    content: toHex(encrypted.bytes),
  });
  return wrapDeviceTransportEvent(options.crypto, deviceEvent);
}

export function unwrapDeviceTransportEvent(
  event: SignedNostrEvent,
  expectedKind: typeof REVISION_KIND | typeof HEAD_KIND,
): UnwrappedDeviceTransportEvent {
  verifySignedEvent(event);
  if (event.kind !== expectedKind) {
    throw new Error(
      "Transport event kind does not match the expected protocol kind",
    );
  }
  if (!event.content.trimStart().startsWith("{")) {
    return { transportEvent: event, deviceEvent: event, legacy: true };
  }
  let envelope: DeviceTransportEnvelope;
  try {
    envelope = JSON.parse(event.content) as DeviceTransportEnvelope;
  } catch {
    throw new Error("Sync transport envelope is invalid JSON");
  }
  if (
    envelope.schemaVersion !== TRANSPORT_ENVELOPE_SCHEMA_VERSION ||
    envelope.type !== "lapis-sync-device-attestation" ||
    !envelope.deviceEvent
  ) {
    throw new Error("Unsupported sync transport envelope");
  }
  verifySignedEvent(envelope.deviceEvent);
  if (
    envelope.deviceEvent.kind !== event.kind ||
    envelope.deviceEvent.created_at !== event.created_at ||
    canonicalize(envelope.deviceEvent.tags) !== canonicalize(event.tags)
  ) {
    throw new Error(
      "Sync transport and device attestation metadata do not match",
    );
  }
  return {
    transportEvent: event,
    deviceEvent: envelope.deviceEvent,
    legacy: false,
  };
}

async function wrapDeviceTransportEvent(
  crypto: SyncCryptoProvider,
  deviceEvent: SignedNostrEvent,
): Promise<SignedNostrEvent> {
  const envelope: DeviceTransportEnvelope = {
    schemaVersion: TRANSPORT_ENVELOPE_SCHEMA_VERSION,
    type: "lapis-sync-device-attestation",
    deviceEvent,
  };
  return crypto.signTransportEvent({
    kind: deviceEvent.kind,
    created_at: deviceEvent.created_at,
    tags: deviceEvent.tags.map((tag) => [...tag]),
    content: canonicalize(envelope),
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object");
  }
  return value as Record<string, unknown>;
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}
