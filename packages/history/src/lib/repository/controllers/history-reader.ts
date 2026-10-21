import type { HistoryClient } from "@lapismd/jj-history";

/** Transport-independent reader supplied by the host, never by persisted state. */
export type HistoryReader = Pick<
  HistoryClient,
  "heads" | "open" | "status" | "read" | "close"
> &
  Partial<Pick<HistoryClient, "blame">>;
export type RepositoryLeaveMode = "close" | "reload";
export interface RepositoryServices {
  aiHistory?: import("./ai-history.js").AiHistoryService;
  adoption?: import("./adoption.js").AdoptionService;
  sources?: () => Promise<{ original: boolean }>;
  original?: HistoryReader;
  storage?: import("./storage.js").StorageService;
  search?: import("./search.js").HistorySearchService;
  sync?: import("./sync.js").SyncService;
  remote?: import("./remote.js").RemoteService;
  forges?: import("./forge-accounts.js").ForgeService;
  restore?: import("./restore.js").RestoreService;
  backup?: import("./backup.js").BackupService;
  reader: HistoryReader;
  workingCopy?: () => Promise<
    import("./working-copy-status.js").WorkingCopyStatus
  >;
  close(mode: RepositoryLeaveMode): Promise<void>;
}
