// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
export const PROTOCOL_VERSION = 3;
export const REVISION_SCHEMA_VERSION = 2;
export const TRANSPORT_ENVELOPE_SCHEMA_VERSION = 1;
export const MANIFEST_SCHEMA_VERSION = 2;
export const ENCRYPTION_ENVELOPE_VERSION = 1;
export const REVISION_KIND = 78;
export const HEAD_KIND = 30078;
export const VAULT_D_PREFIX = "lapis-sync-v1";
export const CHUNK_MIN_BYTES = 4 * 1024 * 1024;
export const CHUNK_TARGET_BYTES = 8 * 1024 * 1024;
export const CHUNK_MAX_BYTES = 16 * 1024 * 1024;
export const MAX_BUFFERED_SYNC_BYTES = 64 * 1024 * 1024;
export const QUIET_PERIOD_MS = 20_000;
export const MAX_UNCOMMITTED_MS = 5 * 60_000;

export const ADR_DEFAULTS = {
  encoding: "canonical-json",
  objectCrypto: "hkdf-sha256-xchacha20poly1305",
  eventCrypto: "vault-scoped-aead",
  fileTagsDefault: false,
  unicode: "nfc",
  archiveQuorum: 1,
  staleHeadPolicy: "active-until-revoked",
} as const;

export function vaultScopeTag(vaultId: string): string {
  return `${VAULT_D_PREFIX}:${vaultId}`;
}

export function vaultHeadTag(
  vaultId: string,
  devicePublicKey?: string,
): string {
  const legacy = `${VAULT_D_PREFIX}:${vaultId}:head`;
  return devicePublicKey ? `${legacy}:${devicePublicKey}` : legacy;
}
