import {
  App,
  installApplicationCompatibility,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  type PluginManifest,
} from "@lapis-notes/api";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { SearchPlugin } from "@lapis-notes/search";
import { SyncPlugin, type SyncPaneKind } from "@lapis-notes/lapis-plugin-sync";
import {
  PreviewSyncRuntime,
  SYNC_STORY_FILES,
  type SyncStoryState,
} from "./preview-runtime";
import {
  syncPanelLayout,
  syncShellLayout,
  type SyncPlacement,
} from "./workspace-layout";
import "@lapis-notes/lapis-plugin-sync/styles.css";
export type SyncWorkspaceOptions = {
  kind?: SyncPaneKind;
  placement?: SyncPlacement;
  state?: SyncStoryState;
  shell?: boolean;
  settings?: boolean;
};
let sequence = 0;
export async function bootSyncWorkspace(options: SyncWorkspaceOptions) {
  const state = options.state ?? "dirty",
    kind = options.kind ?? "sync",
    placement = options.placement ?? "middle-top-tabs";
  const identity = `sync-catalog-${++sequence}`;
  const seed = {
    ...SYNC_STORY_FILES,
    ".obsidian/app.json": JSON.stringify({
      "appearence.interface.showTabTitleBar": true,
      pluginData: {
        sync: {
          version: 1,
          settings: {
            provider: "lapis-server",
            serverUrl: state === "setup" ? "" : "https://sync.example.test",
            managedVaultId: state === "setup" ? "" : "atlas-server",
            enabled: state !== "setup",
            indexFileTags: false,
          },
        },
      },
    }),
    ".obsidian/workspace.json": JSON.stringify(
      options.shell
        ? syncShellLayout(options.kind ?? "history")
        : syncPanelLayout(kind, placement),
    ),
  };
  const app = new App({
    version: "0.1.2-story",
    configPath: ".obsidian/app.json",
    adapter: new MemoryVaultAdapter(seed, {
      name: "Atlas Sync Review",
      vaultId: identity,
      clock: 1_700_000_000_000,
    }),
    appDatabase: new MemoryAppDatabase(identity),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  const releaseCompatibility = installApplicationCompatibility(app);
  const runtime = state === "setup" ? null : new PreviewSyncRuntime(app, state);
  class CatalogSyncPlugin extends SyncPlugin {
    constructor(owner: App, manifest?: PluginManifest) {
      super(owner, manifest, {
        createRuntime: runtime ? () => runtime : undefined,
      });
    }
  }
  app.plugins.registerCorePlugins(
    options.shell
      ? [
          { plugin: SourceEditorPlugin, required: true },
          {
            plugin: MarkdownPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "bundled",
          },
          {
            plugin: FileExplorerPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "bundled",
          },
          {
            plugin: SearchPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "bundled",
          },
          {
            plugin: CatalogSyncPlugin,
            required: false,
            enabledByDefault: true,
          },
        ]
      : [
          {
            plugin: CatalogSyncPlugin,
            required: false,
            enabledByDefault: true,
          },
        ],
  );
  try {
    await app.vault.load();
    await app.configuration.load();
    await app.plugins.loadPlugins({
      communityPlugins: "disabled",
      optionalCorePlugins: "configured",
    });
    const stopMetadata = options.shell
      ? app.metadataTypeManager.trackChanges()
      : () => {};
    if (options.shell) await app.metadataCache.load();
    // Finish host startup before restoring views or exposing the owned App.
    await getWorkspaceHostBinding(app.workspace).controller.start();
    await app.workspace.loadLayout();
    const plugin = app.plugins.plugins.get("sync");
    if (!(plugin instanceof SyncPlugin))
      throw new Error("Lapis Sync did not load.");
    return {
      app,
      plugin,
      runtime,
      dispose: async () => {
        stopMetadata();
        for (const loaded of [...app.plugins.corePlugins].reverse())
          await loaded.disable();
        await app.workspace.disposeWorkspaceHost();
        await app.appDatabase.close();
        releaseCompatibility();
      },
    };
  } catch (error) {
    for (const loaded of [...app.plugins.corePlugins].reverse())
      await loaded.disable();
    await app.workspace.disposeWorkspaceHost();
    await app.appDatabase.close();
    releaseCompatibility();
    throw error;
  }
}
