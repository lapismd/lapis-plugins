<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { FileEmbed, createLapisMiraFileAdapter } from "@lapis-notes/markdown/embed";

  let { app, path, subpath, sourcePath = "" }: { app: App; path: string; subpath?: string; sourcePath?: string } = $props();
  let revision = $state(0);
  $effect(() => createLapisMiraFileAdapter(app).watchTarget?.({ href: path, path, sourcePath }, () => { revision++; }));
  const file = $derived.by(() => {
    void revision;
    return app.vault.getFileByPath(path) ?? app.metadataCache.getFirstLinkpathDest(path, sourcePath);
  });
</script>

<div class="canvas-file-content">
  {#if file}
    <FileEmbed {app} {file} id={file.path} text={file.name} sectionId={subpath?.replace(/^#/, "")} {sourcePath} />
  {:else}
    <p class="canvas-file-missing" role="note">File not found: {path}</p>
  {/if}
</div>

<style>
  .canvas-file-content { width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: auto; }
  .canvas-file-missing { margin: 0; padding: 12px; color: inherit; }
</style>
