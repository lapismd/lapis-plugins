<script lang="ts">
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { cn } from "@lapis-notes/ui";
  import type { App, TFile } from "@lapis-notes/api";
  import { onMount } from "svelte";
  import { CsvGrid } from "../model/csv-grid";
  import { parseCsvText } from "../model/parse-csv";
  import {
    resolveDelimiter,
    type CsvPluginSettings,
    type CsvPluginSettingsPatch,
  } from "../../csv-settings";
  import CsvDataTable from "./csv-data-table.svelte";

  type Props = {
    app: App;
    file: TFile;
    content: string;
    settings: CsvPluginSettings;
    class?: string;
    onContentChange?: (text: string) => void;
    onSettingsChange?: (patch: CsvPluginSettingsPatch) => void;
    onToggleSource?: () => void;
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
  }: Props = $props();

  let scrollViewport = $state<HTMLElement | null>(null);
  let incoming = $state<string | null>(null);
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

  function handleGridChange(nextGrid: CsvGrid) {
    const next = nextGrid.toText({ delimiter });
    incoming = next;
    onContentChange?.(next);
  }

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

<div class={cn("csv-table-view", className)}>
  {#if parsed.errors.length > 0}
    <div class="csv-table-view__errors" role="status">
      {#each parsed.errors as error (error)}
        <p>{error}</p>
      {/each}
    </div>
  {/if}

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
      onChange={handleGridChange}
      {onSettingsChange}
      {onToggleSource}
    />
  </ScrollArea>
</div>
