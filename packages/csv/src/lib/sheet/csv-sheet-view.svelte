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
import {
  emptySheetHistory,
  recordSheetEdit,
  redoSheetEdit,
  undoSheetEdit,
} from "./sheet-history";
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
  let history = $state(emptySheetHistory<SheetSnapshot>());

  type SheetSnapshot = {
    text: string;
    widths: number[];
    sort: CsvColumnSort | null;
  };

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

  function copySort(sort: CsvColumnSort | null): CsvColumnSort | null {
    if (!sort) return null;
    return {
      index: sort.index,
      direction: sort.direction,
      baseline: sort.baseline.map((row) => [...row]),
      order: [...sort.order],
    };
  }

  function snapshot(): SheetSnapshot {
    return { text, widths: [...widths], sort: copySort(columnSort) };
  }

  function publish(nextGrid: CsvGrid, before: SheetSnapshot) {
    const next = nextGrid.toText({ delimiter });
    if (before.text !== next) history = recordSheetEdit(history, before);
    incoming = next;
    onContentChange?.(next);
  }

  function restore(entry: SheetSnapshot) {
    incoming = entry.text;
    columnSort = copySort(entry.sort);
    rememberWidths([...entry.widths]);
    onContentChange?.(entry.text);
  }

  function undoSheet() {
    const step = undoSheetEdit(history, snapshot());
    if (!step) return;
    history = step.history;
    restore(step.value);
  }

  function redoSheet() {
    const step = redoSheetEdit(history, snapshot());
    if (!step) return;
    history = step.history;
    restore(step.value);
  }

  function rememberWidths(next: number[]) {
    widthOverride = { path: file.path, widths: next };
    writeSessionWidths(file.path, next);
  }

  function changeCell(row: number, col: number, value: string) {
    const before = snapshot();
    const next = parsed.grid.clone();
    next.updateCell(row, col, value);
    if (columnSort) noteCsvColumnSortEdit(columnSort, row, col, value);
    publish(next, before);
  }

  function sortColumn(col: number) {
    const before = snapshot();
    const next = parsed.grid.clone();
    columnSort = toggleCsvColumnSort(
      next,
      columnSort,
      col,
      settings.headerRow,
    );
    publish(next, before);
  }

  function deleteRow(index: number) {
    const before = snapshot();
    const next = parsed.grid.clone();
    next.deleteRowAt(index);
    columnSort = null;
    publish(next, before);
  }

  function deleteColumn(index: number) {
    const before = snapshot();
    const next = parsed.grid.clone();
    next.deleteColumnAt(index);
    columnSort = noteCsvColumnDeleted(columnSort, index);
    const stored = widths.filter((_, column) => column !== index);
    rememberWidths(stored.length > 0 ? stored : [SHEET_DEFAULT_COLUMN_WIDTH]);
    publish(next, before);
  }

  function moveColumn(from: number, to: number) {
    if (from === to || to < 0 || to >= parsed.grid.getColCount()) return;
    const before = snapshot();
    const next = parsed.grid.clone();
    next.moveColumnAt(from, to);
    columnSort = noteCsvColumnMoved(columnSort, from, to);
    const stored = [...widths];
    const [width] = stored.splice(from, 1);
    stored.splice(to, 0, width ?? SHEET_DEFAULT_COLUMN_WIDTH);
    rememberWidths(stored);
    publish(next, before);
  }

  function moveRow(from: number, to: number) {
    if (from === to || to < 0 || to >= parsed.grid.getRowCount()) return;
    const before = snapshot();
    const next = parsed.grid.clone();
    next.moveRowAt(from, to);
    columnSort = null;
    publish(next, before);
  }

  function clearCoordinates(coords: Array<[number, number]>) {
    const before = snapshot();
    const next = parsed.grid.clone();
    next.clearCellsAt(coords);
    if (columnSort) {
      for (const [row, col] of coords) {
        noteCsvColumnSortEdit(columnSort, row, col, "");
      }
    }
    publish(next, before);
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

  function clearSheet() {
    const coords: Array<[number, number]> = [];
    for (let row = 0; row < parsed.grid.getRowCount(); row += 1) {
      for (let col = 0; col < parsed.grid.getColCount(); col += 1) {
        coords.push([row, col]);
      }
    }
    clearCoordinates(coords);
  }

  function deleteSheet() {
    const before = snapshot();
    const next = parsed.grid.clone();
    while (next.getRowCount() > 1) next.deleteRowAt(next.getRowCount() - 1);
    if (!settings.headerRow) {
      const coords: Array<[number, number]> = [];
      for (let col = 0; col < next.getColCount(); col += 1) coords.push([0, col]);
      next.clearCellsAt(coords);
    }
    columnSort = null;
    publish(next, before);
  }

  function replaceCells(edits: { row: number; col: number; value: string }[]) {
    const before = snapshot();
    const next = parsed.grid.clone();
    for (const edit of edits) {
      next.updateCell(edit.row, edit.col, edit.value);
      if (columnSort) noteCsvColumnSortEdit(columnSort, edit.row, edit.col, edit.value);
    }
    publish(next, before);
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

  function onHistoryShortcut(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const meta = event.metaKey || event.ctrlKey;
    if (!meta || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      undoSheet();
    } else if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      redoSheet();
    }
  }

  const findShortcut: Attachment<HTMLElement> = (node) => {
    node.addEventListener("keydown", onFindShortcut, true);
    node.addEventListener("keydown", onHistoryShortcut);
    return () => {
      node.removeEventListener("keydown", onFindShortcut, true);
      node.removeEventListener("keydown", onHistoryShortcut);
    };
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
    onClearSheet={clearSheet}
    onDeleteSheet={deleteSheet}
    canUndo={history.past.length > 0}
    canRedo={history.future.length > 0}
    onUndo={undoSheet}
    onRedo={redoSheet}
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
