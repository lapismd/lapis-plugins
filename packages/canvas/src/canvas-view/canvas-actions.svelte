<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { Panel, useStore, useSvelteFlow } from "@xyflow/svelte";
  import { getContext, tick } from "svelte";
  import Type from "@lucide/svelte/icons/type";
  import FilePlus from "@lucide/svelte/icons/file-plus";
  import Image from "@lucide/svelte/icons/image";
  import Link from "@lucide/svelte/icons/link";
  import SquareDashed from "@lucide/svelte/icons/square-dashed";
  import Undo from "@lucide/svelte/icons/undo";
  import Redo from "@lucide/svelte/icons/redo";
  import Copy from "@lucide/svelte/icons/copy";
  import Scissors from "@lucide/svelte/icons/scissors";
  import Clipboard from "@lucide/svelte/icons/clipboard";
  import CopyPlus from "@lucide/svelte/icons/copy-plus";
  import { readCanvasClipboard, writeCanvasClipboard } from "../lib/canvas-clipboard";
  import { createCanvasLongPress } from "../lib/canvas-long-press";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { canvasDropTargets, createCanvasCard, pasteCanvas, selectedCanvas } from "../lib/canvas-authoring";
  import type { FlowCanvasNode, FlowCanvasEdge, NodeType } from "../lib/json-canvas";

  let { app, surface, inputBlocked = false, contextPoint = $bindable(null) }: { app: App; surface: HTMLElement | null; inputBlocked?: boolean; contextPoint?: { x: number; y: number } | null } = $props();
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const store = useStore<FlowCanvasNode, FlowCanvasEdge>();
  const { screenToFlowPosition, deleteElements } = useSvelteFlow<FlowCanvasNode, FlowCanvasEdge>();
  let toolbar: HTMLDivElement;
  let contextMenu = $state<HTMLDivElement>();
  let dialog: HTMLDialogElement;
  let kind = $state<"file" | "media" | "link">("file");
  let files = $state<TFile[]>([]);
  let value = $state("");
  let message = $state("");
  let formError = $state<string | null>(null);
  let clipboard = "";
  let pendingPoint: { x: number; y: number } | null = null;
  const dialogId = `canvas-create-${crypto.randomUUID()}`;
  const media = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|apng|mp3|wav|ogg|m4a|mp4|webm|mov|pdf)$/i;
  const selected = $derived(new Set(store.selectedNodes.map(({ id }) => id)));

  function root(): HTMLElement | null { return surface; }
  function owns(target: EventTarget | null): boolean { return target instanceof Node && Boolean(root()?.contains(target)); }
  function editing(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }
  function run(action: () => void | Promise<void>): void {
    void Promise.resolve().then(action).catch((error: unknown) => {
      message = error instanceof Error ? error.message : String(error);
      if (dialog?.open) formError = message;
    });
  }
  function point(): { x: number; y: number } {
    const rect = root()!.getBoundingClientRect();
    return screenToFlowPosition(contextPoint ?? { x: rect.left + rect.width / 2 - 130, y: rect.top + rect.height / 2 - 80 });
  }
  async function add(type: NodeType, content = "", position = point()): Promise<void> {
    await board.flush();
    const current = board.read();
    const card = createCanvasCard(type, position, content);
    board.apply({ ...current, nodes: type === "group" ? [card, ...(current.nodes ?? [])] : [...(current.nodes ?? []), card] }, new Set([card.id]));
    contextPoint = null;
    message = `${type === "group" ? "Group" : "Card"} added`;
  }
  async function open(next: typeof kind): Promise<void> {
    pendingPoint = point();
    contextPoint = null;
    kind = next;
    value = "";
    formError = null;
    files = app.vault.getFiles().filter((file) => next !== "media" || media.test(file.path));
    await tick();
    dialog.showModal();
  }
  function close(): void { dialog.close(); toolbar.querySelector<HTMLButtonElement>("button")?.focus(); }
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (kind === "link") {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Use an HTTP or HTTPS web address");
      await add("link", url.href, pendingPoint!);
    } else {
      if (!app.vault.getFileByPath(value)) throw new Error("Choose an existing vault file");
      await add("file", value, pendingPoint!);
    }
    close();
  }
  function copyValue(ids = selected): string { return JSON.stringify(selectedCanvas(board.read(), ids)); }
  async function copySelection(ids = new Set(selected)): Promise<void> {
    await board.flush();
    clipboard = copyValue(ids);
    writeCanvasClipboard(app, clipboard);
    try { await navigator.clipboard.writeText(clipboard); message = "Selection copied"; }
    catch { message = "Selection copied within this vault"; }
  }
  async function cutSelection(): Promise<void> {
    const ids = new Set((selectedCanvas(board.read(), selected).nodes ?? []).map(({ id }) => id));
    await copySelection(ids);
    await deleteElements({ nodes: [...ids].map((id) => ({ id })) });
  }
  async function paste(raw: string): Promise<void> {
    if (!raw.trim().startsWith("{")) {
      const path = raw.trim();
      const file = app.vault.getFileByPath(path);
      if (file) { await add("file", file.path); return; }
      try {
        const url = new URL(path);
        if (['http:', 'https:'].includes(url.protocol)) { await add("link", url.href); return; }
      } catch { /* Plain Markdown becomes a text card. */ }
      await add("text", raw);
      return;
    }
    await board.flush();
    const result = pasteCanvas(board.read(), raw);
    if (!result.ids.size) throw new Error("The clipboard has no Canvas cards");
    board.apply(result.document, result.ids);
    message = `${result.ids.size} cards pasted`;
  }
  async function pasteSelection(): Promise<void> {
    let raw = readCanvasClipboard(app);
    try { raw = await navigator.clipboard.readText() || raw; } catch { /* The in-canvas clipboard remains available. */ }
    if (!raw) throw new Error("Copy Canvas cards before pasting");
    await paste(raw);
  }
  async function duplicate(): Promise<void> { await board.flush(); await paste(copyValue()); }
  function keyboard(event: KeyboardEvent): void {
    if (event.defaultPrevented || dialog?.open || !owns(event.target) || editing(event.target) || !(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === "z" || key === "y") {
      event.preventDefault();
      event.stopPropagation();
      run(key === "y" || event.shiftKey ? () => board.redo() : () => board.undo());
    } else if (key === "d" && selected.size) {
      event.preventDefault(); event.stopPropagation(); run(duplicate);
    }
  }
  function copyEvent(event: ClipboardEvent, cut = false): void {
    if (dialog?.open || !owns(event.target) || editing(event.target) || !selected.size || !event.clipboardData) return;
    clipboard = copyValue();
    writeCanvasClipboard(app, clipboard);
    event.clipboardData.setData("text/plain", clipboard);
    event.preventDefault();
    event.stopPropagation();
    const ids = new Set((JSON.parse(clipboard).nodes as { id: string }[]).map(({ id }) => id));
    if (cut) run(async () => { await board.flush(); await deleteElements({ nodes: [...ids].map((id) => ({ id })) }); });
    message = "Selection copied";
  }
  function pasteEvent(event: ClipboardEvent): void {
    if (dialog?.open || !owns(event.target) || editing(event.target)) return;
    const raw = event.clipboardData?.getData("text/plain");
    if (!raw) return;
    event.preventDefault(); event.stopPropagation(); run(() => paste(raw));
  }
  function drop(event: DragEvent): void {
    if (dialog?.open || !owns(event.target) || !event.dataTransfer || editing(event.target)) return;
    const uriList = event.dataTransfer.getData("text/uri-list");
    const raw = uriList || event.dataTransfer.getData("text/plain");
    const targets = canvasDropTargets(raw, (path) => Boolean(app.vault.getFileByPath(path)), Boolean(uriList));
    if (!targets.length) { message = "Drop an existing vault path or an HTTP(S) web address"; return; }
    event.preventDefault();
    event.stopPropagation();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    run(async () => {
      await board.flush();
      const current = board.read();
      const cards = targets.map((target, index) => createCanvasCard(target.type, { x: position.x + index * 40, y: position.y + index * 40 }, target.type === "file" ? app.vault.getFileByPath(target.value)!.path : target.value));
      board.apply({ ...current, nodes: [...(current.nodes ?? []), ...cards] }, new Set(cards.map(({ id }) => id)));
      message = `${cards.length} cards added`;
    });
  }
  $effect(() => {
    if (!surface) return;
    const target = surface;
    const hold = createCanvasLongPress((point) => { contextPoint = point; }, () => !inputBlocked && !dialog?.open);
    const start = (event: PointerEvent) => hold.start(event, event.target instanceof Element && event.target.classList.contains("svelte-flow__pane"));
    const move = (event: PointerEvent) => hold.move(event);
    const end = (event: PointerEvent) => hold.end(event);
    target.addEventListener("pointerdown", start, true);
    target.addEventListener("pointermove", move, true);
    target.ownerDocument.addEventListener("pointerup", end, true);
    target.ownerDocument.addEventListener("pointercancel", end, true);
    const copy = (event: ClipboardEvent) => copyEvent(event);
    const cut = (event: ClipboardEvent) => copyEvent(event, true);
    const dragover = (event: DragEvent) => { if (!dialog?.open && !editing(event.target)) event.preventDefault(); };
    target.addEventListener("keydown", keyboard);
    target.addEventListener("copy", copy);
    target.addEventListener("cut", cut);
    target.addEventListener("paste", pasteEvent);
    target.addEventListener("dragover", dragover, true);
    target.addEventListener("drop", drop, true);
    return () => {
      hold.dispose();
      target.removeEventListener("pointerdown", start, true);
      target.removeEventListener("pointermove", move, true);
      target.ownerDocument.removeEventListener("pointerup", end, true);
      target.ownerDocument.removeEventListener("pointercancel", end, true);
      target.removeEventListener("keydown", keyboard);
      target.removeEventListener("copy", copy);
      target.removeEventListener("cut", cut);
      target.removeEventListener("paste", pasteEvent);
      target.removeEventListener("dragover", dragover, true);
      target.removeEventListener("drop", drop, true);
    };
  });
  $effect(() => {
    if (!contextPoint) return;
    void tick().then(() => contextMenu?.querySelector<HTMLButtonElement>("button")?.focus());
  });
</script>

<svelte:window onpointerdown={(event) => { if (contextPoint && !contextMenu?.contains(event.target as Node)) contextPoint = null; }} />

<Panel position="top-left" class="canvas-authoring-panel">
  <div class="canvas-authoring nodrag nopan nowheel" role="toolbar" aria-label="Canvas authoring" bind:this={toolbar}>
    <button type="button" aria-label="Add text card" title="Add text card" onclick={() => run(() => add("text"))}><Type /></button>
    <button type="button" aria-label="Add vault file" title="Add vault file" onclick={() => run(() => open("file"))}><FilePlus /></button>
    <button type="button" aria-label="Add media" title="Add media" onclick={() => run(() => open("media"))}><Image /></button>
    <button type="button" aria-label="Add web page" title="Add web page" onclick={() => run(() => open("link"))}><Link /></button>
    <button type="button" aria-label="Add group" title="Add group" onclick={() => run(() => add("group"))}><SquareDashed /></button>
    <button type="button" aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" disabled={!board.canUndo} onclick={() => run(() => board.undo())}><Undo /></button>
    <button type="button" aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!board.canRedo} onclick={() => run(() => board.redo())}><Redo /></button>
    <button type="button" aria-label="Duplicate selection" title="Duplicate selection (Ctrl/Cmd+D)" disabled={!selected.size} onclick={() => run(duplicate)}><CopyPlus /></button>
    <button type="button" aria-label="Copy selection" title="Copy selection" disabled={!selected.size} onclick={() => run(copySelection)}><Copy /></button>
    <button type="button" aria-label="Cut selection" title="Cut selection" disabled={!selected.size} onclick={() => run(cutSelection)}><Scissors /></button>
    <button type="button" aria-label="Paste cards" title="Paste cards" onclick={() => run(pasteSelection)}><Clipboard /></button>
  </div>
  <div class="canvas-authoring-status" role="status" aria-live="polite">{message}</div>
</Panel>

{#if contextPoint}
  <div class="canvas-create-menu nodrag nopan" role="dialog" aria-label="Create canvas card" bind:this={contextMenu}
    style:left={`${Math.min(contextPoint.x, window.innerWidth - 180)}px`} style:top={`${Math.min(contextPoint.y, window.innerHeight - 220)}px`}
    onkeydown={(event) => { if (event.key === "Escape") { contextPoint = null; toolbar.querySelector<HTMLButtonElement>("button")?.focus(); } }} tabindex="-1">
    <button type="button" onclick={() => run(() => add("text"))}>Add text card</button>
    <button type="button" onclick={() => run(() => open("file"))}>Add vault file</button>
    <button type="button" onclick={() => run(() => open("media"))}>Add media</button>
    <button type="button" onclick={() => run(() => open("link"))}>Add web page</button>
    <button type="button" onclick={() => run(() => add("group"))}>Add group</button>
  </div>
{/if}

<dialog bind:this={dialog} inert={inputBlocked} aria-labelledby={dialogId} class="canvas-create-dialog">
  <form onsubmit={(event) => { event.preventDefault(); run(() => submit(event)); }}>
    <h2 id={dialogId}>{kind === "link" ? "Add web page" : kind === "media" ? "Add media" : "Add vault file"}</h2>
    {#if kind === "link"}
      <label for={`${dialogId}-value`}>Web address</label>
      <input id={`${dialogId}-value`} type="url" required bind:value placeholder="https://example.com" />
    {:else}
      <label for={`${dialogId}-value`}>Vault file</label>
      <select id={`${dialogId}-value`} required bind:value>
        <option value="">Choose a file</option>
        {#each files as file (file.path)}<option value={file.path}>{file.path}</option>{/each}
      </select>
      {#if !files.length}<p>No matching files are available in this vault.</p>{/if}
    {/if}
    {#if formError}<p role="alert">{formError}</p>{/if}
    <div><button type="button" onclick={close}>Cancel</button><button type="submit" disabled={!value}>Add card</button></div>
  </form>
</dialog>

<style>
  .canvas-authoring { display: flex; flex-wrap: wrap; gap: 2px; max-width: min(380px, calc(100vw - 110px)); padding: 4px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary); color: var(--text-normal); box-shadow: 0 2px 8px #0002; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 30px; border: 1px solid transparent; border-radius: 5px; padding: 5px 7px; background: transparent; color: inherit; cursor: pointer; }
  button :global(svg) { width: 16px; height: 16px; }
  button:hover:not(:disabled) { background: var(--background-modifier-hover); }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
  button:disabled { opacity: 0.45; cursor: default; }
  .canvas-authoring-status { max-width: 380px; margin-top: 4px; border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 12px; }
  .canvas-authoring-status:not(:empty) { padding: 4px 6px; }
  .canvas-create-menu { position: fixed; z-index: 1001; display: flex; flex-direction: column; min-width: 170px; padding: 6px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary); color: var(--text-normal); box-shadow: 0 4px 16px #0003; }
  .canvas-create-menu button { justify-content: flex-start; }
  .canvas-create-dialog { max-width: min(420px, calc(100vw - 32px)); width: 100%; border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 20px; background: var(--background-primary); color: var(--text-normal); }
  .canvas-create-dialog::backdrop { background: #0006; }
  form { display: flex; flex-direction: column; gap: 12px; }
  h2 { font-size: 1.1rem; margin: 0; }
  input, select { width: 100%; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 5px; background: var(--background-primary); color: var(--text-normal); }
  form > div { display: flex; justify-content: flex-end; gap: 8px; }
</style>
