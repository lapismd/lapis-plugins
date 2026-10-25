<script lang="ts">
  import ArrowDownAZIcon from "@lucide/svelte/icons/arrow-down-a-z";
  import ArrowDownZAIcon from "@lucide/svelte/icons/arrow-down-z-a";
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import BetweenHorizontalEndIcon from "@lucide/svelte/icons/between-horizontal-end";
  import BetweenHorizontalStartIcon from "@lucide/svelte/icons/between-horizontal-start";
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import GripHorizontal from "@lucide/svelte/icons/grip-horizontal";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { cn } from "@lapis-notes/ui";
  import type { Attachment } from "svelte/attachments";
  import CsvCell from "./csv-cell.svelte";

  type Props = {
    title: string;
    colIndex: number;
    colCount: number;
    isSynthetic?: boolean;
    class?: string;
    attachColGripHandle: Attachment;
    onLabelChange?: (value: string) => void;
    onSortAsc?: () => void;
    onSortDesc?: () => void;
    onInsertLeft?: () => void;
    onInsertRight?: () => void;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onDelete?: () => void;
    onSelectColumn?: () => void;
  };

  let {
    title,
    colIndex,
    colCount,
    isSynthetic = false,
    class: className,
    attachColGripHandle,
    onSelectColumn,
    onLabelChange,
    onSortAsc,
    onSortDesc,
    onInsertLeft,
    onInsertRight,
    onMoveLeft,
    onMoveRight,
    onDelete,
  }: Props = $props();

  const canMoveLeft = $derived(colIndex > 0);
  const canMoveRight = $derived(colIndex < colCount - 1);
</script>

<div class={cn("csv-data-table__header", className)}>
  <Button
    variant="ghost"
    size="xs"
    data-grab-handle=""
    class="csv-data-table__col-grip"
    aria-label="Select column"
    onclick={(event) => {
      event.stopPropagation();
      onSelectColumn?.();
    }}
    {@attach attachColGripHandle}
  >
    <GripHorizontal />
  </Button>
  <div class="csv-data-table__header-label">
    <CsvCell
      value={title}
      class="csv-data-table__header-cell-editor"
      onContentChange={(value) => onLabelChange?.(value)}
    />
  </div>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props }: { props: Record<string, unknown> })}
        <Button
          {...props}
          class="csv-data-table__header-menu"
          size="icon"
          variant="ghost"
          aria-label="Column actions"
        >
          <EllipsisIcon class="csv-data-table__header-icon" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start" class="csv-data-table__menu">
      <DropdownMenu.Item onclick={() => onSortAsc?.()}>
        <ArrowDownAZIcon class="csv-data-table__header-icon" />
        Sort A–Z
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => onSortDesc?.()}>
        <ArrowDownZAIcon class="csv-data-table__header-icon" />
        Sort Z–A
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => onMoveLeft?.()} disabled={!canMoveLeft}>
        <ArrowLeftIcon class="csv-data-table__header-icon" />
        Move column left
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onclick={() => onMoveRight?.()}
        disabled={!canMoveRight}
      >
        <ArrowRightIcon class="csv-data-table__header-icon" />
        Move column right
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => onInsertLeft?.()}>
        <BetweenHorizontalStartIcon class="csv-data-table__header-icon" />
        Insert column left
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => onInsertRight?.()}>
        <BetweenHorizontalEndIcon class="csv-data-table__header-icon" />
        Insert column right
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => onDelete?.()}>
        <Trash2Icon class="csv-data-table__header-icon" />
        Delete column
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
