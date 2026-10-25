<script lang="ts">
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
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
  }: {
    columns: number;
    rows: number;
    shownRows?: number;
    searchOpen?: boolean;
    mode?: "table" | "source";
    onToggleSearch: () => void;
    onToggleMode?: () => void;
  } = $props();

  const label = $derived(csvStatusLabel(columns, rows, shownRows));
  const modeLabel = $derived(
    mode === "table" ? "View CSV source" : "View CSV table",
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
      {#if mode === "table"}
        <FileCodeIcon aria-hidden="true" />
      {:else}
        <TableIcon aria-hidden="true" />
      {/if}
    </button>
  {/if}
</footer>
