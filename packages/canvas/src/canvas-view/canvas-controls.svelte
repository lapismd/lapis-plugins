<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { Panel, useSvelteFlow, useStore } from "@xyflow/svelte";
  import { getContext } from "svelte";
  import Lock from "@lucide/svelte/icons/lock";
  import Unlock from "@lucide/svelte/icons/lock-open";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import Expand from "@lucide/svelte/icons/expand";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Undo from "@lucide/svelte/icons/undo";
  import Redo from "@lucide/svelte/icons/redo";
  import CanvasExport from "./canvas-export.svelte";
  import CanvasActions from "./canvas-actions.svelte";
  import CanvasNavigation from "./canvas-navigation.svelte";
  import CanvasSettingsMenu from "./canvas-settings.svelte";
  import ToolButton from "./canvas-tool-button.svelte";
  import type { CanvasSettings } from "../canvas-plugin";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";

  let {
    readOnly = false,
    app,
    surface = null,
    inputBlocked = false,
    contextPoint = $bindable(null),
    snapToGrid = false,
    snapToObjects = true,
    onUpdateSettings = async () => {},
  }: Partial<CanvasSettings> & {
    readOnly?: boolean;
    app?: App;
    surface?: HTMLElement | null;
    inputBlocked?: boolean;
    contextPoint?: { x: number; y: number } | null;
    onUpdateSettings?: (next: Partial<CanvasSettings>) => Promise<void>;
  } = $props();
  const board = getContext<CanvasBoardController | undefined>(
    "lapis-canvas-board",
  );
  const store = useStore();
  const interactive = $derived(
    store.nodesDraggable || store.nodesConnectable || store.elementsSelectable,
  );
  function toggleInteractive(): void {
    const next = !interactive;
    store.nodesDraggable = next;
    store.nodesConnectable = next;
    store.elementsSelectable = next;
  }
  const { setZoom, zoomIn, zoomOut, fitView } = useSvelteFlow();
  const duration = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;
  let error = $state("");
  function run(action: () => Promise<unknown>): void {
    void action().catch((reason) => {
      error = reason instanceof Error ? reason.message : String(reason);
    });
  }
</script>

<Panel
  position="top-right"
  class="canvas-control-rail"
  style="max-width:calc(100% - 16px);max-height:calc(100% - 16px)"
>
  {#if !readOnly && app}
    <div class="canvas-rail-group">
      <CanvasSettingsMenu
        {surface}
        {snapToGrid}
        {snapToObjects}
        {inputBlocked}
        onUpdate={onUpdateSettings}
      />
    </div>
    <CanvasActions {app} {surface} {inputBlocked} bind:contextPoint />
  {/if}
  <div
    class="canvas-rail-group canvas-camera-controls"
    role="toolbar"
    aria-label="Canvas zoom"
  >
    <ToolButton
      label="Zoom In"
      disabled={store.viewport.zoom >= store.maxZoom}
      onclick={() => run(() => zoomIn({ duration: duration() }))}
      ><Plus aria-hidden="true" /></ToolButton
    >
    <ToolButton
      label="Reset zoom"
      onclick={() => run(() => setZoom(1, { duration: duration() }))}
      ><RotateCcw aria-hidden="true" /></ToolButton
    >
    <ToolButton
      label="Fit all cards"
      tooltip="Zoom to fit (F)"
      disabled={!store.nodes.length}
      onclick={() => run(() => fitView({ padding: 0.2, duration: duration() }))}
      ><Expand aria-hidden="true" /></ToolButton
    >
    <ToolButton
      label="Zoom Out"
      disabled={store.viewport.zoom <= store.minZoom}
      onclick={() => run(() => zoomOut({ duration: duration() }))}
      ><Minus aria-hidden="true" /></ToolButton
    >
    {#if !readOnly}<ToolButton
        label="Toggle Interactivity"
        tooltip={interactive
          ? "Lock canvas interaction"
          : "Unlock canvas interaction"}
        aria-pressed={!interactive}
        onclick={toggleInteractive}
      >
        {#if interactive}<Unlock aria-hidden="true" />{:else}<Lock
            aria-hidden="true"
          />{/if}
      </ToolButton>{/if}
  </div>
  {#if !readOnly && board}
    <div class="canvas-rail-group" role="toolbar" aria-label="Canvas history">
      <ToolButton
        label="Undo"
        tooltip="Undo (Ctrl/Cmd+Z)"
        disabled={!board.canUndo || inputBlocked}
        onclick={() => run(() => board.undo())}
        ><Undo aria-hidden="true" /></ToolButton
      >
      <ToolButton
        label="Redo"
        tooltip="Redo (Ctrl/Cmd+Shift+Z)"
        disabled={!board.canRedo || inputBlocked}
        onclick={() => run(() => board.redo())}
        ><Redo aria-hidden="true" /></ToolButton
      >
    </div>
  {/if}
  {#if !readOnly}<div class="canvas-rail-group"><CanvasExport /></div>{/if}
  <CanvasNavigation {readOnly} />
  {#if error}<p class="canvas-controls-error" role="alert">{error}</p>{/if}
</Panel>

<style>
  :global(.canvas-control-rail) {
    /* An embedded board can have a different palette from its host shell. */
    --foreground: var(--canvas-readable-text);
    --accent: var(--canvas-readable-surface);
    --muted: var(--canvas-readable-surface);
    --ui-button-focus-ring-color: var(--canvas-readable-indicator);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
  .canvas-rail-group {
    display: flex;
    flex-direction: column;
    padding: 4px;
    border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border));
    border-radius: 8px;
    background: var(--canvas-readable-surface, var(--background-primary));
    color: var(--canvas-readable-text, var(--text-normal));
    box-shadow: 0 2px 8px #0002;
  }
  .canvas-controls-error {
    max-width: 240px;
    background: var(--canvas-readable-surface, var(--background-primary));
    color: var(--canvas-readable-text, var(--text-normal));
  }
  @media (pointer: coarse) {
    :global(.canvas-control-rail [data-ui-component="button"]) {
      min-width: 44px;
      min-height: 44px;
    }
  }
</style>
