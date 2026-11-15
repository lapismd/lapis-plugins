import type { WorkspaceCustomSetting } from "@lapis-notes/api";
import NativeRemotesSettings from "./remotes/NativeRemotesSettings.svelte";
import { mount, unmount } from "svelte";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { RepositoryRemotesController } from "../controllers/remotes-controller.js";
import type { RepositoryRemotesService } from "../controllers/remotes-service.js";
import type {
  RemoteTarget,
  RemotesSettingsActions,
  RemotesSettingsState,
  RepositoryUpstreamBinding,
} from "../controllers/remotes-settings.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import RemoteReviewHost from "./remotes/RemoteReviewHost.svelte";
export const REMOTES_SETTINGS = "repository-history.remotes";
/** One enabled plugin owns native observation and reviews, independent of footer
 * and settings visibility. No renderer schedules transfers or stores secrets. */
export class RepositoryRemotes {
  readonly controller: RepositoryRemotesController;
  readonly actions: RemotesSettingsActions;
  #state = $state<RemotesSettingsState>();
  #review = $state<RemoteTarget>();
  settingsTarget = $state<RemoteTarget>();
  #stop?: () => void;
  #host?: ReturnType<typeof mount>;
  #closed = false;
  constructor(
    private readonly plugin: RepositoryPlugin,
    service: RepositoryRemotesService
  ) {
    this.controller = new RepositoryRemotesController(service, (error) =>
      this.report(error)
    );
    this.actions = {
      ...this.controller.actions,
      reviewPush: async (target) => {
        await this.controller.actions.reviewPush(target);
        if (!this.#closed) this.#review = target;
      },
      dismissReview: (target) => {
        this.controller.actions.dismissReview(target);
        if (this.#review === target) this.#review = undefined;
      },
    };
    this.#stop = this.controller.subscribe((state) => {
      this.#state = state;
    });
  }
  get field(): WorkspaceCustomSetting & { remotes: RepositoryRemotes } {
    return {
      id: REMOTES_SETTINGS,
      type: "custom",
      title: "Remotes and credentials",
      presentation: "full-width",
      component: NativeRemotesSettings,
      remotes: this,
    };
  }
  get state() {
    return this.#state;
  }
  get review() {
    return this.#state?.targets.find(
      (target) => target.target === this.#review
    );
  }
  async start(): Promise<void> {
    const document = this.plugin.app.workspace.getCommandHostDocument();
    this.#host = mount(RemoteReviewHost, {
      target: document.createElement("div"),
      props: { owner: this, portalTarget: document.body },
    });
    this.plugin.addCommand({
      id: "manage-remotes",
      name: "Manage repository remotes and credentials",
      callback: () => this.manage(),
    });
    await this.refresh();
  }
  async refresh(): Promise<void> {
    try {
      await this.controller.refresh();
    } catch (error) {
      this.report(error);
    }
  }
  binding(target: RemoteTarget): RepositoryUpstreamBinding {
    const owner = this;
    return {
      get target() {
        return (
          owner.#state?.targets.find((value) => value.target === target) ?? {
            target,
            connection: null,
            status: "disconnected",
            bookmarks: [],
            canFetch: false,
            canPush: false,
          }
        );
      },
      fetch: () => this.run(() => this.actions.fetch(target)),
      push: () => this.run(() => this.actions.reviewPush(target)),
      manage: () => this.manage(target),
    };
  }
  manage(target?: RemoteTarget): void {
    if (this.#closed) return;
    this.settingsTarget = target;
    getWorkspaceHostBinding(this.plugin.app.workspace).controller.settings.open(
      {
        sectionId: "repository-history",
        fieldId: REMOTES_SETTINGS,
      }
    );
  }
  run(action: () => Promise<void>): void {
    void action().catch((error) => this.report(error));
  }
  report(error: unknown): void {
    if (!this.#closed) this.plugin.report(error);
  }
  async close(): Promise<void> {
    this.#closed = true;
    this.controller.close();
    this.#stop?.();
    this.#stop = undefined;
    this.#review = undefined;
    this.#state = undefined;
    if (this.#host) await unmount(this.#host);
    this.#host = undefined;
  }
}
