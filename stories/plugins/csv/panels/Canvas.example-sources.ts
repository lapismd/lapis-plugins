export const canvasWorkspaceSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
  import { CSVPlugin, CSV_VIEW_TYPE } from "@lapis-notes/csv";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/csv/styles.css";

  const database = new MemoryAppDatabase("csv-canvas-example");
  const app = new App({
    version: "0.1.0", configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      "Sample.csv": "Name,Status\\nBasin mark,Ready\\nNorth basin,Review\\n",
    }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  app.plugins.registerStaticPlugins([
    { plugin: CSVPlugin, enabledByDefault: true },
  ]);
  onMount(() => {
    const boot = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.workspace.loadLayout();
      const leaf = app.workspace.getLeaf("tab");
      await leaf.setViewState({
        type: CSV_VIEW_TYPE,
        state: { file: "Sample.csv", mode: "canvas" },
      });
      app.workspace.setActiveLeaf(leaf, { focus: false });
    })();
    return () => { void boot.finally(async () => {
      await app.fileEditingSessions.settleOperations();
      for (const plugin of [...app.plugins.plugins.values()].reverse()) await plugin.disable();
      await app.workspace.disposeWorkspaceHost();
      await app.fileEditingSessions.dispose();
      await app.metadataCache.dispose();
      await database.close();
    }); };
  });
</script>

<WorkspaceShell {app} />`;
