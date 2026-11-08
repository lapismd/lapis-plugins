<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import * as HoverCard from "@lapismd/design-core/shadcn/hover-card";
  import FilePreview from "./file-preview.svelte";
  let {
    app,
    file,
  }: {
    app: App;
    file: TFile;
  } = $props();
  let open = $state(false);
  const previewable = $derived(
    ["md", "markdown"].includes(file.extension.toLowerCase()) &&
      app.markdownFileSurfaces.available,
  );

  function openFile(evt: MouseEvent) {
    open = false;
    if (evt.metaKey || evt.ctrlKey) {
      const leaf = app.workspace.getLeaf("tab");
      leaf.openFile(file).then(() => {
        app.workspace.revealLeaf(leaf);
        app.workspace.requestSaveLayout();
      });

      evt.preventDefault();
      return;
    }
    app.openFile(file).then(() => app.workspace.requestSaveLayout());
    evt.preventDefault();
  }
</script>

{#if previewable}
  <HoverCard.Root bind:open openDelay={350} closeDelay={150}>
    <HoverCard.Trigger href="#/" onclick={openFile}>
      {#snippet child({ props })}
        <a {...props} role="link" class="bases-file-link">{file.name}</a>
      {/snippet}
    </HoverCard.Trigger>
    <HoverCard.Content class="bases-file-preview" align="start">
      <FilePreview {app} {file} />
    </HoverCard.Content>
  </HoverCard.Root>
{:else}
  <a href="#/" class="bases-file-link" onclick={openFile}>{file.name}</a>
{/if}
