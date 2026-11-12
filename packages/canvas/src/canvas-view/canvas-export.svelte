<script lang="ts">
  import { ControlButton, useStore, useSvelteFlow } from "@xyflow/svelte";
  import Download from "@lucide/svelte/icons/download";
  import { getContext, tick } from "svelte";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import type { FlowCanvasNode, FlowCanvasEdge } from "../lib/json-canvas";
  import { canvasExportPlan, canvasPaintedBounds } from "../lib/canvas-export-plan";
  import { canvasPng } from "../lib/canvas-export-snapshot";
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const store = useStore<FlowCanvasNode, FlowCanvasEdge>();
  const { getNodesBounds, getViewport } = useSvelteFlow<FlowCanvasNode, FlowCanvasEdge>();
  const source = getContext<{ readonly current: string }>("lapis-canvas-source");
  let dialog = $state<HTMLDialogElement | null>(null);
  let scope = $state<"board" | "viewport">("board"), ratio = $state(1), transparent = $state(false);
  let text = $state(true), files = $state(false), addresses = $state(false), images = $state(false);
  let working = $state(false), error = $state<string | null>(null);
  const titleId = `canvas-export-title-${crypto.randomUUID()}`;
  const available = typeof document !== "undefined" && typeof HTMLCanvasElement !== "undefined" && typeof HTMLCanvasElement.prototype.toBlob === "function" && typeof URL.createObjectURL === "function" && "download" in document.createElement("a");
  const reason = $derived(!available ? "PNG export is unavailable in this browser." : !store.nodes.length ? "Add a card before exporting." : "Export PNG");
  async function open() {
    if (!available || !store.nodes.length || board.inputBlocked) return;
    error = null; await tick(); dialog?.showModal();
  }
  async function save() {
    if (working || board.inputBlocked) return;
    working = true; error = null;
    try {
      const binding = board.capture(), filename = (source.current.split('/').pop() ?? 'Canvas').replace(/\.canvas$/i, '') + '.png';
      await binding.flush();
      const root = store.domNode, viewport = root?.querySelector<HTMLElement>('.svelte-flow__viewport');
      if (!root || !viewport || !store.nodes.length) throw new Error('Add a card before exporting.');
      const camera = getViewport(), bounds = canvasPaintedBounds(viewport, getNodesBounds(store.nodes), camera.zoom);
      const plan = canvasExportPlan({ scope, bounds, viewport: camera, size: { width: root.clientWidth, height: root.clientHeight }, ratio });
      const background = transparent ? undefined : getComputedStyle(root.closest('.canvas-view-root') ?? root).getPropertyValue('--background-primary').trim() || '#ffffff';
      const blob = await canvasPng(viewport, plan, { text, files, addresses, images }, background);
      binding.assertCurrent();
      const url = URL.createObjectURL(blob), link = root.ownerDocument.createElement('a');
      try { link.href = url; link.download = filename; link.click(); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
      dialog?.close();
    } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
    finally { working = false; }
  }
</script>

<ControlButton disabled={!available || !store.nodes.length || board.inputBlocked} title={reason} aria-label="Export PNG" onclick={() => void open()}><Download /></ControlButton>
<dialog class="canvas-export-dialog nodrag nopan nowheel" bind:this={dialog} inert={board.inputBlocked} aria-labelledby={titleId} onpointerup={(event) => event.stopPropagation()} oncancel={(event) => { if (working) event.preventDefault(); }} onclose={() => store.domNode?.querySelector<HTMLButtonElement>('button[aria-label="Export PNG"]')?.focus()}>
  <form onsubmit={(event) => { event.preventDefault(); void save(); }}>
    <h2 id={titleId}>Export Canvas as PNG</h2>
    <fieldset disabled={working}>
      <legend>Image options</legend>
      <label>Area<select bind:value={scope}><option value="board">Entire board</option><option value="viewport">Current viewport</option></select></label>
      <label>Quality<select bind:value={ratio}><option value={1}>Standard (1×)</option><option value={2}>High (2×)</option><option value={4}>Maximum (4×)</option></select></label>
      <label><input type="checkbox" bind:checked={transparent} />Transparent background</label>
      <label><input type="checkbox" bind:checked={text} />Include text cards</label>
      <label><input type="checkbox" bind:checked={files} />Include file contents and paths</label>
      <label><input type="checkbox" bind:checked={addresses} />Include web addresses</label>
      <label><input type="checkbox" bind:checked={images} />Include decoded local images</label>
    </fieldset>
    <p>Web previews, remote images and editing controls are omitted. Export keeps the current board and camera unchanged.</p>
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="actions"><button type="button" disabled={working} onclick={() => dialog?.close()}>Cancel</button><button type="submit" disabled={working}>{working ? 'Creating PNG…' : 'Save PNG'}</button></div>
  </form>
</dialog>

<style>
  dialog { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 20px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 12px; color: var(--canvas-readable-text, var(--text-normal)); background: var(--canvas-readable-surface, var(--background-primary)); }
  dialog::backdrop { background: rgb(0 0 0 / 35%); }
  form, fieldset { display: grid; gap: 12px; } fieldset { padding: 0; border: 0; min-width: 0; }
  h2, p { margin: 0; } h2 { font-size: 18px; } p { font-size: 13px; line-height: 1.4; }
  label { display: flex; align-items: center; gap: 8px; font-size: 13px; min-height: 30px; }
  select, .actions button { min-height: 36px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; padding: 6px 8px; color: inherit; background: inherit; font: inherit; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  :is(input, select, button):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
</style>
