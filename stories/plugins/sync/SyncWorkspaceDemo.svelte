<script lang="ts">
  import { onMount, tick } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    bootSyncWorkspace,
    type SyncWorkspaceOptions,
  } from "./create-sync-workspace";
  import type { App } from "@lapis-notes/api";
  import type { SyncPlugin } from "@lapis-notes/lapis-plugin-sync";
  import type { PreviewSyncRuntime } from "./preview-runtime";
  import "../../workspace/lapis-editor-demo/lapis-editor-demo.css";
  let {
    options = {},
    mobile = false,
  }: { options?: SyncWorkspaceOptions; mobile?: boolean } = $props();
  let app = $state<App | null>(null),
    error = $state("");
  let root = $state<HTMLDivElement>();
  let owner: Awaited<ReturnType<typeof bootSyncWorkspace>> | null = null;
  $effect(() => {
    if (!root || !app || !owner) return;
    const target = root as HTMLDivElement & {
      __lapisApp?: App;
      __syncPlugin?: SyncPlugin;
      __syncRuntime?: PreviewSyncRuntime | null;
    };
    target.__lapisApp = app;
    target.__syncPlugin = owner.plugin;
    target.__syncRuntime = owner.runtime;
    return () => {
      delete target.__lapisApp;
      delete target.__syncPlugin;
      delete target.__syncRuntime;
    };
  });
  onMount(() => {
    let cancelled = false;
    const pending = bootSyncWorkspace(options);
    void pending
      .then(async (runtime) => {
        owner = runtime;
        if (!cancelled) {
          app = runtime.app;
          await tick();
          if (!cancelled && options.settings)
            runtime.plugin.settingsRegistration?.open();
        }
      })
      .catch((caught) => {
        if (!cancelled)
          error = caught instanceof Error ? caught.message : String(caught);
      });
    return () => {
      cancelled = true;
      void pending
        .then((runtime) => runtime.dispose())
        .catch((caught) => console.error(caught));
    };
  });
</script>

<div
  bind:this={root}
  class="sync-workspace-demo"
  class:sync-workspace-demo--mobile={mobile}
  data-testid="sync-workspace-demo"
  data-status={error ? "error" : app ? "ready" : "booting"}
  data-placement={options.placement ?? "middle-top-tabs"}
>
  {#if error}<p role="alert">{error}</p>{:else if app}<WorkspaceShell
      {app}
      displayMode={mobile ? "mobile" : "desktop"}
      workspaceLabel="Atlas Sync Review"
    />{/if}
</div>

<style>
  .sync-workspace-demo {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .sync-workspace-demo--mobile {
    max-width: 26.875rem;
    margin-inline: auto;
  }
  .sync-workspace-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
  :global(body.sb-main-fullscreen:has(.sync-workspace-demo) #storybook-root) {
    height: 100dvh;
    padding: 0;
    overflow: hidden;
  }
</style>
