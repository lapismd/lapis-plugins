<script lang="ts">
  import { createDroppable } from "@dnd-kit/svelte";
  import * as Table from "@lapismd/design-core/shadcn/table";
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
    children,
  }: Props = $props();

  let cellRef = $state<HTMLElement | null>(null);

  const rowDroppable = createDroppable({
    get id() {
      return `csv-row-drop:${rowIndex}:${colIndex}`;
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
    return rowDroppable.attach(cellRef);
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
  {@render children()}
</Table.Cell>
