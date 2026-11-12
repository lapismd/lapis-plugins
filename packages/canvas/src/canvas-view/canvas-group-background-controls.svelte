<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { getContext, tick } from "svelte";
  import Image from "@lucide/svelte/icons/image";
  import X from "@lucide/svelte/icons/x";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { resolveCanvasImage } from "../lib/canvas-image-source";
  import { toCanvasFileRef } from "../lib/canvas-text-preview";
  type BackgroundStyle = "cover" | "ratio" | "repeat";
  let { app, nodeId, background, backgroundStyle, onOpen }: { app: App; nodeId: string; background?: string; backgroundStyle?: BackgroundStyle; onOpen?: () => void } = $props();
  const board = getContext<CanvasBoardController | undefined>("lapis-canvas-board");
  const source = getContext<{ readonly current: string } | undefined>("lapis-canvas-source");
  const titleId = `canvas-background-${crypto.randomUUID()}`;
  let dialog = $state<HTMLDialogElement | null>(null);
  let setButton = $state<HTMLButtonElement | null>(null);
  let opened = $state(false);
  let path = $state("");
  let sizing = $state<BackgroundStyle>("cover");
  let error = $state<string | null>(null);
  let working = $state(false);
  const files = $derived(opened ? app.vault.getFiles().filter((file) => toCanvasFileRef(file).kind === "image") : []);
  async function open(): Promise<void> {
    if (board?.inputBlocked) return;
    onOpen?.(); error = null; path = background ?? ""; sizing = backgroundStyle ?? "cover";
    opened = true; await tick();
    if (!dialog || board?.inputBlocked) { opened = false; return; }
    dialog.showModal();
  }
  async function change(nextPath?: string, mode?: BackgroundStyle): Promise<boolean> {
    if (!board || working) return false;
    working = true; error = null;
    try {
      await board.flush();
      const current = board.read();
      const target = current.nodes?.find((node) => node.id === nodeId);
      if (target?.type !== "group") throw new Error("The group is no longer available.");
      board.beginGesture();
      board.apply({ ...current, nodes: current.nodes!.map((node) => node.id === nodeId ? { ...node, background: nextPath, backgroundStyle: mode } : node) }, new Set([nodeId]));
      await tick(); return true;
    } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); return false; }
    finally { working = false; }
  }
  async function apply(): Promise<void> {
    try {
      const image = resolveCanvasImage(app, path.trim(), source?.current ?? "");
      if (!image) { error = "Choose an existing vault image."; return; }
      if (await change(image.path, sizing)) { dialog?.close(); opened = false; await tick(); setButton?.focus(); }
    } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
  }
  async function remove(): Promise<void> {
    if (await change()) { await tick(); setButton?.focus(); }
  }
</script>

<button bind:this={setButton} type="button" class="canvas-node-toolbar-button" aria-label="Set group background" title="Set group background" aria-haspopup="dialog" onclick={() => void open()}><Image aria-hidden="true" /></button>
{#if background}
  <button type="button" class="canvas-node-toolbar-button" disabled={working} aria-label="Remove group background" title="Remove group background" onclick={() => void remove()}><X aria-hidden="true" /></button>
{/if}
{#if error && !opened}<p role="alert">{error}</p>{/if}
{#if opened}
  <dialog class="nodrag nopan" bind:this={dialog} inert={board?.inputBlocked ?? false} aria-labelledby={titleId} onpointerup={(event) => event.stopPropagation()} onclose={() => { opened = false; }}>
    <form onsubmit={(event) => { event.preventDefault(); void apply(); }}>
      <h2 id={titleId}>Group background</h2>
      <label>Image file<input list={`${titleId}-images`} bind:value={path} required disabled={working} aria-invalid={error ? "true" : undefined} /></label>
      <datalist id={`${titleId}-images`}>{#each files as file (file.path)}<option value={file.path}></option>{/each}</datalist>
      <label>Background sizing<select bind:value={sizing} disabled={working}><option value="cover">Fill group</option><option value="ratio">Fit image</option><option value="repeat">Repeat image</option></select></label>
      {#if error}<p role="alert">{error}</p>{/if}
      <div class="actions"><button type="button" disabled={working} onclick={() => dialog?.close()}>Cancel</button><button type="submit" disabled={working}>Apply background</button></div>
    </form>
  </dialog>
{/if}

<style>
  dialog { width: min(420px, calc(100vw - 32px)); padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 12px; color: var(--canvas-readable-text, var(--text-normal)); background: var(--canvas-readable-surface, var(--background-primary)); }
  dialog::backdrop { background: rgb(0 0 0 / 35%); }
  form { display: grid; gap: 14px; }
  h2 { margin: 0; font-size: 18px; }
  label { display: grid; gap: 5px; font-size: 13px; }
  input, select { min-height: 36px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; padding: 6px 8px; color: inherit; background: inherit; font: inherit; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  .actions button { min-height: 36px; padding: 6px 12px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; color: inherit; background: inherit; cursor: pointer; }
  [role="alert"] { margin: 0; font-size: 13px; }
</style>
