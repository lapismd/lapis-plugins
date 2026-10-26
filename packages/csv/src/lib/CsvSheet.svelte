<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import {
    DEFAULT_CSV_SETTINGS,
    type CsvPluginSettings,
  } from "../csv-settings";
  import CsvSheetView from "./sheet/csv-sheet-view.svelte";

  let {
    app,
    file,
    onShowTable,
    onToggleSource,
  }: {
    app: App;
    file: TFile;
    onShowTable?: () => void;
    onToggleSource?: () => void;
  } = $props();

  let settings = $state<CsvPluginSettings>({ ...DEFAULT_CSV_SETTINGS });
  const loaded = $derived.by(() => app.vault.cachedRead(file));

  function handleContentChange(text: string) {
    void app.vault.modify(file, text);
  }
</script>

<div class="csv-table-frame" data-testid="csv-canvas" data-csv-role="file">
  {#key file.path}
    {#await loaded}
      <p class="csv-table-status">Reading this table.</p>
    {:then content}
      <CsvSheetView
        {app}
        {file}
        {content}
        {settings}
        onContentChange={handleContentChange}
        {onShowTable}
        {onToggleSource}
      />
    {:catch reason}
      <p class="csv-table-status" data-csv-error="true">
        {reason instanceof Error ? reason.message : "Unable to read this table."}
      </p>
    {/await}
  {/key}
</div>
