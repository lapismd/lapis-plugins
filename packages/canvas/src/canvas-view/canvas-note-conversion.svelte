<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import FileOutput from "@lucide/svelte/icons/file-output";
  import { getContext, tick } from "svelte";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { canvasNoteFilename, convertCanvasTextToNote } from "../lib/canvas-note-conversion";
  let { app, nodeId }: { app: App; nodeId: string } = $props();
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const source = getContext<{ readonly current: string }>("lapis-canvas-source");
  const titleId = `canvas-convert-${crypto.randomUUID()}`;
  let dialog = $state<HTMLDialogElement | null>(null);
  let button = $state<HTMLButtonElement | null>(null);
  let opened = $state(false), working = $state(false), name = $state("Canvas note"), error = $state<string | null>(null);
  async function open() {
    if (board.inputBlocked) return;
    name = "Canvas note"; error = null; opened = true; await tick();
    if (board.inputBlocked) { opened = false; return; }
    dialog?.showModal();
  }
  async function convert() {
    if (working || board.inputBlocked) return;
    working = true; error = null;
    try {
      const card = button?.closest<HTMLElement>(".svelte-flow__node");
      const filename = canvasNoteFilename(name), owner = app, sourcePath = source.current, binding = board.capture();
      await convertCanvasTextToNote(binding, nodeId, async (text) => {
        binding.assertCurrent();
        const path = owner.fileManager.getAvailablePathForAttachment(filename, sourcePath);
        const file = await owner.vault.create(path, text);
        return file.path;
      });
      dialog?.close(); opened = false; await tick(); card?.focus();
    } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
    finally { working = false; }
  }
</script>

<button bind:this={button} type="button" class="canvas-node-toolbar-button" aria-label="Convert to note" title="Convert to note" aria-haspopup="dialog" disabled={working || board.inputBlocked} onclick={() => void open()}><FileOutput aria-hidden="true" /></button>
{#if opened}
  <dialog class="nodrag nopan" bind:this={dialog} inert={board.inputBlocked} aria-labelledby={titleId} onpointerup={(event) => event.stopPropagation()} oncancel={(event) => { if (working) event.preventDefault(); }} onclose={() => { opened = false; }}>
    <form onsubmit={(event) => { event.preventDefault(); void convert(); }}>
      <h2 id={titleId}>Convert text card to note</h2>
      <label>Note name<input bind:value={name} required disabled={working} aria-invalid={error ? "true" : undefined} /></label>
      <p>Creates a Markdown note and replaces this card with a file card. Undo restores the text card and keeps the note.</p>
      {#if error}<p role="alert">{error}</p>{/if}
      <div class="actions"><button type="button" disabled={working} onclick={() => dialog?.close()}>Cancel</button><button type="submit" disabled={working}>Create note</button></div>
    </form>
  </dialog>
{/if}

<style>
  dialog { width: min(420px, calc(100vw - 32px)); padding: 20px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 12px; color: var(--canvas-readable-text, var(--text-normal)); background: var(--canvas-readable-surface, var(--background-primary)); }
  dialog::backdrop { background: rgb(0 0 0 / 35%); }
  form { display: grid; gap: 14px; }
  h2, p { margin: 0; } h2 { font-size: 18px; } p { font-size: 13px; line-height: 1.4; }
  label { display: grid; gap: 5px; font-size: 13px; }
  input, .actions button { min-height: 36px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; padding: 6px 8px; color: inherit; background: inherit; font: inherit; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  :is(input, button):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
</style>
