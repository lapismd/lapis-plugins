<script lang="ts">
  import { getContext, tick } from "svelte";
  import { useSvelteFlow } from "@xyflow/svelte";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { reconnectCanvasEdge } from "../lib/canvas-connections";
  import type { EdgeSide } from "../lib/json-canvas";
  let { id }: { id: string } = $props();
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const { fitBounds, getNodesBounds, updateNode, getNodes } = useSvelteFlow();
  const edge = $derived(board.read().edges?.find((edge) => edge.id === id));
  const cards = $derived(board.read().nodes ?? []);
  let menu = $state<HTMLDetailsElement | null>(null);
  let fromNode = $state("");
  let toNode = $state("");
  let fromSide = $state<EdgeSide>("right");
  let toSide = $state<EdgeSide>("left");
  let error = $state<string | null>(null);
  let working = $state(false);
  const sides: EdgeSide[] = ["top", "right", "bottom", "left"];
  $effect(() => {
    fromNode = edge?.fromNode ?? ""; toNode = edge?.toNode ?? "";
    fromSide = edge?.fromSide ?? "right"; toSide = edge?.toSide ?? "left";
  });
  $effect(() => {
    if (!menu) return;
    const element = menu;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !element.open) return;
      event.preventDefault(); event.stopPropagation(); element.open = false; element.querySelector("summary")?.focus();
    };
    const pointerup = (event: PointerEvent) => event.stopPropagation();
    element.addEventListener("keydown", keydown); element.addEventListener("pointerup", pointerup);
    return () => { element.removeEventListener("keydown", keydown); element.removeEventListener("pointerup", pointerup); };
  });
  async function apply(): Promise<void> {
    if (working || board.inputBlocked) return;
    const draft = { fromNode, toNode, fromSide, toSide };
    working = true; error = null;
    try {
      await board.flush();
      let current = reconnectCanvasEdge(board.read(), id, "from", draft.fromNode, draft.fromSide);
      current = reconnectCanvasEdge(current, id, "to", draft.toNode, draft.toSide);
      board.beginGesture(); board.apply(current, new Set(), new Set([id]));
      await tick(); if (menu) { menu.open = false; menu.querySelector("summary")?.focus(); }
    } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
    finally { working = false; }
  }
  async function follow(end: "from" | "to"): Promise<void> {
    const target = edge?.[`${end}Node`];
    if (!target || !getNodes().some((node) => node.id === target)) return;
    for (const node of getNodes()) updateNode(node.id, { selected: node.id === target });
    await fitBounds(getNodesBounds([target]), { padding: 0.3, duration: 180 });
  }
  function label(id: string): string {
    const card = cards.find((node) => node.id === id);
    return card?.type === "text" ? card.text.slice(0, 50) || "Empty text" : card?.type === "file" ? card.file : card?.type === "link" ? card.url : card?.label || "Group";
  }
</script>

<button type="button" class="canvas-node-toolbar-button" aria-label="Follow source card" title="Follow source card" onclick={() => void follow("from")}><ArrowLeft aria-hidden="true" /></button>
<button type="button" class="canvas-node-toolbar-button" aria-label="Follow target card" title="Follow target card" onclick={() => void follow("to")}><ArrowRight aria-hidden="true" /></button>
<details bind:this={menu} class="canvas-connection-menu nodrag nopan nowheel">
  <summary>Reconnect</summary>
  <form onsubmit={(event) => { event.preventDefault(); void apply(); }}>
    <fieldset disabled={working || board.inputBlocked}>
      <legend>Connector endpoints</legend>
      <label>Source card<select bind:value={fromNode}>{#each cards as card (card.id)}<option value={card.id}>{label(card.id)}</option>{/each}</select></label>
      <label>Source side<select bind:value={fromSide}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>
      <label>Target card<select bind:value={toNode}>{#each cards as card (card.id)}<option value={card.id}>{label(card.id)}</option>{/each}</select></label>
      <label>Target side<select bind:value={toSide}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>
      <button type="submit">Apply endpoints</button>
    </fieldset>
    {#if error}<p role="alert">{error}</p>{/if}
  </form>
</details>

<style>
  .canvas-connection-menu { position: relative; font-size: 12px; }
  summary { padding: 8px; cursor: pointer; border-radius: 5px; }
  form { position: absolute; top: 100%; left: 0; width: 250px; padding: 10px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 8px; color: var(--canvas-readable-text, var(--text-normal)); background: var(--canvas-readable-surface, var(--background-primary)); box-shadow: 0 8px 20px var(--background-modifier-box-shadow); }
  fieldset { margin: 0; padding: 0; border: 0; display: grid; gap: 8px; }
  label { display: grid; gap: 3px; }
  select, button { min-height: 36px; padding: 6px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; color: inherit; background: inherit; font: inherit; }
  p { margin: 8px 0 0; }
  :is(summary, select, button):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
</style>
