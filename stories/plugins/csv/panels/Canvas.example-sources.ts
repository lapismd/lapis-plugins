import {
  createPanelDemoLayout,
  PANEL_VIEW_TYPE,
  type PanelDemoLayout,
} from "../../_shared/panels/create-panel-demo";

function layoutSource(layout: PanelDemoLayout): string {
  const state = createPanelDemoLayout("bookmarks", layout);
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    const view = node.state as Record<string, unknown> | undefined;
    if (node.type === "leaf" && view?.type === PANEL_VIEW_TYPE.bookmarks) {
      node.state = {
        type: "lapis-csv",
        state: { file: "Sample.csv", mode: "canvas" },
        title: "Sample.csv",
        icon: "table",
      };
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(state);
  return JSON.stringify(state, null, 2);
}

export function canvasWorkspaceSource(layout: PanelDemoLayout): string {
  const openNote =
    layout === "middle-top-tabs"
      ? `
      const note = app.workspace.getLeaf("tab");
      await note.setViewState({
        type: "markdown", state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
      });
      app.workspace.setActiveLeaf(note, { focus: false });`
      : "";
  return `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
  import { CSVPlugin, SAMPLE_READING_NOTE_PATH, sampleReadingMarkdown } from "@lapis-notes/csv";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { SourceEditorPlugin } from "@lapis-notes/source-editor";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/csv/styles.css";

  const database = new MemoryAppDatabase("csv-canvas-${layout}");
  const app = new App({
    version: "0.1.0", configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      "Sample.csv": "Name,Status\\nBasin mark,Ready\\nNorth basin,Review\\n",
      [SAMPLE_READING_NOTE_PATH]: sampleReadingMarkdown(),
      "Notes/Welcome.md": "# Welcome\\nAn ordinary Markdown preview.\\n",
      ".lapis/app.json": JSON.stringify({ "lapis-csv.defaultView": "canvas" }),
      ".lapis/workspace.json": ${JSON.stringify(layoutSource(layout))},
    }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  app.plugins.registerStaticPlugins([
    { plugin: SourceEditorPlugin, enabledByDefault: true },
    { plugin: MarkdownPlugin, enabledByDefault: true },
    { plugin: CSVPlugin, enabledByDefault: true },
  ]);
  onMount(() => {
    const boot = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.metadataCache.load();
      await app.workspace.loadLayout();${openNote}
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
}
