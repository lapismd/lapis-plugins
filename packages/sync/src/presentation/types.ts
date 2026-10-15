import type { RevisionPayload } from "../protocol/revision";
import type { SnapshotChangeSet } from "../ui/snapshot-changes";

export type SyncStatus =
  | "disabled"
  | "idle-clean"
  | "idle-dirty"
  | "building-revision"
  | "uploading-objects"
  | "publishing-revision"
  | "publishing-head"
  | "offline"
  | "reconciling"
  | "applying"
  | "conflicted"
  | "recovery-preview"
  | "error-recoverable";
export type RevisionView = {
  eventId: string;
  parents: string[];
  message: string;
  reason: RevisionPayload["reason"];
  createdAt: number;
  root: string;
  author: string;
};
export type DeviceView = {
  publicKey: string;
  alias: string;
  revisionEventId: string;
  lastSeen: number;
  role?: "owner" | "member";
  revoked?: boolean;
};
export type MergeResolution =
  | { choice: "left" | "right" | "base" | "delete" | "keep-both" }
  | { choice: "resolved"; content: string };
export type MergeConflict = {
  id: string;
  path: string;
  kind:
    | "delete-edit"
    | "divergent-rename"
    | "same-path-addition"
    | "binary-change"
    | "text-conflict";
  binary: boolean;
  base: string | null;
  left: string | null;
  right: string | null;
  basePath?: string;
  leftPath?: string;
  rightPath?: string;
};
export type MergeDraft = {
  id: string;
  baseRevisionId: string;
  leftRevisionId: string;
  rightRevisionId: string;
  conflicts: MergeConflict[];
  resolutions: Record<string, MergeResolution>;
};
export type RecoveryPreview = {
  automatic: unknown[];
  localOnly: string[];
  conflicts: Array<{ id: string; remotePath: string; kind: string }>;
};
export type PairingState = {
  stage:
    | "idle"
    | "qr"
    | "scan"
    | "sas"
    | "transfer"
    | "complete"
    | "expired"
    | "error";
  invitationUri: string;
  session: { sessionId: string; sas: string } | null;
  error: string | null;
};
export type SyncSecurity = {
  state: "unavailable" | "unenrolled" | "locked" | "unlocked";
  encrypted: boolean;
  enrolled: boolean;
  role: "owner" | "member" | null;
  syncIdentity: string;
  devicePublicKey: string;
  deviceAlias: string;
  epoch: number | null;
};
export type SyncDestination = {
  provider: "lapis-server";
  url: string;
  managedVaultId: string;
  authenticated: boolean;
  authorized: boolean;
  status: "unconfigured" | "healthy" | "offline" | "error";
  lastSuccessAt: number | null;
  message: string;
};
export type SyncSnapshot = {
  status: SyncStatus;
  vaultId: string;
  localRevisionId: string | null;
  localRoot: string | null;
  effectiveRevisionId: string | null;
  pendingChanges: number;
  pendingFiles: Array<{
    path: string;
    operation: "create" | "modify" | "delete" | "rename";
    previousPath?: string;
  }>;
  pendingUploads: number;
  lastError: string | null;
  pendingReplicaRepairs: number;
  devices: DeviceView[];
  revisions: RevisionView[];
  changeSets: SnapshotChangeSet[];
  mergeDraft: MergeDraft | null;
  recoveryPreview: RecoveryPreview | null;
  pairing: PairingState;
  security: SyncSecurity;
  destination: SyncDestination;
};
export type ManagedVault = {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
};

export type SyncSettings = {
  provider: "lapis-server";
  serverUrl: string;
  managedVaultId: string;
  enabled: boolean;
  indexFileTags: boolean;
};
export type SyncAction =
  | {
      type:
        | "checkpoint"
        | "sync"
        | "test-connection"
        | "begin-pairing"
        | "cancel-pairing"
        | "export-recovery";
    }
  | { type: "restore-file"; revisionId: string; path: string }
  | {
      type: "resolve-merge";
      draftId: string;
      conflictId: string;
      resolution: MergeResolution;
    }
  | { type: "publish-merge"; draftId: string }
  | { type: "revoke-device"; publicKey: string }
  | { type: "accept-pairing"; invitation: string; alias: string }
  | { type: "confirm-pairing"; sessionId: string; sas: string }
  | { type: "preview-recovery"; file: File }
  | {
      type: "apply-recovery";
      choices: Record<string, "remote" | "local" | "keep-both">;
    };

/** Endpoint integrations own encryption, authority, durable drafts and guarded I/O. */
export interface SyncRuntime {
  invalidateConnection?(): void;
  readonly actions: readonly SyncAction["type"][];
  listManagedVaults?(
    settings: Readonly<SyncSettings>,
    signal: AbortSignal,
  ): Promise<ManagedVault[]>;
  snapshot(): SyncSnapshot;
  subscribe(listener: () => void): () => void;
  execute(
    action: SyncAction,
    settings: Readonly<SyncSettings>,
    signal: AbortSignal,
  ): Promise<void>;
  dispose(): void | Promise<void>;
}

export function createDisconnectedSnapshot(): SyncSnapshot {
  return {
    status: "disabled",
    vaultId: "",
    localRevisionId: null,
    localRoot: null,
    effectiveRevisionId: null,
    pendingChanges: 0,
    pendingFiles: [],
    pendingUploads: 0,
    lastError: null,
    pendingReplicaRepairs: 0,
    devices: [],
    revisions: [],
    changeSets: [],
    mergeDraft: null,
    recoveryPreview: null,
    pairing: { stage: "idle", invitationUri: "", session: null, error: null },
    security: {
      state: "unavailable",
      encrypted: false,
      enrolled: false,
      role: null,
      syncIdentity: "",
      devicePublicKey: "",
      deviceAlias: "",
      epoch: null,
    },
    destination: {
      provider: "lapis-server",
      url: "",
      managedVaultId: "",
      authenticated: false,
      authorized: false,
      status: "unconfigured",
      lastSuccessAt: null,
      message: "Connect an enrolled device to Lapis Server to start syncing.",
    },
  };
}
