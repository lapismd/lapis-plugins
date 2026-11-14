<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { useStore, useSvelteFlow } from "@xyflow/svelte";
  import { getContext } from "svelte";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import ListChecks from "@lucide/svelte/icons/list-checks";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import { displayNodeValue, type FlowCanvasNode, type FlowCanvasEdge } from "../lib/json-canvas";
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const store = useStore<FlowCanvasNode, FlowCanvasEdge>();
  const { updateNode } = useSvelteFlow<FlowCanvasNode, FlowCanvasEdge>();
  let open = $state(false);
  let query = $state("");
  let search: HTMLInputElement | null = $state(null);
  const listId = `canvas-cards-${crypto.randomUUID()}`;
  const label = (node: FlowCanvasNode) =>
    `${displayNodeValue(node.data).slice(0, 60) || "Empty card"} (${node.id})`;
  const visible = $derived(
    store.nodes.filter((node) =>
      `${displayNodeValue(node.data)} ${node.id}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ),
  );
  function toggle(id: string): void {
    if (board.inputBlocked) return;
    const node = store.nodes.find((node) => node.id === id);
    if (node) updateNode(id, { selected: !node.selected });
  }
</script>

<div class="canvas-touch-selection nodrag nopan nowheel">
  <Popover.Root
    bind:open
    onOpenChange={() => {
      query = "";
    }}
  >
    <Tooltip.Root
      ><Tooltip.Trigger
        >{#snippet child({ props: tooltipProps })}<Popover.Trigger
            {...tooltipProps}
          >
            {#snippet child({ props })}<Button
                {...props}
                variant="ghost"
                size="icon"
                aria-label="Select cards"
                disabled={board.inputBlocked}
                ><ListChecks aria-hidden="true" /></Button
              >{/snippet}
          </Popover.Trigger>{/snippet}</Tooltip.Trigger
      ><Tooltip.Content sideOffset={6}>Select cards</Tooltip.Content
      ></Tooltip.Root
    >
    <Popover.Content
      side="top"
      aria-label="Card selection"
      portalProps={{ disabled: true }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        search?.focus();
      }}
      style="--ui-popover-width:min(22rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0;--ui-command-view-list-max-height:min(18rem,50dvh)"
    >
      <CommandView.Root label="Search cards" shouldFilter={false}>
        <CommandView.Input
          bind:ref={search}
          bind:value={query}
          aria-label="Search cards"
          aria-controls={listId}
          placeholder="Search cards…"
          disabled={board.inputBlocked}
        />
        <CommandView.List id={listId} role="grid" aria-label="Canvas cards">
          {#if !visible.length}<CommandView.Empty role="row"
              ><span role="gridcell">No cards found.</span></CommandView.Empty
            >{/if}
          <CommandView.Group role="rowgroup">
            {#each visible as node (node.id)}
              <CommandView.Item
                role="row"
                value={node.id}
                disabled={board.inputBlocked}
                onSelect={() => toggle(node.id)}
              >
                <span role="gridcell">
                  <Checkbox
                    aria-label={label(node)}
                    checked={node.selected ?? false}
                    disabled={board.inputBlocked}
                    onCheckedChange={() => toggle(node.id)}
                    onclick={(event) => event.stopPropagation()}
                  />
                </span>
                <span role="gridcell"
                  ><CommandView.ItemLabel>{label(node)}</CommandView.ItemLabel
                  ></span
                >
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        </CommandView.List>
        <CommandView.Footer
          >Enter toggles a card. Escape closes selection.</CommandView.Footer
        >
      </CommandView.Root>
    </Popover.Content>
  </Popover.Root>
</div>
