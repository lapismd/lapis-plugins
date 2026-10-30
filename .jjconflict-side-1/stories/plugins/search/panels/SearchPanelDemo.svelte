<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
  import {
    createPanelDemoLayout,
    type PanelDemoLayout,
  } from "../../_shared/panels/create-panel-demo";
  let {
    layout,
    diagnostics = "all",
  }: {
    layout: PanelDemoLayout;
    diagnostics?: "all" | "none" | "markdownlint" | "spellcheck";
  } = $props();
  let ready = $state(false);
  let root: HTMLDivElement;
  onMount(() => {
    let closed = false;
    void (async () => {
      while (!closed) {
        const app = root.querySelector<HTMLElement & { __lapisApp?: App }>(
          '[data-testid="panel-demo"]',
        )?.__lapisApp;
        if (app && root.querySelector('[data-app-shell-ready="true"]')) {
          // This fixture predates the API's .lapis workspace-state directory.
          // Restore the governed placement through the public layout loader.
          await app.vault.mkpath(".lapis");
          await app.vault.create(
            ".lapis/search-placement.json",
            JSON.stringify(createPanelDemoLayout("search", layout)),
          );
          if (closed) return;
          await app.workspace.loadLayout("search-placement.json");
          const leaf = app.workspace.getLeavesOfType("search")[0];
          if (leaf && !closed) {
            app.workspace.activateLeaf(leaf, {
              focusRootHost: false,
              source: "api",
              operation: "storybook-search",
            });
            await app.workspace.revealLeaf(leaf);
          }
          ready = !closed;
          return;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    })();
    return () => {
      closed = true;
    };
  });
</script>

<div
  bind:this={root}
  class="search-placement"
  data-search-placement-ready={ready}
>
  <PanelDemo kind="search" {layout} {diagnostics} />
</div>

<style>
  .search-placement {
    height: 100vh;
    min-height: 0;
  }
</style>
