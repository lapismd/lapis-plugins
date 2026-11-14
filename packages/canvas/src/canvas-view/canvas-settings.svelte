<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import Settings from "@lucide/svelte/icons/settings";
  import type { CanvasSettings } from "../canvas-plugin";
  let {
    snapToGrid,
    snapToObjects,
    surface = null,
    inputBlocked = false,
    onUpdate,
  }: CanvasSettings & {
    surface?: HTMLElement | null;
    inputBlocked?: boolean;
    onUpdate: (next: Partial<CanvasSettings>) => Promise<void>;
  } = $props();
  let error = $state("");
  let working = $state(false);
  async function change(next: Partial<CanvasSettings>): Promise<void> {
    if (inputBlocked || working) return;
    working = true;
    error = "";
    try {
      await onUpdate(next);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    } finally {
      working = false;
    }
  }
</script>

<Tooltip.Root
  ><Popover.Root>
    <Tooltip.Trigger>
      {#snippet child({ props: tooltipProps })}<Popover.Trigger
          {...tooltipProps}
        >
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon"
              aria-label="Canvas settings"
              disabled={inputBlocked}><Settings aria-hidden="true" /></Button
            >{/snippet}
        </Popover.Trigger>{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="left" sideOffset={6}>Canvas settings</Tooltip.Content
    >
    <Popover.Content
      side="left"
      align="start"
      sideOffset={12}
      collisionBoundary={surface ?? undefined}
      collisionPadding={8}
      aria-label="Canvas settings"
    >
      <div class="canvas-settings">
        <label
          ><Checkbox
            aria-label="Snap to grid"
            checked={snapToGrid}
            disabled={inputBlocked || working}
            onCheckedChange={(checked) =>
              void change({ snapToGrid: checked === true })}
          />Snap to grid</label
        >
        <label
          ><Checkbox
            aria-label="Snap to objects"
            checked={snapToObjects}
            disabled={inputBlocked || working}
            onCheckedChange={(checked) =>
              void change({ snapToObjects: checked === true })}
          />Snap to objects</label
        >
        {#if error}<p role="alert">{error}</p>{/if}
      </div>
    </Popover.Content>
  </Popover.Root></Tooltip.Root
>

<style>
  .canvas-settings {
    display: grid;
    gap: 12px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
</style>
