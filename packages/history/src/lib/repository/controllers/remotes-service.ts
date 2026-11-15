import type {
  RemoteConnectionDraft,
  RemoteTarget,
  RemotesSettingsState,
} from "./remotes-settings.js";

/** Host-owned capabilities are facts about the executing machine. */
export type RepositoryRemoteCapabilities = {
  targets: readonly RemoteTarget[];
  anonymousHttps: boolean;
  httpsTokens: boolean;
  hostSshAgent: boolean;
  hostSshDefault: boolean;
  githubDeviceSignIn: boolean;
  forgejoTokens: boolean;
};
export type RepositoryRemotesSnapshot = {
  revision: number;
  capabilities: RepositoryRemoteCapabilities;
  settings: RemotesSettingsState;
};
type TargetCommand =
  | {
      kind: "save_connection";
      target: RemoteTarget;
      connection: RemoteConnectionDraft;
    }
  | { kind: "test_connection"; target: RemoteTarget }
  | { kind: "fetch"; target: RemoteTarget }
  | { kind: "review_push"; target: RemoteTarget }
  | { kind: "push"; target: RemoteTarget; reviewId: string }
  | { kind: "observe_push"; target: RemoteTarget; requestId: string }
  | { kind: "stop_push"; target: RemoteTarget; requestId: string };
export type RepositoryRemotesCommand = { expectedRevision: number } & (
  | TargetCommand
  | { kind: "set_automatic_sync"; enabled: boolean }
  | {
      kind: "save_credential";
      input: {
        label: string;
        host: string;
        username: string;
        token: string;
        provider: "https" | "github" | "forgejo";
        replace?: string;
      };
    }
  | { kind: "forget_credential"; id: string }
  | { kind: "begin_sign_in" }
  | { kind: "check_sign_in" }
  | { kind: "cancel_sign_in" }
);
/** Commands contain no filesystem paths. Native hosts never return stored secrets. */
export interface RepositoryRemotesService {
  read(): Promise<RepositoryRemotesSnapshot>;
  execute(
    command: RepositoryRemotesCommand
  ): Promise<RepositoryRemotesSnapshot>;
  /** Clipboard/browser handoff stays host-owned and checks the current code. */
  openSignIn(): Promise<void>;
}
