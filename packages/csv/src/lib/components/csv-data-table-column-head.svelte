<script lang="ts">
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import { cn } from "@lapis-notes/ui";
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { CsvTableDragSource } from "./csv-table-dnd";
  import { dropIndicatorClasses } from "./csv-table-dnd";

  type Props = {
    colIndex: number;
    class?: string;
    dragSource: CsvTableDragSource | null;
    dragOverIndex: number | null;
    selectedClass?: string;
    isDragSource?: boolean;
    children: Snippet<[{ attachColGripHandle: Attachment }]>;
  };

  let {
    colIndex,
    class: className,
    dragSource,
    dragOverIndex,
    selectedClass,
    isDragSource = false,
    children,
  }: Props = $props();

  let headRef = $state<HTMLElement | null>(null);

  const colDraggable = createDraggable({
    get id() {
      return `csv-col:${colIndex}`;
    },
    type: "csv-table-col",
    get data() {
      return { type: "csv-table-col" as const, index: colIndex };
    },
  });

  const colDroppable = createDroppable({
    get id() {
      return `csv-col-drop:head:${colIndex}`;
    },
    accept: "csv-table-col",
    get data() {
      return { type: "csv-table-col" as const, index: colIndex };
    },
  });

  $effect(() => {
    if (!headRef) return;
    const cleanupDraggable = colDraggable.attach(headRef);
    const cleanupDroppable = colDroppable.attach(headRef);
    return () => {
      cleanupDraggable();
      cleanupDroppable();
    };
  });
</script>

<Table.Head
  bind:ref={headRef}
  data-csv-col-index={colIndex}
  class={cn(
    className,
    selectedClass,
    isDragSource && "is-drag-source is-col-drag-source",
    dropIndicatorClasses(dragSource, dragOverIndex, -1, colIndex),
  )}
>
  {@render children({
    attachColGripHandle: colDraggable.attachHandle as Attachment,
  })}
</Table.Head>
