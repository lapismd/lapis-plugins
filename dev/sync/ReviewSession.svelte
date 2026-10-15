<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    FileView,
    installApplicationCompatibility,
    type PluginManifest,
    type VaultSession,
    type WorkspaceLeaf,
    getNativeDesktopBridge,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { SourceEditorPlugin } from "@lapis-notes/source-editor";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { SyncPlugin } from "@lapis-notes/lapis-plugin-sync";
  import { MemoryServerAccount } from "./server-account";

  let { session }: { session: VaultSession } = $props();
  const serverUrl = import.meta.env.VITE_SYNC_REVIEW_SERVER_URL ?? "http://localhost:8797";
  const initialSession = untrack(() => session);
  const owned = new App({
    version: "private-sync-connection",
    configPath: ".obsidian/app.json",
    session: initialSession,
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  const release = installApplicationCompatibility(owned);
  const native = getNativeDesktopBridge();
  const account = native ? null : new MemoryServerAccount();
  const nativeDatabaseId = `sync-account-review-${crypto.randomUUID()}`;
  let nativeProfileOpened = false;
  let ready = $state(false);
  let failure = $state("");
  let disposal: Promise<void> | undefined;

  function dispose() {
    return disposal ??= (async () => {
      try {
        for (const plugin of [...owned.plugins.corePlugins].reverse()) {
          await plugin.disable();
        }
        await owned.workspace.disposeWorkspaceHost();
        await initialSession.close();
        await account?.dispose();
        if (nativeProfileOpened) await native?.invoke("desktop_app_database_close", { databaseId: nativeDatabaseId });
      } finally {
        release();
      }
    })();
  }

  class PrivateSyncPlugin extends SyncPlugin {
    constructor(owner: App, manifest?: PluginManifest) {
      super(owner, manifest, account ? {
        account,
        connection: {
          allowLoopbackHttp: true,
          request: account.request,
        },
      } : {});
    }
  }
  owned.plugins.registerCorePlugins([
    { plugin: SourceEditorPlugin, required: true },
    { plugin: MarkdownPlugin, enabledByDefault: true },
    { plugin: FileExplorerPlugin, enabledByDefault: true },
    { plugin: PrivateSyncPlugin, enabledByDefault: true },
  ]);

  onMount(() => {
    let canceled = false;
    const boot = async () => {
      if (native) {
        await native.invoke("desktop_app_database_open", { databaseId: nativeDatabaseId, vaultId: owned.appDatabase.vaultId });
        nativeProfileOpened = true;
      }
      await owned.vault.load();
      await owned.configuration.load();
      await owned.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await getWorkspaceHostBinding(owned.workspace).controller.start();
      await owned.workspace.loadLayout();
      if (!owned.vault.getFileByPath("Review.md")) {
        await owned.vault.create(
          "Review.md",
          "# Sync connection review\n\nThis local note and Sync configuration survive reload. Connection checks do not transfer its content.\n",
        );
      }
      if (!owned.workspace.getActiveFile()) {
        let existing: WorkspaceLeaf | undefined;
        owned.workspace.iterateAllLeaves(leaf => {
          if (!existing && leaf.view instanceof FileView && leaf.view.file?.path === "Review.md") {
            existing = leaf;
          }
        });
        const leaf = existing ?? owned.workspace.getLeaf("tab");
        if (!existing) await leaf.openFile(owned.vault.getFileByPath("Review.md")!);
        owned.workspace.activateLeaf(leaf, { source: "api", operation: "sync-review-open" });
      }
      if (canceled) return;
      ready = true;
      (owned.plugins.plugins.get("sync") as SyncPlugin).settingsRegistration?.open();
    };
    const loading = boot().catch(async error => {
      console.error(error);
      if (!canceled) failure = error instanceof Error ? error.message : String(error);
      await dispose();
    });
    return () => {
      canceled = true;
      void loading.then(dispose);
    };
  });
</script>

<main>
  <header>
    <span>Private Sync review · {native ? "Protected native account session" : "Sign-in lasts until reload"} · No content synchronization</span>
    <a href={serverUrl} target="_blank" rel="noopener">Open Lapis Server</a>
  </header>
  {#if failure}
    <p role="alert">{failure}</p>
  {:else if ready}
    <WorkspaceShell app={owned} workspaceLabel="Sync connection review" />
  {:else}
    <p role="status">Opening the persistent local vault…</p>
  {/if}
</main>

<style>
  :global(html), :global(body), :global(#app) {
    height: 100%;
    margin: 0;
  }
  main {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  a { color: inherit; }
  main > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1;
    min-height: 0;
  }
</style>
