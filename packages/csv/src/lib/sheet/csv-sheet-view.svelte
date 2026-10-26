<script lang="ts">
  import { cn } from "@lapis-notes/ui";
  import type { App, TFile } from "@lapis-notes/api";
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import {
    noteCsvColumnDeleted,
    noteCsvColumnMoved,
    noteCsvColumnSortEdit,
    toggleCsvColumnSort,
    type CsvColumnSort,
  } from "../model/csv-column-sort";
  import { CsvGrid } from "../model/csv-grid";
  import { parseCsvText } from "../model/parse-csv";
  import {
    csvBodyCounts,
    csvCellMatches,
    csvSearchQuery,
    csvShownRowCount,
    isCsvFindShortcut,
  } from "../model/csv-search";
  import {
    resolveDelimiter,
    type CsvPluginSettings,
  } from "../../csv-settings";
  import CsvFind from "../components/csv-find.svelte";
  import CsvStatusBar from "../components/csv-status-bar.svelte";
  import CsvSheet from "./csv-sheet.svelte";
  import {
    SHEET_DEFAULT_COLUMN_WIDTH,
    readSessionWidths,
    writeSessionWidths,
  } from "./sheet-layout";

  let {
    app,
    file,
    content,
    settings,
    class: className,
    onContentChange,
    onShowTable,
    onToggleSource,
  }: {
    app: App;
    file: TFile;
    content: string;
    settings: CsvPluginSettings;
    class?: string;
    onContentChange?: (text: string) => void;
    onShowTable?: () => void;
    onToggleSource?: () => void;
  } = $props();

  let incoming = $state<string | null>(null);
  let searchOpen = $state(false);
  let searchRequest = $state(0);
  let searchValue = $state("");
  let replaceValue = $state("");
  let caseSensitive = $state(false);
  let wholeWord = $state(false);
  let regexp = $state(false);
  let active = $state(0);
  let columnSort = $state<CsvColumnSort | null>(null);
  let widthOverride = $state<{ path: string; widths: number[] } | null>(null);

  const text = $derived(incoming ?? content);
  const delimiter = $derived(resolveDelimiter(settings, file.extension));
  const parsed = $derived.by(() => {
    const source = text;
    const result = parseCsvText(source, { delimiter });
    return {
      errors: result.errors.map(
        (error) => `Row ${error.row ?? "?"}: ${error.message}`,
      ),
      grid:
        result.rows.length > 0
          ? CsvGrid.fromText(source, {
              delimiter,
              headerRow: settings.headerRow,
            })
          : CsvGrid.empty(),
    };
  });
  const rows = $derived(parsed.grid.getRows());
  const counts = $derived(
    csvBodyCounts(
      parsed.grid.getRowCount(),
      parsed.grid.getColCount(),
      settings.headerRow,
    ),
  );
  const searchQuery = $derived(
    csvSearchQuery({
      search: searchValue,
      replace: replaceValue,
      caseSensitive,
      wholeWord,
      regexp,
    }),
  );
  const filtering = $derived(
    searchOpen && searchQuery.search.length > 0 && searchQuery.valid,
  );
  const searchMatches = $derived.by(() => {
    if (!filtering) return [];
    return csvCellMatches(rows, searchQuery);
  });
  const matchedRows = $derived(
    new Set(searchMatches.map((match) => match.row)),
  );
  const bodyRows = $derived.by(() => {
    const start = settings.headerRow ? 1 : 0;
    const indexes: number[] = [];
    for (let index = start; index < rows.length; index += 1) {
      if (!filtering || matchedRows.has(index)) indexes.push(index);
    }
    return indexes;
  });
  const shownRows = $derived(
    filtering
      ? csvShownRowCount(rows.length, settings.headerRow, searchMatches)
      : undefined,
  );
  const searchCell = $derived.by(() => {
    if (searchMatches.length === 0) return null;
    const match = searchMatches[Math.min(active, searchMatches.length - 1)];
    return match ? { row: match.row, col: match.col } : null;
  });
  const widths = $derived.by(() => {
    const count = parsed.grid.getColCount();
    const stored = widthOverride;
    if (
      stored &&
      stored.path === file.path &&
      stored.widths.length === count
    ) {
      return stored.widths;
    }
    return readSessionWidths(file.path, count);
  });

  function publish(nextGrid: CsvGrid) {
    const next = nextGrid.toText({ delimiter });
    incoming = next;
    onContentChange?.(next);
  }

  function rememberWidths(next: number[]) {
    widthOverride = { path: file.path, widths: next };
    writeSessionWidths(file.path, next);
  }

  function changeCell(row: number, col: number, value: string) {
    const next = parsed.grid.clone();
    next.updateCell(row, col, value);
    if (columnSort) noteCsvColumnSortEdit(columnSort, row, col, value);
    publish(next);
  }

  function sortColumn(col: number) {
    const next = parsed.grid.clone();
    columnSort = toggleCsvColumnSort(
      next,
      columnSort,
      col,
      settings.headerRow,
    );
    publish(next);
  }

  function deleteRow(index: number) {
    const next = parsed.grid.clone();
    next.deleteRowAt(index);
    columnSort = null;
    publish(next);
  }

  function deleteColumn(index: number) {
    const next = parsed.grid.clone();
    next.deleteColumnAt(index);
    columnSort = noteCsvColumnDeleted(columnSort, index);
    const stored = widths.filter((_, column) => column !== index);
    rememberWidths(stored.length > 0 ? stored : [SHEET_DEFAULT_COLUMN_WIDTH]);
    publish(next);
  }

  function moveColumn(from: number, to: number) {
    if (from === to || to < 0 || to >= parsed.grid.getColCount()) return;
    const next = parsed.grid.clone();
    next.moveColumnAt(from, to);
    columnSort = noteCsvColumnMoved(columnSort, from, to);
    const stored = [...widths];
    const [width] = stored.splice(from, 1);
    stored.splice(to, 0, width ?? SHEET_DEFAULT_COLUMN_WIDTH);
    rememberWidths(stored);
    publish(next);
  }

  function moveRow(from: number, to: number) {
    if (from === to || to < 0 || to >= parsed.grid.getRowCount()) return;
    const next = parsed.grid.clone();
    next.moveRowAt(from, to);
    columnSort = null;
    publish(next);
  }

  function clearCoordinates(coords: Array<[number, number]>) {
    const next = parsed.grid.clone();
    next.clearCellsAt(coords);
    if (columnSort) {
      for (const [row, col] of coords) {
        noteCsvColumnSortEdit(columnSort, row, col, "");
      }
    }
    publish(next);
  }

  function clearColumn(col: number) {
    const coords: Array<[number, number]> = [];
    for (let row = 0; row < parsed.grid.getRowCount(); row += 1) {
      coords.push([row, col]);
    }
    clearCoordinates(coords);
  }

  function clearRow(row: number) {
    const coords: Array<[number, number]> = [];
    for (let col = 0; col < parsed.grid.getColCount(); col += 1) {
      coords.push([row, col]);
    }
    clearCoordinates(coords);
  }

  function clearCell(row: number, col: number) {
    changeCell(row, col, "");
  }

  function replaceCells(edits: { row: number; col: number; value: string }[]) {
    const next = parsed.grid.clone();
    for (const edit of edits) {
      next.updateCell(edit.row, edit.col, edit.value);
      if (columnSort) noteCsvColumnSortEdit(columnSort, edit.row, edit.col, edit.value);
    }
    publish(next);
  }

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

  onMount(() => {
    const currentApp = app;
    const currentFile = file;
    const modified = currentApp.vault.on("modify", (candidate) => {
      if (candidate.path !== currentFile.path) return;
      void currentApp.vault.cachedRead(currentFile).then((next) => {
        incoming = next;
      });
    });
    return () => {
      currentApp.vault.offref(modified);
    };
  });
</script>

<div class={cn("csv-sheet-view", className)} {@attach findShortcut}>
  {#if parsed.errors.length > 0}
    <div class="csv-table-view__errors" role="status">
      {#each parsed.errors as error (error)}
        <p>{error}</p>
      {/each}
    </div>
  {/if}
  <CsvFind
    bind:open={searchOpen}
    bind:searchValue
    bind:replaceValue
    bind:caseSensitive
    bind:wholeWord
    bind:regexp
    bind:active
    {searchRequest}
    {rows}
    onReplaceCells={replaceCells}
  />
  <CsvSheet
    grid={parsed.grid}
    headerRow={settings.headerRow}
    {bodyRows}
    {searchCell}
    sort={columnSort}
    {widths}
    onWidths={rememberWidths}
    onCellChange={changeCell}
    onSort={sortColumn}
    onDeleteRow={deleteRow}
    onDeleteColumn={deleteColumn}
    onMoveColumn={moveColumn}
    onMoveRow={moveRow}
    onClearColumn={clearColumn}
    onClearRow={clearRow}
    onClearCell={clearCell}
  />
  <CsvStatusBar
    columns={counts.columns}
    rows={counts.rows}
    {shownRows}
    {searchOpen}
    mode="canvas"
    onToggleSearch={toggleSearch}
    onShowTable={onShowTable}
    onToggleMode={onToggleSource}
  />
</div>
