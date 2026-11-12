<script lang="ts">
  import { Panel, useStore, useSvelteFlow } from "@xyflow/svelte";
  import { getContext } from "svelte";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { displayNodeValue, type FlowCanvasNode, type FlowCanvasEdge } from "../lib/json-canvas";
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const store = useStore<FlowCanvasNode, FlowCanvasEdge>();
  const { updateNode } = useSvelteFlow<FlowCanvasNode, FlowCanvasEdge>();
  let menu = $state<HTMLDetailsElement | null>(null);
  $effect(() => {
    if (!menu) return;
    const element = menu;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !element.open) return;
      event.preventDefault(); event.stopPropagation(); element.open = false; element.querySelector("summary")?.focus();
    };
    element.addEventListener("keydown", keydown);
    return () => element.removeEventListener("keydown", keydown);
  });
</script>

<Panel position="bottom-center">
  <details bind:this={menu} class="canvas-touch-selection nodrag nopan nowheel">
    <summary>Select cards</summary>
    <fieldset disabled={board.inputBlocked}>
      <legend>Card selection</legend>
      {#each store.nodes as node (node.id)}
        <label><input type="checkbox" checked={node.selected ?? false} onchange={(event) => { if (!board.inputBlocked) updateNode(node.id, { selected: event.currentTarget.checked }); }} />{displayNodeValue(node.data).slice(0, 60) || "Empty card"} ({node.id})</label>
      {/each}
      {#if !store.nodes.length}<p>No cards to select.</p>{/if}
    </fieldset>
  </details>
</Panel>

<style>
  details { position: relative; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 8px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); font-size: 12px; }
  summary { display: grid; place-items: center; min-width: 100px; min-height: 44px; padding: 4px 10px; cursor: pointer; }
  fieldset { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: min(280px, 80vw); max-height: 240px; overflow: auto; padding: 10px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 8px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); }
  label { display: flex; align-items: center; gap: 8px; min-height: 44px; overflow-wrap: anywhere; }
  input { width: 20px; height: 20px; flex: none; }
  :is(summary, input):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
</style>
