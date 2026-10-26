<script lang="ts">
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { cn } from "@lapis-notes/ui";
  import type { App, TFile } from "@lapis-notes/api";
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
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
    type CsvPluginSettingsPatch,
  } from "../../csv-settings";
  import CsvDataTable from "./csv-data-table.svelte";
  import CsvFind from "./csv-find.svelte";
  import { CSV_ROW_HEIGHT } from "./csv-row-virtualizer.svelte";
  import CsvStatusBar from "./csv-status-bar.svelte";

  type Props = {
    app: App;
    file: TFile;
    content: string;
    settings: CsvPluginSettings;
    class?: string;
    onContentChange?: (text: string) => void;
    onSettingsChange?: (patch: CsvPluginSettingsPatch) => void;
    onToggleSource?: () => void;
    onShowCanvas?: () => void;
  };

  let {
    app,
    file,
    content,
    settings,
    class: className,
    onContentChange,
    onSettingsChange,
    onToggleSource,
    onShowCanvas,
  }: Props = $props();

  let scrollViewport = $state<HTMLElement | null>(null);
  let incoming = $state<string | null>(null);
  let searchOpen = $state(false);
  let searchRequest = $state(0);
  let searchValue = $state("");
  let replaceValue = $state("");
  let caseSensitive = $state(false);
  let wholeWord = $state(false);
  let regexp = $state(false);
  let active = $state(0);
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
  const filteredBodyIndexes = $derived.by(() => {
    if (!filtering) return null;
    const start = settings.headerRow ? 1 : 0;
    const indexes: number[] = [];
    for (let index = start; index < rows.length; index += 1) {
      if (matchedRows.has(index)) indexes.push(index);
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

  function handleGridChange(nextGrid: CsvGrid) {
    const next = nextGrid.toText({ delimiter });
    incoming = next;
    onContentChange?.(next);
  }

  function replaceCells(
    edits: { row: number; col: number; value: string }[],
  ) {
    const next = parsed.grid.clone();
    for (const edit of edits) next.updateCell(edit.row, edit.col, edit.value);
    handleGridChange(next);
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

  const scrollToSearch: Attachment<HTMLElement> = () => {
    const viewport = scrollViewport;
    if (!viewport) return;
    const target = searchCell;
    if (!target) {
      if (filtering) viewport.scrollTop = 0;
      return;
    }
    if (settings.headerRow && target.row === 0) return;
    const bodyIndex = filteredBodyIndexes
      ? filteredBodyIndexes.indexOf(target.row)
      : settings.headerRow
        ? target.row - 1
        : target.row;
    if (bodyIndex < 0) return;
    const top = Math.max(0, bodyIndex) * CSV_ROW_HEIGHT;
    const bottom = top + CSV_ROW_HEIGHT;
    const viewTop = viewport.scrollTop;
    const viewBottom = viewTop + viewport.clientHeight;
    if (top >= viewTop && bottom <= viewBottom) return;
    viewport.scrollTop = Math.max(
      0,
      top - Math.floor(viewport.clientHeight / 3),
    );
  };

  const searchScrollKey = $derived.by(() => {
    if (!filtering) return "";
    if (!searchCell) return "none";
    const bodyIndex = filteredBodyIndexes?.indexOf(searchCell.row) ?? -1;
    return `${bodyIndex}:${searchCell.col}`;
  });

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

<div class={cn("csv-table-view", className)} {@attach findShortcut}>
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
  {#key searchScrollKey}
    <span hidden {@attach scrollToSearch}></span>
  {/key}

  <ScrollArea
    class="csv-table-view__scroll"
    orientation="both"
    bind:viewportRef={scrollViewport}
  >
    <CsvDataTable
      grid={parsed.grid}
      headerRow={settings.headerRow}
      showRowNumbers={settings.showRowNumbers}
      {scrollViewport}
      rowFilter={filtering ? matchedRows : null}
      {searchCell}
      onChange={handleGridChange}
      {onSettingsChange}
      {onToggleSource}
    />
  </ScrollArea>
  <CsvStatusBar
    columns={counts.columns}
    rows={counts.rows}
    {shownRows}
    {searchOpen}
    mode="table"
    onToggleSearch={toggleSearch}
    onToggleMode={onToggleSource}
    {onShowCanvas}
  />
</div>
