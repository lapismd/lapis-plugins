/** Presentation-only ports. Hosts retain repository admission and secret custody. */
export type RemoteTarget = "backup" | "original";
export type RemoteAuthentication = "anonymous" | "token" | "forge" | "ssh-agent" | "ssh-default";
export type RemoteConnectionDraft = {
  name: string;
  url: string;
  branch: string;
  bookmark: string;
  authentication: RemoteAuthentication;
  credential: string;
};
export type RemoteCredential = {
  id: string;
  label: string;
  host: string;
  username: string;
  method: "token" | "forge";
  available: boolean;
};
export type RemotePushReview = {
  id: string;
  commit: string;
  summary: string;
  outgoing: number;
  remoteCommit: string | null;
};
export type RemoteTargetSettings = {
  target: RemoteTarget;
  connection: RemoteConnectionDraft | null;
  status: "disconnected" | "connected" | "read-only" | "credentials-required";
  bookmarks: readonly string[];
  canFetch: boolean;
  canPush: boolean;
  busy?: "testing" | "fetching" | "pushing";
  observation?: { incoming: number; outgoing: number; fetchedAt: string };
  review?: RemotePushReview;
  publication?: { id: string; commit: string; outcome: "unknown" | "stopped" };
};
/** Optional binding for the existing repository status-bar upstream controls. */
export type RepositoryUpstreamBinding = {
  target: RemoteTargetSettings;
  fetch(): void;
  push(): void;
  pull?(): void;
  manage(): void;
};
export type RemotesSettingsState = {
  host: "desktop" | "server";
  storage: "available" | "locked" | "unavailable";
  sshAvailable: boolean;
  deviceSignInAvailable: boolean;
  authorization?: { code: string; url: string; state: "pending" | "expired" };
  credentials: readonly RemoteCredential[];
  targets: readonly RemoteTargetSettings[];
  automaticSync: boolean;
};
export interface RemotesSettingsActions {
  save(target: RemoteTarget, draft: RemoteConnectionDraft): Promise<void>;
  test(target: RemoteTarget): Promise<void>;
  fetch(target: RemoteTarget): Promise<void>;
  pullBackup(): Promise<void>;
  reviewPush(target: RemoteTarget): Promise<void>;
  push(target: RemoteTarget, reviewId: string): Promise<void>;
  dismissReview(target: RemoteTarget): void;
  observe(target: RemoteTarget, requestId: string): Promise<void>;
  stop(target: RemoteTarget, requestId: string): Promise<void>;
  setAutomaticSync(enabled: boolean): Promise<void>;
  saveCredential(input: {
    label: string;
    host: string;
    username: string;
    token: string;
    provider: "https" | "github" | "forgejo";
    replace?: string;
  }): Promise<void>;
  forgetCredential(id: string): Promise<void>;
  beginSignIn(): Promise<void>;
  checkSignIn(): Promise<void>;
  cancelSignIn(): Promise<void>;
  report(error: unknown): void;
}
export const remoteTargetLabel = (target: RemoteTarget) =>
  target === "backup" ? "Vault backup" : "Original repository";

export function credentialMatchesRemote(credential: RemoteCredential, endpoint: string): boolean {
  try {
    return credential.host.toLowerCase() === new URL(endpoint).host.toLowerCase();
  } catch {
    return false;
  }
}

/** Display endpoints without passwords, query strings or fragments. */
export function remoteDisplayUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!["https:", "ssh:"].includes(url.protocol)) return "Unsupported remote";
    url.username = url.protocol === "ssh:" ? url.username : "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return /^[\w.-]+@[\w.-]+:[\w./-]+$/.test(value) ? value : "Remote address unavailable";
  }
}
export function validRemoteDraft(draft: RemoteConnectionDraft): boolean {
  if (!validRef(draft.name) || !validRef(draft.branch)) return false;
  if (/^[\w.-]+@[\w.-]+:[\w./-]+$/.test(draft.url)) return draft.authentication.startsWith("ssh-");
  try {
    const url = new URL(draft.url);
    if (!url.hostname || url.password || url.search || url.hash) return false;
    if (url.protocol === "ssh:") return draft.authentication.startsWith("ssh-");
    return url.protocol === "https:" && !url.username && !draft.authentication.startsWith("ssh-");
  } catch {
    return false;
  }
}

function validRef(value: string): boolean {
  return (
    Boolean(value) &&
    !/[\s\x00-\x1f~^:?*\[\\]/u.test(value) &&
    !value.startsWith("-") &&
    !value.includes("..") &&
    !value.includes("@{") &&
    value
      .split("/")
      .every(
        (part) => part && !part.startsWith(".") && !part.endsWith(".") && !part.endsWith(".lock"),
      )
  );
}
