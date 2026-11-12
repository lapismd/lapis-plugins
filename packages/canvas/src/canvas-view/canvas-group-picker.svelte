<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import type { FlowCanvasNode } from "../lib/json-canvas";
  let {
    groups,
    onSelect,
  }: {
    groups: FlowCanvasNode[];
    onSelect: (id: string) => void | Promise<void>;
  } = $props();
  let open = $state(false);
  let search: HTMLInputElement | null = $state(null);
  const listId = `canvas-groups-${crypto.randomUUID()}`;
</script>

<Popover.Root bind:open>
  <Tooltip.Root
    ><Tooltip.Trigger
      >{#snippet child({ props: tooltipProps })}<Popover.Trigger
          {...tooltipProps}
        >
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              aria-label="Jump to group"
              >Jump to group<ChevronsUpDown data-icon="inline-end" /></Button
            >{/snippet}
        </Popover.Trigger>{/snippet}</Tooltip.Trigger
    ><Tooltip.Content sideOffset={6}>Jump to group</Tooltip.Content
    ></Tooltip.Root
  >
  <Popover.Content
    side="top"
    aria-label="Jump to group"
    portalProps={{ disabled: true }}
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      search?.focus();
    }}
    style="--ui-popover-width:min(22rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
  >
    <CommandView.Root label="Search groups">
      <CommandView.Input
        bind:ref={search}
        aria-controls={listId}
        placeholder="Search groups…"
      />
      <CommandView.List id={listId} aria-label="Canvas groups">
        <CommandView.Empty>No groups found.</CommandView.Empty>
        <CommandView.Group>
          {#each groups as node (node.id)}
            <CommandView.Item
              value={node.id}
              keywords={[node.data.label || "Unnamed group"]}
              onSelect={async () => {
                await onSelect(node.id);
                open = false;
              }}
            >
              <CommandView.ItemLabel
                >{node.data.label || "Unnamed group"}</CommandView.ItemLabel
              >
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
