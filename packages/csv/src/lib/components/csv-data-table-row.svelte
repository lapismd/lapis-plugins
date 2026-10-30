<script lang="ts">
  import * as Table from "@lapismd/design-core/shadcn/table";
  import { cn } from "@lapis-notes/ui";
  import type { Snippet } from "svelte";

  type Props = {
    rowIndex: number;
    virtualIndex: number;
    class?: string;
    isRowDragSource?: boolean;
    children: Snippet;
  };

  let {
    rowIndex,
    virtualIndex,
    class: className,
    isRowDragSource = false,
    children,
  }: Props = $props();

  let hovered = $state(false);
</script>

<Table.Row
  data-index={virtualIndex}
  data-csv-row-index={rowIndex}
  data-csv-hover={hovered ? "true" : undefined}
  class={cn(className, isRowDragSource && "is-drag-source is-row-drag-source")}
  onpointerenter={() => {
    hovered = true;
  }}
  onpointerleave={() => {
    hovered = false;
  }}
>
  {@render children()}
</Table.Row>
