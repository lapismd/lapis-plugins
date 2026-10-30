import type { SignedNostrEvent } from "../protocol/types.js";
import type { HeadPayload, RevisionPayload } from "../protocol/revision.js";
import type { LocalObjectIndex } from "../objects/object-graph.js";
import type { LocalOperationAuthority } from "./contracts.js";

export interface AuthorizedIncomingRecord {
  event: SignedNostrEvent;
  devicePublicKey: string;
  legacy: boolean;
  payload: HeadPayload | RevisionPayload;
}

/** Proofs use authenticated revision edges, never timestamps or provider claims. */
export interface SyncAuthorityContext {
  isAncestorOrEqual(candidate: string, descendant: string): boolean;
}

/** Supplied by the enrolled endpoint after validating owner-authorized membership. */
export interface SyncIncomingAuthority {
  keyEpochs(): Promise<readonly number[]>;
  authorize(
    record: AuthorizedIncomingRecord,
    context: SyncAuthorityContext,
  ): Promise<boolean>;
}

export interface StoredHead extends AuthorizedIncomingRecord {
  payload: HeadPayload;
}

export type ReconciliationPlan =
  | { kind: "clean"; tips: string[] }
  | { kind: "local-changes"; tips: string[] }
  | { kind: "fast-forward"; tips: string[]; targetRevisionId: string }
  | {
      kind: "merge-required";
      tips: string[];
      leftRevisionId: string;
      rightRevisionId: string;
      baseRevisionId: string;
    }
  | {
      kind: "unrelated";
      tips: string[];
      leftRevisionId: string;
      rightRevisionId: string;
    };

export interface FileGeneration {
  fileId: string;
  contentGeneration: number;
  hostFileId?: string;
}
export interface ApplyOperation {
  id: string;
  kind: "write" | "remove";
  path: string;
  expected: FileGeneration | null;
  fileId: string;
}
export interface ApplyReceipt {
  operation: ApplyOperation;
  result: FileGeneration | null;
}

/** The host durably deduplicates operation IDs and applies expected-version guards. */
export interface SyncApplyAccess {
  receipt(
    operationId: string,
    authority?: LocalOperationAuthority,
  ): Promise<ApplyReceipt | null>;
  mutate(
    operation: ApplyOperation,
    source?: ReadableStream<Uint8Array>,
    authority?: LocalOperationAuthority,
  ): Promise<ApplyReceipt>;
}

export interface ApplyIntent {
  id: string;
  revisionEventId: string;
  before: Record<string, FileGeneration>;
  index: LocalObjectIndex;
  operations: ApplyOperation[];
  completed: Record<string, ApplyReceipt>;
}
