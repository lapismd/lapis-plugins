<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { delimiterForExtension, parseDelimitedText } from "./parse-csv";

  let {
    app,
    file,
    role = "file",
  }: {
    app: App;
    file: TFile;
    role?: "file" | "embed";
  } = $props();

  const rows = $derived.by(() => {
    const currentApp = app;
    const currentFile = file;
    return currentApp.vault.cachedRead(currentFile).then((text) =>
      parseDelimitedText(text, delimiterForExtension(currentFile.extension)),
    );
  });
</script>

<div
  class={["csv-table-frame", { "csv-table-embedded": role === "embed" }]}
  data-testid="csv-table"
  data-csv-role={role}
>
  {#await rows}
    <p class="csv-table-status">Reading this table.</p>
  {:then parsed}
    {@const header = parsed[0] ?? []}
    {#if header.length === 0}
      <p class="csv-table-status">This file has no rows.</p>
    {:else}
      <table class="csv-table">
        <thead>
          <tr>
            {#each header as cell, column (column)}
              <th scope="col">{cell}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each parsed.slice(1) as row, rowIndex (rowIndex)}
            <tr>
              {#each header as _, column (`${rowIndex}-${column}`)}
                <td>{row[column] ?? ""}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {:catch reason}
    <p class="csv-table-status" data-csv-error="true">
      {reason instanceof Error ? reason.message : "Unable to read this table."}
    </p>
  {/await}
</div>
