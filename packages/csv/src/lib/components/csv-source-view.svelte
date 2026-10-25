<script lang="ts">
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import type { App, TFile } from "@lapis-notes/api";
  import type { Attachment } from "svelte/attachments";
  import {
    DEFAULT_CSV_SETTINGS,
    resolveDelimiter,
  } from "../../csv-settings";
  import { csvSourceExtensions } from "../codemirror/csv-source-extensions";
  import { CsvGrid } from "../model/csv-grid";
  import { csvBodyCounts, isCsvFindShortcut } from "../model/csv-search";
  import CsvFind from "./csv-find.svelte";
  import CsvStatusBar from "./csv-status-bar.svelte";

  let {
    app,
    file,
    onShowTable,
  }: {
    app: App;
    file: TFile;
    onShowTable: () => void;
  } = $props();

  let editor = $state<EditorView | null>(null);
  let text = $state("");
  let revision = $state(0);
  let searchOpen = $state(false);
  let searchRequest = $state(0);

  const counts = $derived.by(() => {
    if (!text) return { columns: 0, rows: 0 };
    const delimiter = resolveDelimiter(DEFAULT_CSV_SETTINGS, file.extension);
    const grid = CsvGrid.fromText(text, { delimiter, headerRow: true });
    return csvBodyCounts(grid.getRowCount(), grid.getColCount(), true);
  });

  function openSearch() {
    searchOpen = true;
    searchRequest += 1;
  }

  function toggleSearch() {
    if (searchOpen) {
      searchOpen = false;
      return;
    }
    openSearch();
  }

  function onFindShortcut(event: KeyboardEvent) {
    if (!isCsvFindShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
    openSearch();
  }

  const findShortcut: Attachment<HTMLElement> = (node) => {
    node.addEventListener("keydown", onFindShortcut, true);
    return () => node.removeEventListener("keydown", onFindShortcut, true);
  };

  const mountEditor: Attachment<HTMLDivElement> = (parent) => {
    let view: EditorView | null = null;
    let disposed = false;
    let writing = false;
    const currentApp = app;
    const currentFile = file;
    void currentApp.vault.cachedRead(currentFile).then((next) => {
      if (disposed) return;
      text = next;
      view = new EditorView({
        parent,
        state: EditorState.create({
          doc: next,
          extensions: [
            csvSourceExtensions(currentApp),
            EditorView.updateListener.of((update) => {
              if (!update.docChanged || writing) return;
              const value = update.state.doc.toString();
              text = value;
              revision += 1;
              writing = true;
              void currentApp.vault.modify(currentFile, value).finally(() => {
                writing = false;
              });
            }),
          ],
        }),
      });
      editor = view;
      revision += 1;
    });
    return () => {
      disposed = true;
      editor = null;
      view?.destroy();
    };
  };
</script>

<div
  class="csv-source-pane"
  data-testid="csv-source"
  data-csv-role="source"
  {@attach findShortcut}
>
  <CsvFind
    bind:open={searchOpen}
    {searchRequest}
    {editor}
    {revision}
  />
  <div class="csv-source-pane__editor" {@attach mountEditor}></div>
  <CsvStatusBar
    columns={counts.columns}
    rows={counts.rows}
    {searchOpen}
    mode="source"
    onToggleSearch={toggleSearch}
    onToggleMode={onShowTable}
  />
</div>
