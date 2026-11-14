import { mount, unmount, tick } from "svelte";
import { View, type WorkspaceLeaf, type WorkspaceCustomSetting } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { RepositoryPlugin } from "@lapis-notes/history/repository";
import { createRepositoryStory, cleanupRepositoryStories } from "../repository/runtime.svelte";
import RemotesPreviewSettingsPage from "./RemotesPreviewSettingsPage.svelte";
import RemotesPreviewHistory from "./RemotesPreviewHistory.svelte";
import { RemotesFixture, type RemotesScenario } from "./model.svelte";

type Runtime = Awaited<ReturnType<typeof createRepositoryStory>> & {
  fixture: RemotesFixture;
  openSettings(): void;
};
const openings = new Set<Promise<Runtime>>();
const elements = new WeakMap<HTMLElement, Runtime>();
export function attachRemotesPreview(element: HTMLElement, runtime: Runtime) {
  elements.set(element, runtime);
}
export function remotesPreviewFor(canvas: HTMLElement): Runtime {
  const element = canvas.querySelector<HTMLElement>("[data-remotes-preview]");
  const runtime = element && elements.get(element);
  if (!runtime) throw Error("Remote preview has not mounted");
  return runtime;
}
export function createRemotesPreview(
  host: "desktop" | "server",
  scenario: RemotesScenario,
  settings: boolean,
) {
  const opening = boot(host, scenario, settings);
  openings.add(opening);
  return opening;
}
export async function cleanupRemotesPreviews() {
  for (const opening of openings) await (await opening).dispose();
  openings.clear();
  await cleanupRepositoryStories();
}
async function boot(
  host: "desktop" | "server",
  scenario: RemotesScenario,
  settings: boolean,
): Promise<Runtime> {
  const runtime = await createRepositoryStory("middle", false, "ready", true);
  let fixture!: RemotesFixture;
  const disposeModels = $effect.root(() => {
    fixture = new RemotesFixture(runtime.app, host, scenario);
  });
  const app = runtime.app;
  const plugin = app.plugins.plugins.get("repository-history") as RepositoryPlugin;
  const field: WorkspaceCustomSetting & { fixture: RemotesFixture } = {
    id: "repository-history.remotes",
    type: "custom",
    title: "Remotes and credentials",
    fixture,
  };
  const registration = plugin.registerSettingsSection({
    section: {
      id: "repository-history",
      title: "Repository History",
      icon: "git-branch",
      order: 46,
      navigationGroupId: "core-plugins",
      sourcePluginId: plugin.id,
      description: "Local history, remote connections and credentials.",
      page: RemotesPreviewSettingsPage,
      fields: [field],
    },
    source: { get: () => undefined, set: async () => {}, subscribe: () => () => {} },
  });
  const openSettings = () => {
    registration.open("repository-history.remotes");
  };
  class PreviewView extends View {
    #component?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return "repository-remotes-preview";
    }
    getDisplayText() {
      return "Repository History";
    }
    getIcon() {
      return "git-branch";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.#component = mount(RemotesPreviewHistory, {
        target: this.containerEl,
        props: { plugin, fixture, onManage: openSettings },
      });
    }
    onunload() {
      if (this.#component) void unmount(this.#component);
      this.#component = undefined;
    }
  }
  plugin.registerView("repository-remotes-preview", (leaf) => new PreviewView(leaf));
  const leaf = app.workspace.getLeaf("tab");
  await leaf.setViewState({ type: "repository-remotes-preview" });
  await app.workspace.revealLeaf(leaf);
  let closing: Promise<void> | undefined;
  const dispose = () =>
    (closing ??= (async () => {
      fixture.state = {
        ...fixture.state,
        authorization: undefined,
        targets: fixture.state.targets.map((target) => ({ ...target, review: undefined })),
      };
      getWorkspaceHostBinding(app.workspace).controller.settings.close();
      await tick();
      registration.dispose();
      await runtime.dispose();
      disposeModels();
    })());
  return { app, fixture, openSettings, dispose };
}
