<script lang="ts">
  import FixtureControls from "../../catalog/FixtureControls.svelte";
  import { onMount } from "svelte";
  import SearchPanelDemo from "./panels/SearchPanelDemo.svelte";
  import type { App, SearchProviderHit } from "@lapis-notes/api";
  let root: HTMLDivElement;
  let ready = $state(false),
    loaded = $state(false),
    opened = $state("");
  let release: (() => void) | undefined;
  const version = (id: string, path: string): SearchProviderHit => ({
    id,
    groupId: path,
    path,
    title: path.split("/").at(-1)!.replace(/\.md$/, ""),
    extension: "md",
    timestamp: 1792300000000 - Number(id) * 1000,
    version: {
      id,
      label: "Preserve the welcome instructions",
      author: "Ada Lovelace",
      timestamp: 1792300000000 - Number(id) * 1000,
      contentId: `${path}:original`,
    },
    matches: [
      {
        id: "text",
        field: "content",
        text: "Welcome to the earlier saved notes.",
        ranges: [{ start: 0, end: 7 }],
      },
    ],
    target: { revision: id },
  });
  onMount(() => {
    let disposed = false;
    let unregister: (() => void) | undefined;
    async function initialize() {
      let app: App | undefined;
      while (!disposed) {
        app = root.querySelector<HTMLElement & { __lapisApp?: App }>(
          '[data-testid="panel-demo"]',
        )?.__lapisApp;
        if (app && root.querySelector('[data-search-placement-ready="true"]'))
          break;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      if (!app || disposed) return;
      const registration = app.searchResultProviders.register({
        id: "fixture:history",
        label: "Saved history",
        scope: "history",
        fields: ["path", "content"],
        modes: ["lexical"],
        async search(request) {
          if (request.cursor)
            await new Promise<void>((resolve) => {
              if (loaded) resolve();
              else release = resolve;
            });
          return {
            generation: "one",
            hits: request.cursor
              ? [
                  version("2", "Notes/Welcome.md"),
                  version("3", "Archive/Deleted welcome.md"),
                ]
              : [version("1", "Notes/Welcome.md")],
            next: request.cursor ? undefined : "older",
            status: {
              phase: request.cursor ? "ready" : "indexing",
              indexed: request.cursor ? 3 : 1,
              complete: Boolean(request.cursor),
            },
          };
        },
        async activate(hit) {
          opened = hit.target.revision!;
        },
      });
      unregister = () => registration.dispose();
      const others: import("@lapis-notes/api").WorkspaceLeaf[] = [];
      app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view.getViewType() !== "search") others.push(leaf);
      });
      for (const leaf of others) await leaf.close();
      await app.commands.executeCommand("search:open-search", "welcome", "all");
      ready = true;
    }
    void initialize();
    return () => {
      disposed = true;
      loaded = true;
      release?.();
      unregister?.();
    };
  });
</script>

<div
  bind:this={root}
  class="federated-demo"
  data-federated-ready={ready}
  data-opened-revision={opened}
>
  <SearchPanelDemo layout="middle-top-tabs" diagnostics="none" />
  <FixtureControls label="Search history fixture">
  <button
    onclick={() => {
      loaded = true;
      release?.();
    }}>Load remaining history</button
  >
  </FixtureControls>
</div>

<style>
  .federated-demo {
    height: 100vh;
    min-height: 0;
  }

</style>
