import { canonicalize } from "../protocol/canonical-json.js";
import { sha256Hex } from "../protocol/bytes.js";
import { emptyIndex } from "../objects/object-graph.js";
import type {
  LocalEngineOptions,
  LocalEngineState,
  LocalEndpointAuthority,
  LocalOperationAuthority,
} from "./contracts.js";

export function operationAuthority(
  authority: LocalEndpointAuthority,
): LocalOperationAuthority {
  return {
    vaultId: authority.vaultId,
    devicePublicKey: authority.devicePublicKey,
    epoch: authority.epoch,
    membershipGeneration: authority.membershipGeneration,
  };
}

export async function requireAuthority(
  options: LocalEngineOptions,
): Promise<LocalEndpointAuthority> {
  const authority = await options.authority();
  if (
    !authority.enrolled ||
    !authority.unlocked ||
    !authority.active ||
    authority.vaultId !== options.vaultId ||
    authority.devicePublicKey !== options.crypto.publicKey ||
    authority.syncPublicKey !== options.crypto.syncPublicKey ||
    !Number.isSafeInteger(authority.epoch) ||
    authority.epoch < 1 ||
    !Number.isSafeInteger(authority.membershipGeneration) ||
    authority.membershipGeneration < 0
  ) {
    throw new Error(
      "Sync requires an active, enrolled, unlocked endpoint for this vault",
    );
  }
  return structuredClone(authority);
}

export function emptyLocalState(options: LocalEngineOptions): LocalEngineState {
  return {
    schemaVersion: 1,
    vaultId: options.vaultId,
    devicePublicKey: options.crypto.publicKey,
    index: emptyIndex(),
    revisions: {},
    outbox: [],
    localRevisionId: null,
    appliedRevisionId: null,
    publishedHeadEventId: null,
    lastCreatedAt: 0,
    mergeDraft: null,
    heads: {},
    applyIntent: null,
  };
}

export async function readLocalState(
  options: LocalEngineOptions,
): Promise<{ state: LocalEngineState; version: number }> {
  await requireAuthority(options);
  const record = await options.repository.readState();
  if (!record) return { state: emptyLocalState(options), version: 0 };
  if (
    !Number.isSafeInteger(record.version) ||
    record.version < 1 ||
    !Number.isSafeInteger(record.epoch) ||
    record.epoch < 1
  )
    throw new Error("Invalid local state record");
  const plaintext = await options.crypto.decryptObject({
    epoch: record.epoch,
    type: "local-state",
    envelope: record.ciphertext,
  });
  let sealed: { version: number; epoch: number; state: LocalEngineState };
  try {
    sealed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(plaintext),
    );
  } finally {
    plaintext.fill(0);
  }
  if (
    !sealed ||
    sealed.version !== record.version ||
    sealed.epoch !== record.epoch
  )
    throw new Error(
      "Local state version does not belong to this sealed record",
    );
  const state = sealed.state;
  if (
    !state ||
    state.schemaVersion !== 1 ||
    state.vaultId !== options.vaultId ||
    state.devicePublicKey !== options.crypto.publicKey ||
    !Array.isArray(state.outbox) ||
    !state.index ||
    !state.revisions ||
    !Number.isSafeInteger(state.lastCreatedAt)
  ) {
    throw new Error("Local state does not belong to this vault and device");
  }
  // Additive local-state migration; no signed event or object is rewritten.
  state.heads ??= {};
  state.applyIntent ??= null;
  return { state, version: record.version };
}

export async function writeLocalState(
  options: LocalEngineOptions,
  version: number,
  state: LocalEngineState,
  expected?: Pick<LocalEndpointAuthority, "epoch" | "membershipGeneration">,
): Promise<number> {
  const authority = await requireAuthority(options);
  if (
    expected &&
    (authority.epoch !== expected.epoch ||
      authority.membershipGeneration !== expected.membershipGeneration)
  )
    throw new Error("Endpoint authority changed before saving local history");
  const plaintext = new TextEncoder().encode(
    canonicalize({ version: version + 1, epoch: authority.epoch, state }),
  );
  let encrypted: Awaited<ReturnType<typeof options.crypto.encryptObject>>;
  try {
    encrypted = await options.crypto.encryptObject({
      epoch: authority.epoch,
      type: "local-state",
      plaintext,
    });
  } finally {
    plaintext.fill(0);
  }
  if (
    encrypted.bytes.length < 42 ||
    encrypted.bytes[0] !== 1 ||
    encrypted.bytes[1] !== 8 ||
    sha256Hex(encrypted.bytes) !== encrypted.objectHash
  )
    throw new Error(
      "Host does not support authenticated local-state encryption",
    );
  // Lock or membership changes during encryption cannot commit new local history.
  const current = await requireAuthority(options);
  if (
    current.epoch !== authority.epoch ||
    current.membershipGeneration !== authority.membershipGeneration
  )
    throw new Error("Endpoint authority changed while saving local history");
  const applied = await options.repository.compareAndSwap(
    version,
    {
      version: version + 1,
      epoch: authority.epoch,
      ciphertext: encrypted.bytes,
    },
    operationAuthority(authority),
  );
  if (!applied)
    throw new Error("Local sync state changed; reopen before retrying");
  return version + 1;
}
