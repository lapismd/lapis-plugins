<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { attachRemotesPreview, createRemotesPreview } from "./runtime.svelte";
  import type { RemotesScenario } from "./model.svelte";
  let {
    host = "desktop",
    scenario = "connected",
    settings = true,
    narrow = false,
    legacyStatus = false,
  }: {
    host?: "desktop" | "server";
    scenario?: RemotesScenario;
    settings?: boolean;
    narrow?: boolean;
    legacyStatus?: boolean;
  } = $props();
  let app = $state.raw<App>();
  let element: HTMLDivElement;
  let failure = $state("");
  onMount(() => {
    let disposed = false;
    const opening = createRemotesPreview(host, scenario, legacyStatus);
    void opening
      .then(async (runtime) => {
        if (disposed) return;
        app = runtime.app;
        attachRemotesPreview(element, runtime);
        // Open only after the real shell mounts, matching a user opening Settings.
        await tick();
        if (!disposed && settings) runtime.openSettings();
      })
      .catch((error) => {
        if (!disposed) failure = String(error);
      });
    return () => {
      disposed = true;
      void opening.then((runtime) => runtime.dispose());
    };
  });
</script>

<div class="preview" data-ui-theme="lapis" style:max-width={narrow ? "390px" : undefined}>
  <div class="workspace" data-remotes-preview bind:this={element}>
    {#if failure}<p role="alert">{failure}</p>{:else if app}<WorkspaceShell
        {app}
        displayMode="desktop"
      />{/if}
  </div>
</div>

<style>
  .preview {
    height: 100vh;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .workspace {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
