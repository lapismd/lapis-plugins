<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/markdown/styles.css";
  import "@lapis-notes/slides/styles.css";
  import { bootSlidesDemo } from "./create-slides-demo";

  let app = $state<App | null>(null);
  let status = $state("booting");
  let error = $state("");
  let root = $state<HTMLDivElement>();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
    };
  });

  onMount(() => {
    let cancelled = false;
    const runtimePromise = bootSlidesDemo();
    void runtimePromise
      .then((runtime) => {
        if (cancelled) return;
        app = runtime.app;
        status = "ready";
      })
      .catch((reason) => {
        if (cancelled) return;
        status = "failed";
        error = reason instanceof Error ? reason.message : String(reason);
      });
    return () => {
      cancelled = true;
      void runtimePromise
        .then((runtime) => runtime.dispose())
        .catch(() => undefined);
    };
  });
</script>

<div
  bind:this={root}
  class="slides-demo"
  data-testid="slides-demo"
  data-status={status}
>
  <output class="slides-demo__status" data-testid="slides-demo-status">
    {status}
  </output>
  {#if error}
    <div role="alert">{error}</div>
  {:else if app}
    <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
  {/if}
</div>

<style>
  :global(
      body.sb-main-fullscreen:has(#storybook-root .slides-demo) #storybook-root
    ) {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(html:has(#storybook-root .slides-demo)),
  :global(body:has(#storybook-root .slides-demo)) {
    overflow: hidden;
  }

  .slides-demo {
    position: relative;
    display: flex;
    width: 100%;
    height: 100vh;
    max-width: 100%;
    max-height: 100vh;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .slides-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .slides-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
