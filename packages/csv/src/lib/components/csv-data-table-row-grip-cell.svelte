<script lang="ts">
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { cn } from "@lapis-notes/ui";
  import type { Snippet } from "svelte";
  import type { CsvTableDragSource } from "./csv-table-dnd";
  import { dropIndicatorClasses } from "./csv-table-dnd";

  type Props = {
    rowIndex: number;
    colIndex: number;
    class?: string;
    dragSource: CsvTableDragSource | null;
    dragOverIndex: number | null;
    selectedClass?: string;
    isColDragSource?: boolean;
    onSelectRow?: () => void;
    children: Snippet;
  };

  let {
    rowIndex,
    colIndex,
    class: className,
    dragSource,
    dragOverIndex,
    selectedClass,
    isColDragSource = false,
    onSelectRow,
    children,
  }: Props = $props();

  let cellRef = $state<HTMLElement | null>(null);

  const rowDraggable = createDraggable({
    get id() {
      return `csv-row:${rowIndex}`;
    },
    type: "csv-table-row",
    get data() {
      return { type: "csv-table-row" as const, index: rowIndex };
    },
  });

  const rowDroppable = createDroppable({
    get id() {
      return `csv-row-drop:${rowIndex}:grip`;
    },
    accept: "csv-table-row",
    get data() {
      return { type: "csv-table-row" as const, index: rowIndex };
    },
  });

  $effect(() => {
    if (!cellRef) {
      return;
    }
    const cleanupDraggable = rowDraggable.attach(cellRef);
    const cleanupDroppable = rowDroppable.attach(cellRef);
    return () => {
      cleanupDraggable();
      cleanupDroppable();
    };
  });
</script>

<Table.Cell
  bind:ref={cellRef}
  data-csv-col-index={colIndex}
  class={cn(
    "csv-data-table__cell",
    className,
    selectedClass,
    dropIndicatorClasses(dragSource, dragOverIndex, rowIndex, colIndex),
    isColDragSource && "is-drag-source is-col-drag-source",
  )}
>
  <Button
    variant="ghost"
    size="xs"
    data-grab-handle=""
    class="csv-data-table__row-grip"
    aria-label="Drag row"
    onclick={() => onSelectRow?.()}
    {@attach rowDraggable.attachHandle}
  >
    <GripVertical />
  </Button>
  {@render children()}
</Table.Cell>
