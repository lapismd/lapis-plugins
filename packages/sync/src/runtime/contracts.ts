import type { SyncCryptoProvider } from "../protocol/crypto-provider.js";
import type { BlobStore, SignedNostrEvent } from "../protocol/types.js";
import type { RevisionPayload, RevisionChange } from "../protocol/revision.js";
import type {
  LocalObjectIndex,
  StreamingVaultFile,
} from "../objects/object-graph.js";
import type { MergeDraft } from "./merge.js";
import type {
  ApplyIntent,
  StoredHead,
  SyncApplyAccess,
} from "./incoming-contracts.js";

/** This repository is durable user data, independent of disposable host indexes. */
export interface LocalSyncRepository {
  readonly blobs: BlobStore;
  readState(): Promise<SealedLocalState | null>;
  /** Atomically replace and durably acknowledge the record, or return false. */
  compareAndSwap(
    expectedVersion: number,
    next: SealedLocalState,
    authority?: LocalOperationAuthority,
  ): Promise<boolean>;
}

export interface SealedLocalState {
  version: number;
  epoch: number;
  ciphertext: Uint8Array;
}

/** Hosts provide identities and generation-guarded streams; keys remain opaque. */
export interface SyncVaultSource {
  flushOpenEditor(): Promise<void>;
  list(): Promise<StreamingVaultFile[]>;
  readonly apply?: SyncApplyAccess;
}

export interface LocalEndpointAuthority {
  unlocked: boolean;
  enrolled: boolean;
  active: boolean;
  vaultId: string;
  devicePublicKey: string;
  syncPublicKey: string;
  epoch: number;
  membershipGeneration: number;
}

/** Public endpoint metadata captured before host admission; never part of wire records. */
export type LocalOperationAuthority = Pick<
  LocalEndpointAuthority,
  "vaultId" | "devicePublicKey" | "epoch" | "membershipGeneration"
>;

export interface LocalEngineOptions {
  vaultId: string;
  repository: LocalSyncRepository;
  vault: SyncVaultSource;
  crypto: SyncCryptoProvider;
  authority(): Promise<LocalEndpointAuthority>;
  now?: () => number;
}

export interface StoredRevision {
  event: SignedNostrEvent;
  archiveHash: string;
  payload: RevisionPayload;
}

export interface OutboxEntry {
  revisionEventId: string;
  head: SignedNostrEvent;
  objectHashes: string[];
  expectedHeadEventId: string | null;
}

export interface LocalEngineState {
  schemaVersion: 1;
  vaultId: string;
  devicePublicKey: string;
  index: LocalObjectIndex;
  revisions: Record<string, StoredRevision>;
  outbox: OutboxEntry[];
  localRevisionId: string | null;
  appliedRevisionId: string | null;
  publishedHeadEventId: string | null;
  lastCreatedAt: number;
  mergeDraft: MergeDraft | null;
  heads: Record<string, StoredHead>;
  applyIntent: ApplyIntent | null;
}

export interface PublicationReceipt {
  eventId: string;
  state: "staged" | "accepted" | "applied";
}

/** Destination transport details never enter the shared revision/object formats. */
export interface SyncPublicationDestination {
  readonly blobs: BlobStore;
  publishRevision(event: SignedNostrEvent): Promise<PublicationReceipt>;
  publishHead(
    event: SignedNostrEvent,
    options: {
      expectedHeadEventId: string | null;
    },
  ): Promise<PublicationReceipt>;
}

export interface CheckpointOptions {
  message?: string;
  reason?: RevisionPayload["reason"];
  parents?: RevisionPayload["parents"];
}

export function diffFileIdentities(
  before: LocalObjectIndex,
  after: LocalObjectIndex,
): RevisionChange[] {
  const previous = new Map(
    Object.entries(before.paths).map(([path, record]) => [
      record.fileId,
      { path, record },
    ]),
  );
  const current = new Map(
    Object.entries(after.paths).map(([path, record]) => [
      record.fileId,
      { path, record },
    ]),
  );
  const changes: RevisionChange[] = [];
  for (const [fileId, next] of current) {
    const prior = previous.get(fileId);
    if (!prior) changes.push({ fileId, operation: "create" });
    else if (prior.path !== next.path)
      changes.push({ fileId, operation: "rename" });
    else if (prior.record.fileManifestHash !== next.record.fileManifestHash)
      changes.push({ fileId, operation: "modify" });
  }
  for (const fileId of previous.keys()) {
    if (!current.has(fileId)) changes.push({ fileId, operation: "delete" });
  }
  return changes.sort((left, right) => left.fileId.localeCompare(right.fileId));
}
