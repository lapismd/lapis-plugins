<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { untrack } from "svelte";
  import { CanvasImageSource, type CanvasImageSnapshot } from "./lib/canvas-image-source";
  let { app, path, sourcePath = "", mode = "cover" }: { app?: App; path: string; sourcePath?: string; mode?: "cover" | "ratio" | "repeat" } = $props();
  let snapshot = $state<CanvasImageSnapshot>({ url: null, error: null });
  let decodeError = $state(false);
  const imageSize = $derived(mode === "ratio" ? "contain" : mode === "repeat" ? "auto" : "cover");
  $effect(() => {
    const owner = app, file = path, relative = sourcePath;
    decodeError = false;
    if (!owner) { snapshot = { url: null, error: "Open this canvas in its vault to view the background." }; return; }
    const source = untrack(() => new CanvasImageSource(owner, file, relative, (value) => { snapshot = value; decodeError = false; }));
    return () => source.destroy();
  });
</script>

{#if snapshot.url && !decodeError}
  <div class="canvas-group-background" data-canvas-group-background aria-hidden="true"
    style:background-image={`url(${JSON.stringify(snapshot.url)})`}
    style:background-size={imageSize}
    style:background-repeat={mode === "repeat" ? "repeat" : "no-repeat"}
    style:background-position={mode === "repeat" ? "left top" : "center"}>
    <img hidden src={snapshot.url} alt="" data-canvas-background-probe onerror={() => { decodeError = true; }} />
  </div>
{:else if snapshot.error || decodeError}
  <p class="canvas-group-background-error" role="note">Background image unavailable. {snapshot.error ?? "The image could not be displayed."}</p>
{/if}

<style>
  .canvas-group-background { position: absolute; inset: 4px; border-radius: calc(0.9rem - 4px); pointer-events: none; overflow: hidden; }
  .canvas-group-background-error { position: absolute; bottom: 8px; left: 8px; max-width: calc(100% - 16px); padding: 5px 8px; margin: 0; border-radius: 5px; background: var(--canvas-readable-surface, var(--background-secondary)); color: var(--canvas-readable-text, var(--text-normal)); font-size: 12px; pointer-events: none; }
</style>
