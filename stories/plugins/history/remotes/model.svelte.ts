import type { App } from "@lapis-notes/api";
import { repositoryFeedback } from "../../../../packages/history/src/lib/repository/components/repository-feedback";
import {
  type RemoteTarget,
  type RemoteTargetSettings,
  type RemotesSettingsActions,
  type RemotesSettingsState,
} from "../../../../packages/history/src/lib/repository/controllers/remotes-settings";

export type RemotesScenario =
  | "connected"
  | "disconnected"
  | "anonymous"
  | "read-only"
  | "missing-credentials"
  | "locked"
  | "ssh-unavailable"
  | "ssh-connected"
  | "fetching"
  | "push-review"
  | "rejected"
  | "unknown"
  | "device-sign-in"
  | "expired-sign-in";
const commit = "94bd176ba2bd75903a0cd5c1ac7d143e09214284";
export const initialRemotesState = (
  host: "desktop" | "server",
  scenario: RemotesScenario,
): RemotesSettingsState => {
  const targets: RemoteTargetSettings[] = (["backup", "original"] as const).map((target) => ({
    target,
    status: "connected",
    bookmarks: target === "original" ? ["main", "feature/notes"] : [],
    canFetch: true,
    canPush: true,
    connection: {
      name: target === "backup" ? "backup" : "origin",
      url: `https://github.com/alex/${target === "backup" ? "notes-backup" : "knowledge"}.git`,
      branch: "main",
      bookmark: target === "original" ? "main" : "",
      authentication: target === "backup" ? "forge" : "token",
      credential: target === "backup" ? "github" : "repository",
    },
    observation: { incoming: 2, outgoing: target === "backup" ? 3 : 1, fetchedAt: "just now" },
  }));
  const state: RemotesSettingsState = {
    host,
    targets,
    storage: "available",
    sshAvailable: true,
    deviceSignInAvailable: true,
    automaticSync: false,
    credentials: [
      {
        id: "github",
        label: "Personal GitHub",
        host: "github.com",
        username: "alex",
        method: "forge",
        available: true,
      },
      {
        id: "repository",
        label: "Repository token",
        host: "github.com",
        username: "alex",
        method: "token",
        available: true,
      },
    ],
  };
  const original = targets[1];
  if (scenario === "disconnected") {
    state.credentials = [];
    for (const value of targets) {
      value.connection = null;
      value.status = "disconnected";
      value.canFetch = value.canPush = false;
      value.observation = undefined;
    }
  }
  if (scenario === "anonymous" || scenario === "read-only") {
    original.status = "read-only";
    original.canPush = false;
    original.connection = {
      ...original.connection!,
      authentication: scenario === "anonymous" ? "anonymous" : "token",
      credential: scenario === "anonymous" ? "" : "repository",
    };
  }
  if (scenario === "missing-credentials" || scenario === "locked") {
    original.status = "credentials-required";
    original.canFetch = original.canPush = false;
    state.credentials = state.credentials.map((credential) => ({
      ...credential,
      available: credential.id !== "repository",
    }));
  }
  if (scenario === "locked") {
    state.storage = "locked";
    for (const value of targets) {
      value.canFetch = value.canPush = false;
      value.status = "credentials-required";
    }
  }
  if (scenario === "ssh-unavailable" || scenario === "ssh-connected") {
    state.sshAvailable = scenario === "ssh-connected";
    original.connection = {
      ...original.connection!,
      url: "git@forge.example:alex/knowledge.git",
      authentication: "ssh-agent",
      credential: "",
    };
    original.canFetch = original.canPush = state.sshAvailable;
  }
  if (scenario === "fetching") original.busy = "fetching";
  if (scenario === "push-review")
    original.review = {
      id: "review-original-1",
      commit,
      summary: "Organize project notes",
      outgoing: 1,
      remoteCommit: "1a".repeat(20),
    };
  if (scenario === "unknown")
    original.publication = { id: "push-original-1", commit, outcome: "unknown" };
  if (scenario === "device-sign-in" || scenario === "expired-sign-in")
    state.authorization = {
      code: "ABCD-EFGH",
      url: "https://github.com/login/device",
      state: scenario === "expired-sign-in" ? "expired" : "pending",
    };
  return state;
};

/** All effects are memory-only. Activity never retains submitted tokens. */
export class RemotesFixture {
  state: RemotesSettingsState = $state()!;
  readonly activity: { kind: string; target?: RemoteTarget; id?: string }[] = [];
  #sequence = 0;
  readonly actions: RemotesSettingsActions;
  constructor(
    app: App,
    host: "desktop" | "server",
    readonly scenario: RemotesScenario,
  ) {
    this.state = initialRemotesState(host, scenario);
    const feedback = repositoryFeedback(app, "Repository remotes", "repository-remotes-preview");
    const notice = (message: string) =>
      app.notifications.notify({
        id: "repository-remotes-result",
        source: "repository-history",
        title: "Repository remotes",
        message,
        severity: "info",
        persist: false,
      });
    this.actions = {
      report: feedback.report,
      save: async (target, draft) => {
        this.record("save", target);
        this.update(target, {
          connection: { ...draft },
          status: draft.authentication === "anonymous" ? "read-only" : "connected",
          canFetch: true,
          canPush: draft.authentication !== "anonymous",
          observation: undefined,
          review: undefined,
        });
        notice("Connection saved. No data was fetched or pushed.");
      },
      test: async (target) => {
        this.record("test", target);
        this.update(target, { busy: "testing" });
        await this.pause();
        this.update(target, { busy: undefined });
        feedback.recovered();
        notice("Connection verified. Nothing was published.");
      },
      fetch: async (target) => {
        this.record("fetch", target);
        this.update(target, { busy: "fetching" });
        await this.pause();
        this.update(target, {
          busy: undefined,
          observation: {
            incoming: 2,
            outgoing: target === "backup" ? 3 : 1,
            fetchedAt: "just now",
          },
        });
        feedback.recovered();
      },
      pullBackup: async () => {
        this.record("pull", "backup");
        this.update("backup", { busy: "fetching" });
        await this.pause();
        this.update("backup", {
          busy: undefined,
          observation: { incoming: 0, outgoing: 3, fetchedAt: "just now" },
        });
        feedback.recovered();
      },
      reviewPush: async (target) => {
        this.record("review", target);
        this.update(target, {
          review: {
            id: `review-${target}-${++this.#sequence}`,
            commit,
            summary: "Organize project notes",
            outgoing: target === "backup" ? 3 : 1,
            remoteCommit: "1a".repeat(20),
          },
        });
      },
      dismissReview: (target) => this.update(target, { review: undefined }),
      push: async (target, reviewId) => {
        if (this.target(target).review?.id !== reviewId)
          throw Error("The push review changed. Review the update again.");
        this.record("push", target, reviewId);
        this.update(target, { busy: "pushing" });
        await this.pause();
        this.update(target, { busy: undefined, review: undefined });
        if (scenario === "rejected")
          throw Error("The remote branch changed. Fetch updates and review the push again.");
        this.update(target, { observation: { incoming: 0, outgoing: 0, fetchedAt: "just now" } });
        feedback.recovered();
        notice("Reviewed commit published.");
      },
      observe: async (target, requestId) => {
        this.requireRequest(target, requestId);
        this.record("observe", target, requestId);
        this.update(target, {
          publication: undefined,
          observation: { incoming: 0, outgoing: 0, fetchedAt: "just now" },
        });
        notice("The original push was accepted. Nothing was republished.");
      },
      stop: async (target, requestId) => {
        this.requireRequest(target, requestId);
        this.record("stop", target, requestId);
        this.update(target, {
          publication: { ...this.target(target).publication!, outcome: "stopped" },
        });
      },
      setAutomaticSync: async (enabled) => {
        this.record("automatic-sync");
        this.state = { ...this.state, automaticSync: enabled };
      },
      saveCredential: async ({ label, host: credentialHost, username, replace, provider }) => {
        if (this.state.storage !== "available") throw Error("Credential store is locked.");
        this.record("save-credential");
        const credential = {
          id: replace ?? `credential-${++this.#sequence}`,
          label,
          host: credentialHost,
          username,
          method: provider === "https" ? ("token" as const) : ("forge" as const),
          available: true,
        };
        this.state = {
          ...this.state,
          credentials: [
            ...this.state.credentials.filter((item) => item.id !== replace),
            credential,
          ],
        };
        notice("Credential saved for this host.");
      },
      forgetCredential: async (id) => {
        this.record("forget-credential", undefined, id);
        this.state = {
          ...this.state,
          credentials: this.state.credentials.filter((item) => item.id !== id),
          targets: this.state.targets.map((target) =>
            target.connection?.credential === id
              ? { ...target, status: "credentials-required", canFetch: false, canPush: false }
              : target,
          ),
        };
      },
      beginSignIn: async () => {
        this.record("begin-sign-in");
        this.state = {
          ...this.state,
          authorization: {
            code: "ABCD-EFGH",
            url: "https://github.com/login/device",
            state: "pending",
          },
        };
      },
      checkSignIn: async () => {
        this.record("check-sign-in");
        this.state = {
          ...this.state,
          authorization: undefined,
          credentials: [
            ...this.state.credentials.filter((item) => item.id !== "github"),
            {
              id: "github",
              label: "Personal GitHub",
              host: "github.com",
              username: "alex",
              method: "forge",
              available: true,
            },
          ],
        };
      },
      cancelSignIn: async () => {
        this.record("cancel-sign-in");
        this.state = { ...this.state, authorization: undefined };
      },
    };
  }
  record(kind: string, target?: RemoteTarget, id?: string) {
    this.activity.push({ kind, target, id });
  }
  target(target: RemoteTarget) {
    return this.state.targets.find((value) => value.target === target)!;
  }
  update(target: RemoteTarget, patch: Partial<RemoteTargetSettings>) {
    this.state = {
      ...this.state,
      targets: this.state.targets.map((value) =>
        value.target === target ? { ...value, ...patch } : value,
      ),
    };
  }
  requireRequest(target: RemoteTarget, id: string) {
    if (this.target(target).publication?.id !== id)
      throw Error("The original push request changed.");
  }
  pause() {
    return new Promise<void>((resolve) => setTimeout(resolve, 80));
  }
}
