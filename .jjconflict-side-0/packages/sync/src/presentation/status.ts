import type { SyncSnapshot, SyncStatus } from "./types";

export const SYNC_STATUS_ID = "sync:status";
export const SYNC_TOGGLE_STATUS_COMMAND_ID = "sync:toggle-status";

export type SyncStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "busy"
  | "muted"
  | "accent";

export type SyncStatusPresentation = {
  icon: string;
  tone: SyncStatusTone;
  label: string;
  spin: boolean;
  segments: string[];
  tooltip: string;
};

const BUSY_STATUSES = new Set<SyncStatus>([
  "building-revision",
  "uploading-objects",
  "publishing-revision",
  "publishing-head",
  "reconciling",
  "applying",
]);

const LABELS: Record<SyncStatus, string> = {
  disabled: "Disabled",
  "idle-clean": "Synced",
  "idle-dirty": "Pending",
  "building-revision": "Building",
  "uploading-objects": "Uploading",
  "publishing-revision": "Publishing",
  "publishing-head": "Publishing",
  offline: "Offline",
  reconciling: "Reconciling",
  applying: "Applying",
  conflicted: "Merge required",
  "recovery-preview": "Recovery review",
  "error-recoverable": "Error",
};

const ICONS: Record<SyncStatus, string> = {
  disabled: "circle-off",
  "idle-clean": "circle-check",
  "idle-dirty": "cloud-upload",
  "building-revision": "refresh-cw",
  "uploading-objects": "refresh-cw",
  "publishing-revision": "refresh-cw",
  "publishing-head": "refresh-cw",
  offline: "cloud-off",
  reconciling: "refresh-cw",
  applying: "refresh-cw",
  conflicted: "git-merge",
  "recovery-preview": "shield-check",
  "error-recoverable": "triangle-alert",
};

const TONES: Record<SyncStatus, SyncStatusTone> = {
  disabled: "muted",
  "idle-clean": "success",
  "idle-dirty": "accent",
  "building-revision": "busy",
  "uploading-objects": "busy",
  "publishing-revision": "busy",
  "publishing-head": "busy",
  offline: "muted",
  reconciling: "busy",
  applying: "busy",
  conflicted: "warning",
  "recovery-preview": "warning",
  "error-recoverable": "danger",
};

export function statusBarDescriptor(
  snapshot: Pick<SyncSnapshot, "status" | "pendingChanges"> &
    Partial<Pick<SyncSnapshot, "security">>,
): {
  id: string;
  sourcePlugin: string;
  alignment: "right";
  priority: number;
  icon: string;
  spin: boolean;
  segments: string[];
  tooltip: string;
  command: string;
} {
  const presented = presentSyncStatus(snapshot);
  return {
    id: SYNC_STATUS_ID,
    sourcePlugin: "sync",
    alignment: "right",
    priority: 20,
    icon: presented.icon,
    spin: presented.spin,
    segments: presented.segments,
    tooltip: presented.tooltip,
    command: SYNC_TOGGLE_STATUS_COMMAND_ID,
  };
}

export function presentSyncStatus(
  snapshot: Pick<SyncSnapshot, "status" | "pendingChanges"> &
    Partial<Pick<SyncSnapshot, "security">>,
): SyncStatusPresentation {
  const locked = snapshot.security?.state === "locked";
  const label = locked ? "Locked" : LABELS[snapshot.status];
  const pending = snapshot.pendingChanges;
  const segments = pending > 0 ? [String(pending)] : [];
  const pendingLabel =
    pending === 0
      ? "No pending changes"
      : pending === 1
        ? "1 pending change"
        : `${pending} pending changes`;
  return {
    icon: locked ? "lock-keyhole" : ICONS[snapshot.status],
    tone: locked ? "muted" : TONES[snapshot.status],
    label,
    spin: BUSY_STATUSES.has(snapshot.status),
    segments,
    tooltip: `${label} · ${pendingLabel}`,
  };
}

export function isBusySyncStatus(status: SyncStatus): boolean {
  return BUSY_STATUSES.has(status);
}

export function shortRevisionId(id: string | null): string {
  if (!id) return "none";
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}
