<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { getContext, tick } from "svelte";
  import { useStore, useSvelteFlow } from "@xyflow/svelte";
  import CanvasTouchSelection from "./canvas-touch-selection.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronsRight from "@lucide/svelte/icons/chevrons-right";
  import Compass from "@lucide/svelte/icons/compass";
  import CanvasGroupPicker from "./canvas-group-picker.svelte";
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
  let expanded = $state(false);
  const toolsId = `canvas-navigation-tools-${crypto.randomUUID()}`;
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
  async function jump(id: string): Promise<void> {
    if (!groups.some((node) => node.id === id)) return;
    try {
      await fitBounds(getNodesBounds([id]), {
        padding: 0.2,
        duration: duration(),
      });
    } catch (reason) {
      message = reason instanceof Error ? reason.message : String(reason);
    }
  }
  function keyboard(event: KeyboardEvent): void {
    const element = root();
    if (
      !element ||
      event.defaultPrevented ||
      !(event.target instanceof Element) ||
      event.target.closest(".canvas-view-root") !== element ||
      event.target.closest(
        'input, textarea, select, [role="combobox"], [role="option"], [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ) ||
      dialog?.open ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const key = event.key.toLowerCase();
    let action: (() => unknown) | null = null;
    if (event.altKey) {
      const movement: Record<string, [number, number]> = {
        arrowleft: [80, 0],
        arrowright: [-80, 0],
        arrowup: [0, 80],
        arrowdown: [0, -80],
      };
      const offset = movement[key];
      if (offset)
        action = () => {
          const camera = getViewport();
          return setViewport(
            { ...camera, x: camera.x + offset[0], y: camera.y + offset[1] },
            { duration: duration() },
          );
        };
    } else if (key === "f") action = event.shiftKey ? fitSelected : fitAll;
    else if (key === "0") action = () => setZoom(1, { duration: duration() });
    else if (key === "+" || key === "=")
      action = () => zoomIn({ duration: duration() });
    else if (key === "-") action = () => zoomOut({ duration: duration() });
    else if (key === "?") action = help;
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      run(action);
    }
  }
  $effect(() => {
    const element = root(); if (!element) return;
    element.addEventListener("keydown", keyboard, true);
    return () => element.removeEventListener("keydown", keyboard, true);
  });
</script>

<div class="canvas-navigation-panel" style="max-width:100%">
  <div
    class="canvas-navigation nodrag nopan nowheel"
    role="toolbar"
    aria-label="Canvas navigation"
  >
    <Tooltip.Root
      ><Tooltip.Trigger
        >{#snippet child({ props: tooltipProps })}<Button
            {...tooltipProps}
            variant="ghost"
            size="icon"
            aria-label={expanded
              ? "Collapse navigation tools"
              : "Expand navigation tools"}
            aria-expanded={expanded}
            aria-controls={toolsId}
            onclick={() => {
              expanded = !expanded;
            }}
          >
            {#if expanded}<ChevronsRight aria-hidden="true" />{:else}<Compass
                aria-hidden="true"
              />{/if}
          </Button>{/snippet}</Tooltip.Trigger
      ><Tooltip.Content sideOffset={6}
        >{expanded
          ? "Collapse navigation tools"
          : "Expand navigation tools"}</Tooltip.Content
      ></Tooltip.Root
    >
    <div id={toolsId} class="canvas-navigation-tools" hidden={!expanded}>
      {#if !readOnly}<Tooltip.Root
          ><Tooltip.Trigger
            >{#snippet child({ props: tooltipProps })}<Button
                {...tooltipProps}
                variant="ghost"
                size="icon"
                disabled={!selected.length}
                aria-label="Fit selected cards"
                onclick={fitSelected}><Focus aria-hidden="true" /></Button
              >{/snippet}</Tooltip.Trigger
          ><Tooltip.Content sideOffset={6}
            >Fit selected cards (Shift+F)</Tooltip.Content
          ></Tooltip.Root
        >{/if}
      {#if groups.length}
        <CanvasGroupPicker {groups} onSelect={jump} />
      {/if}
      {#if !readOnly}<CanvasTouchSelection />{/if}
      <Tooltip.Root
        ><Tooltip.Trigger
          >{#snippet child({ props: tooltipProps })}<Button
              {...tooltipProps}
              bind:ref={helpButton}
              variant="ghost"
              size="icon"
              aria-label="Canvas help"
              aria-haspopup="dialog"
              onclick={() => void help()}
              ><CircleHelp aria-hidden="true" /></Button
            >{/snippet}</Tooltip.Trigger
        ><Tooltip.Content sideOffset={6}>Canvas help (?)</Tooltip.Content
        ></Tooltip.Root
      >
    </div>
  </div>
  {#if message}<p class="canvas-navigation-error" role="alert">
      {message}
    </p>{/if}
</div>
<dialog
  bind:this={dialog}
  class="canvas-navigation-help nodrag nopan nowheel"
  inert={board?.inputBlocked ?? false}
  aria-labelledby={title}
  onclose={() => helpButton?.focus()}
>
  <h2 id={title}>Canvas navigation</h2>
  <table>
    <caption>Keyboard shortcuts</caption>
    <tbody>
      <tr><th scope="row"><kbd>F</kbd></th><td>Fit all cards</td></tr>
      {#if !readOnly}<tr
          ><th scope="row"><kbd>Shift+F</kbd></th><td>Fit selected cards</td
          ></tr
        >{/if}
      <tr><th scope="row"><kbd>0</kbd></th><td>Reset zoom to 100%</td></tr>
      <tr
        ><th scope="row"><kbd>+</kbd> / <kbd>−</kbd></th><td>Zoom in / out</td
        ></tr
      >
      <tr
        ><th scope="row"><kbd>Alt+Arrow keys</kbd></th><td>Pan the board</td
        ></tr
      >
      <tr><th scope="row"><kbd>Space+drag</kbd></th><td>Pan the board</td></tr>
      {#if !readOnly}<tr
          ><th scope="row"><kbd>Arrow keys</kbd></th><td
            >Move a focused selected card</td
          ></tr
        >{/if}
      <tr><th scope="row"><kbd>?</kbd></th><td>Open this help</td></tr>
    </tbody>
  </table>
  <p>Wheel to pan. Pinch to zoom. Use Jump to group to focus a named group.</p>
  <button type="button" onclick={() => dialog?.close()}>Close help</button>
</dialog>

<style>
  .canvas-navigation-panel {
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    background: var(--background-primary);
    color: var(--text-normal);
    box-shadow: 0 2px 8px #0002;
  }
  .canvas-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 4px;
  }
  .canvas-navigation-tools:not([hidden]) {
    display: contents;
  }
  .canvas-navigation :global([data-ui-component="button"]) {
    flex: none;
  }
  @media (pointer: coarse) {
    .canvas-navigation :global([data-ui-component="button"]) {
      min-width: 44px;
      min-height: 44px;
    }
  }
  button:focus-visible {
    outline: 2px solid
      var(--canvas-readable-indicator, var(--interactive-accent));
    outline-offset: 2px;
  }
  .canvas-navigation-help {
    width: min(440px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    padding: 20px;
    overflow: auto;
    border: 1px solid
      var(--canvas-readable-indicator, var(--background-modifier-border));
    border-radius: 12px;
    background: var(--canvas-readable-surface, var(--background-primary));
    color: var(--canvas-readable-text, var(--text-normal));
  }
  .canvas-navigation-help::backdrop {
    background: rgb(0 0 0 / 35%);
  }
  h2 {
    margin: 0 0 16px;
    font-size: 18px;
  }
  table {
    width: 100%;
    font-size: 13px;
    text-align: left;
    border-collapse: collapse;
  }
  caption {
    text-align: left;
    font-weight: 600;
    margin-bottom: 8px;
  }
  th,
  td {
    padding: 6px;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  kbd {
    font-size: 12px;
    white-space: nowrap;
  }
  p {
    font-size: 12px;
  }
  .canvas-navigation-help > button {
    min-height: 36px;
    padding: 6px 12px;
  }
  .canvas-navigation-error {
    max-width: 280px;
    padding: 6px;
    background: var(--canvas-readable-surface, var(--background-primary));
  }
  @media (max-width: 600px) {
    .canvas-navigation {
      gap: 2px;
      padding: 2px;
    }
  }
</style>
