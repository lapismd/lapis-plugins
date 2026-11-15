import type { SyncResolution, SyncState } from "./sync.js";

/** Presentation observes the native vault owner; it never schedules transfers. */
export type RepositoryNativeSyncSnapshot = Omit<SyncState, "upstream"> & {
  revision: number;
  pendingApply?: string;
};
export type RepositoryNativeSyncCommand = { expected_revision: number } & (
  | { kind: "run" }
  | { kind: "resume_apply"; request_id: string }
  | { kind: "keep_current" }
  | { kind: "inspect"; candidate: string; path: string }
  | {
      kind: "resolve";
      candidate: string;
      path: string;
      resolution: SyncResolution;
    }
);
export interface RepositoryNativeSyncService {
  /** Passive status must remain available while native network work runs. */
  read(): Promise<RepositoryNativeSyncSnapshot>;
  execute(
    command: RepositoryNativeSyncCommand
  ): Promise<RepositoryNativeSyncSnapshot>;
}
/** Shared sync card/inspector surface, independent of renderer orchestration. */
export interface SyncPresentation {
  subscribe(listener: (state: SyncState) => void): () => void;
  run(): Promise<void>;
  inspect(path: string): Promise<void>;
  resolve(path: string, resolution: SyncResolution): Promise<void>;
  keepCurrent(): Promise<void>;
  resume?(): Promise<void>;
}
