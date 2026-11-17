<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { SearchToolResult } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { bootPanelDemo } from "../_shared/panels/create-panel-demo";

  let { empty = false }: { empty?: boolean } = $props();
  let app = $state<App | null>(null);
  let error = $state("");
  let root = $state<HTMLDivElement>();
  const output = $derived({
    results: empty ? [] : [{
      path: "Projects/auth.md",
      score: 1,
      snippets: [{ text: "OAuth token rotation", offset: 7 }],
    }],
  });

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => { delete ownedRoot.__lapisApp; };
  });
  onMount(() => {
    let closed = false;
    const runtime = bootPanelDemo("search", "right-sidebar", {
      diagnostics: "none",
      files: { "Projects/auth.md": "# Auth\nOAuth token rotation\n" },
    });
    void runtime.then((value) => {
      if (!closed) app = value.app;
    }).catch((reason) => {
      if (!closed) error = String(reason);
    });
    return () => {
      closed = true;
      void runtime.then((value) => value.dispose());
    };
  });
</script>

<div bind:this={root} class="result-demo" data-testid="search-tool-result-demo" data-ready={!!app}>
  {#if app}
    <section aria-label="Search tool result">
      <SearchToolResult {app} name="notes_search" state="completed" {output} />
    </section>
    <WorkspaceShell {app} />
  {:else if error}
    <p role="alert">{error}</p>
  {/if}
</div>

<style>
  .result-demo {
    height: 100vh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  section { padding: 1rem; }
</style>
