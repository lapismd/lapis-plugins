<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import CsvTableView from "./components/csv-table-view.svelte";
  import {
    DEFAULT_CSV_SETTINGS,
    patchCsvSettings,
    type CsvPluginSettings,
    type CsvPluginSettingsPatch,
  } from "../csv-settings";

  let {
    app,
    file,
    role = "file",
    onToggleSource,
    onShowCanvas,
  }: {
    app: App;
    file: TFile;
    role?: "file" | "embed";
    onToggleSource?: () => void;
    onShowCanvas?: () => void;
  } = $props();

  let settings = $state<CsvPluginSettings>({ ...DEFAULT_CSV_SETTINGS });
  const loaded = $derived.by(() => app.vault.cachedRead(file));

  function handleContentChange(text: string) {
    void app.vault.modify(file, text);
  }

  function handleSettingsChange(patch: CsvPluginSettingsPatch) {
    settings = patchCsvSettings(settings, patch);
  }
</script>

<div class="csv-table-frame" data-testid="csv-table" data-csv-role={role}>
  {#key file.path}
    {#await loaded}
      <p class="csv-table-status">Reading this table.</p>
    {:then content}
      <CsvTableView
        {app}
        {file}
        {content}
        {settings}
        onContentChange={handleContentChange}
        onSettingsChange={handleSettingsChange}
        {onToggleSource}
        {onShowCanvas}
      />
    {:catch reason}
      <p class="csv-table-status" data-csv-error="true">
        {reason instanceof Error ? reason.message : "Unable to read this table."}
      </p>
    {/await}
  {/key}
</div>
