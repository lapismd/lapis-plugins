<script lang="ts">
  import { getContext, tick } from "svelte";
  import { Panel, useStore, useSvelteFlow } from "@xyflow/svelte";
  import Expand from "@lucide/svelte/icons/expand";
  import Focus from "@lucide/svelte/icons/focus";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import type { FlowCanvasNode, FlowCanvasEdge } from "../lib/json-canvas";
  let { readOnly = false }: { readOnly?: boolean } = $props();
  const board = getContext<CanvasBoardController | undefined>("lapis-canvas-board");
  const store = useStore<FlowCanvasNode, FlowCanvasEdge>();
  const { fitView, fitBounds, getNodesBounds, getViewport, setViewport, setZoom, zoomIn, zoomOut } = useSvelteFlow<FlowCanvasNode, FlowCanvasEdge>();
  const groups = $derived(store.nodes.filter((node) => node.data.kind === "group"));
  const selected = $derived(store.selectedNodes.map((node) => node.id));
  let dialog = $state<HTMLDialogElement | null>(null);
  let helpButton = $state<HTMLButtonElement | null>(null);
  let message = $state<string | null>(null);
  let group = $state("");
  const title = `canvas-navigation-${crypto.randomUUID()}`;
  const root = () => store.domNode?.closest<HTMLElement>(".canvas-view-root");
  const duration = () => root()?.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
  function run(action: () => unknown): void {
    message = null;
    void Promise.resolve().then(action).catch((reason) => { message = reason instanceof Error ? reason.message : String(reason); });
  }
  function fitAll(): void { if (store.nodes.length) run(() => fitView({ padding: 0.2, duration: duration() })); }
  function fitSelected(): void { if (selected.length) run(() => fitBounds(getNodesBounds(selected), { padding: 0.25, duration: duration() })); }
  async function help(): Promise<void> {
    if (board?.inputBlocked) return;
    await tick(); if (!dialog?.open && !board?.inputBlocked) dialog?.showModal();
  }
  function jump(): void {
    const id = group;
    if (!groups.some((node) => node.id === id)) return;
    run(async () => { await fitBounds(getNodesBounds([id]), { padding: 0.2, duration: duration() }); group = ""; });
  }
  function keyboard(event: KeyboardEvent): void {
    const element = root();
    if (!element || event.defaultPrevented || !(event.target instanceof Element) || event.target.closest(".canvas-view-root") !== element || event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]') || dialog?.open || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    let action: (() => unknown) | null = null;
    if (event.altKey) {
      const movement: Record<string, [number, number]> = { arrowleft: [80, 0], arrowright: [-80, 0], arrowup: [0, 80], arrowdown: [0, -80] };
      const offset = movement[key];
      if (offset) action = () => { const camera = getViewport(); return setViewport({ ...camera, x: camera.x + offset[0], y: camera.y + offset[1] }, { duration: duration() }); };
    } else if (key === "f") action = event.shiftKey ? fitSelected : fitAll;
    else if (key === "0") action = () => setZoom(1, { duration: duration() });
    else if (key === "+" || key === "=") action = () => zoomIn({ duration: duration() });
    else if (key === "-") action = () => zoomOut({ duration: duration() });
    else if (key === "?") action = help;
    if (action) { event.preventDefault(); event.stopPropagation(); run(action); }
  }
  $effect(() => {
    const element = root(); if (!element) return;
    element.addEventListener("keydown", keyboard, true);
    return () => element.removeEventListener("keydown", keyboard, true);
  });
</script>

<Panel position="bottom-left" class="canvas-navigation-panel" style="max-width: calc(100% - 16px);">
  <div class="canvas-navigation nodrag nopan nowheel" role="toolbar" aria-label="Canvas navigation">
    <button type="button" disabled={!store.nodes.length} aria-label="Fit all cards" title="Fit all cards (F)" onclick={fitAll}><Expand aria-hidden="true" /></button>
    {#if !readOnly}<button type="button" disabled={!selected.length} aria-label="Fit selected cards" title="Fit selected cards (Shift+F)" onclick={fitSelected}><Focus aria-hidden="true" /></button>{/if}
    {#if groups.length}
      <select bind:value={group} aria-label="Jump to group" onchange={jump}>
        <option value="">Jump to group</option>
        {#each groups as node (node.id)}<option value={node.id}>{node.data.label || "Unnamed group"}</option>{/each}
      </select>
    {/if}
    <button bind:this={helpButton} type="button" aria-label="Canvas help" title="Canvas help (?)" aria-haspopup="dialog" onclick={() => void help()}><CircleHelp aria-hidden="true" /></button>
  </div>
  {#if message}<p class="canvas-navigation-error" role="alert">{message}</p>{/if}
</Panel>
<dialog bind:this={dialog} class="canvas-navigation-help nodrag nopan nowheel" inert={board?.inputBlocked ?? false} aria-labelledby={title} onclose={() => helpButton?.focus()}>
  <h2 id={title}>Canvas navigation</h2>
  <table>
    <caption>Keyboard shortcuts</caption>
    <tbody>
      <tr><th scope="row"><kbd>F</kbd></th><td>Fit all cards</td></tr>
      {#if !readOnly}<tr><th scope="row"><kbd>Shift+F</kbd></th><td>Fit selected cards</td></tr>{/if}
      <tr><th scope="row"><kbd>0</kbd></th><td>Reset zoom to 100%</td></tr>
      <tr><th scope="row"><kbd>+</kbd> / <kbd>−</kbd></th><td>Zoom in / out</td></tr>
      <tr><th scope="row"><kbd>Alt+Arrow keys</kbd></th><td>Pan the board</td></tr>
      <tr><th scope="row"><kbd>Space+drag</kbd></th><td>Pan the board</td></tr>
      {#if !readOnly}<tr><th scope="row"><kbd>Arrow keys</kbd></th><td>Move a focused selected card</td></tr>{/if}
      <tr><th scope="row"><kbd>?</kbd></th><td>Open this help</td></tr>
    </tbody>
  </table>
  <p>Wheel to pan. Pinch to zoom. Use Jump to group to focus a named group.</p>
  <button type="button" onclick={() => dialog?.close()}>Close help</button>
</dialog>

<style>
  .canvas-navigation { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; max-width: 100%; padding: 4px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 8px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); box-shadow: 0 4px 12px var(--background-modifier-box-shadow); }
  .canvas-navigation button { display: grid; place-items: center; width: 36px; height: 36px; padding: 7px; flex: none; }
  button, select { border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; background: inherit; color: inherit; font: inherit; cursor: pointer; }
  select { min-width: 0; max-width: 180px; min-height: 36px; font-size: 12px; }
  button:disabled { opacity: 0.5; cursor: default; }
  :is(button, select):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
  .canvas-navigation-help { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); padding: 20px; overflow: auto; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 12px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); }
  .canvas-navigation-help::backdrop { background: rgb(0 0 0 / 35%); }
  h2 { margin: 0 0 16px; font-size: 18px; }
  table { width: 100%; font-size: 13px; text-align: left; border-collapse: collapse; }
  caption { text-align: left; font-weight: 600; margin-bottom: 8px; }
  th, td { padding: 6px; border-bottom: 1px solid var(--background-modifier-border); }
  kbd { font-size: 12px; white-space: nowrap; }
  p { font-size: 12px; }
  .canvas-navigation-help > button { min-height: 36px; padding: 6px 12px; }
  .canvas-navigation-error { max-width: 280px; padding: 6px; background: var(--canvas-readable-surface, var(--background-primary)); }
  @media (max-width: 600px) { .canvas-navigation { gap: 2px; padding: 2px; } select { max-width: 125px; } }
</style>
