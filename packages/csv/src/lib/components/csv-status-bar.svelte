<script lang="ts">
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
  import GridIcon from "@lucide/svelte/icons/grid-3x3";
  import SearchIcon from "@lucide/svelte/icons/search";
  import TableIcon from "@lucide/svelte/icons/table";
  import { csvStatusLabel } from "../model/csv-search";

  let {
    columns,
    rows,
    shownRows = undefined,
    searchOpen = false,
    mode = "table",
    onToggleSearch,
    onToggleMode,
    onShowCanvas,
    onShowTable,
  }: {
    columns: number;
    rows: number;
    shownRows?: number;
    searchOpen?: boolean;
    mode?: "table" | "canvas" | "source";
    onToggleSearch: () => void;
    onToggleMode?: () => void;
    onShowCanvas?: () => void;
    onShowTable?: () => void;
  } = $props();

  const label = $derived(csvStatusLabel(columns, rows, shownRows));
  const modeLabel = $derived(
    mode === "source" ? "View CSV table" : "View CSV source",
  );
</script>

<footer class="csv-status-bar" data-testid="csv-status-bar">
  <button
    type="button"
    class={["csv-status-bar__icon", { "csv-status-bar__icon--pressed": searchOpen }]}
    aria-label="Find and replace"
    aria-pressed={searchOpen}
    title="Find and replace"
    onclick={(event) => {
      event.stopPropagation();
      onToggleSearch();
    }}
  >
    <SearchIcon aria-hidden="true" />
  </button>
  <span class="csv-status-bar__text">{label}</span>
  {#if onShowCanvas || onShowTable || onToggleMode}
    <div class="csv-status-bar__modes">
      {#if onShowCanvas}
        <button
          type="button"
          class="csv-status-bar__icon"
          aria-label="View CSV canvas"
          title="View CSV canvas"
          onclick={(event) => {
            event.stopPropagation();
            onShowCanvas();
          }}
        >
          <GridIcon aria-hidden="true" />
        </button>
      {/if}
      {#if onShowTable}
        <button
          type="button"
          class="csv-status-bar__icon"
          aria-label="View CSV table"
          title="View CSV table"
          onclick={(event) => {
            event.stopPropagation();
            onShowTable();
          }}
        >
          <TableIcon aria-hidden="true" />
        </button>
      {/if}
      {#if onToggleMode}
        <button
          type="button"
          class="csv-status-bar__icon csv-status-bar__mode"
          aria-label={modeLabel}
          title={modeLabel}
          onclick={(event) => {
            event.stopPropagation();
            onToggleMode();
          }}
        >
          {#if mode === "source"}
            <TableIcon aria-hidden="true" />
          {:else}
            <FileCodeIcon aria-hidden="true" />
          {/if}
        </button>
      {/if}
    </div>
  {/if}
</footer>
