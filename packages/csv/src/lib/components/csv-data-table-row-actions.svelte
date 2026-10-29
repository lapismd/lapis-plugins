<script lang="ts">
  import BetweenVerticalEndIcon from "@lucide/svelte/icons/between-vertical-end";
  import BetweenVerticalStartIcon from "@lucide/svelte/icons/between-vertical-start";
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";

  type Props = {
    onInsertAbove?: () => void;
    onInsertBelow?: () => void;
    onDelete?: () => void;
  };

  let { onInsertAbove, onInsertBelow, onDelete }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        class="csv-data-table__row-actions"
        size="icon"
        variant="ghost"
        aria-label="Row actions"
      >
        <EllipsisIcon />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="csv-data-table__menu">
    <DropdownMenu.Item onclick={() => onInsertAbove?.()}>
      <BetweenVerticalStartIcon class="csv-data-table__header-icon" />
      Insert row above
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => onInsertBelow?.()}>
      <BetweenVerticalEndIcon class="csv-data-table__header-icon" />
      Insert row below
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onclick={() => onDelete?.()}>
      <Trash2Icon class="csv-data-table__header-icon" />
      Delete row
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
