<script lang="ts">
  import {
    FileChangeStats,
    FileDiff,
    buildUnifiedDiffRows,
    type FileDiffViewMode,
  } from "@lapismd/design-core/diff";
  import CompareToolbar from "./CompareToolbar.svelte";
  import "./history-chrome.css";

  let {
    path,
    oldText = "",
    newText = "",
    onRestore,
    showToolbar = true,
    viewMode = $bindable("unified"),
    wrap = $bindable(false),
  }: {
    path: string;
    oldText?: string;
    newText?: string;
    onRestore?: () => void;
    showToolbar?: boolean;
    viewMode?: FileDiffViewMode;
    wrap?: boolean;
  } = $props();

  const rows = $derived(buildUnifiedDiffRows(oldText, newText));
  const additions = $derived(
    rows.filter((row) => row.variant === "added").length,
  );
  const deletions = $derived(
    rows.filter((row) => row.variant === "removed").length,
  );
</script>

<section
  class="sync-compare"
  data-ui-part="compare"
  aria-label="Compare {path}"
>
  {#if showToolbar}
    <div class="sync-compare__chrome">
      <div class="sync-compare__revision">
        <span data-testid="sync-compare-path">{path}</span>
        <FileChangeStats {additions} {deletions} showZero />
      </div>
      <CompareToolbar bind:viewMode bind:wrap {onRestore} />
    </div>
  {/if}
  <div class="sync-compare__body" data-testid="sync-file-diff">
    <FileDiff {path} {oldText} {newText} {viewMode} {wrap} />
  </div>
</section>
