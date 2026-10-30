export type SyncPaneKind =
  | "sync"
  | "history"
  | "file-history"
  | "compare"
  | "merge";
export const SYNC_VIEW_TYPES = {
  sync: "sync",
  history: "sync-history",
  "file-history": "sync-file-history",
  compare: "sync-compare",
  merge: "sync-merge",
} as const;
export class SyncViewState {
  values = $state<{ path?: string; revisionId?: string }>({});
  set(value: Record<string, unknown>): void {
    this.values = {
      path: typeof value.path === "string" ? value.path : undefined,
      revisionId:
        typeof value.revisionId === "string" ? value.revisionId : undefined,
    };
  }
}
