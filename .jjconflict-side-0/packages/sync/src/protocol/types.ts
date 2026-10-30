// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
export type BlobRef = { hash: string; size: number };

export interface BlobStore {
  has(hash: string): Promise<boolean>;
  put(bytes: Uint8Array): Promise<BlobRef>;
  get(hash: string): Promise<Uint8Array>;
}

export type SignedNostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

export type EventFingerprint = { id: string; created_at: number };

export type VaultScope = { vaultId: string };

export type NostrEventFilter = {
  ids?: string[];
  kinds?: number[];
  authors?: string[];
  "#d"?: string[];
  "#p"?: string[];
  "#v"?: string[];
  since?: number;
};

export type ReconciliationResult = {
  missingLocalIds: string[];
  missingRemoteIds: string[];
  usedNegentropy: boolean;
};

export interface RevisionTransport {
  publishEvent?(event: SignedNostrEvent): Promise<void>;
  publishRevision(event: SignedNostrEvent): Promise<void>;
  publishHead(event: SignedNostrEvent): Promise<void>;
  listHeads(vault: VaultScope): Promise<SignedNostrEvent[]>;
  fetchEvents(ids: string[]): Promise<SignedNostrEvent[]>;
  listRevisionIds(vault: VaultScope): Promise<string[]>;
  reconcile?(
    scope: VaultScope,
    localEvents: Iterable<EventFingerprint>,
  ): Promise<ReconciliationResult>;
  subscribe(
    scope: VaultScope,
    handler: (event: SignedNostrEvent) => void,
  ): Promise<() => void>;
  relayInfo?(): Promise<{ supportedNips: number[] }>;
  queryEvents?(filter: NostrEventFilter): Promise<SignedNostrEvent[]>;
  subscribeEvents?(
    filter: NostrEventFilter,
    handler: (event: SignedNostrEvent) => void,
  ): Promise<() => void>;
}
