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
</script>

<Table.Row
  data-index={virtualIndex}
  data-csv-row-index={rowIndex}
  class={cn(className, isRowDragSource && "is-drag-source is-row-drag-source")}
>
  {@render children()}
</Table.Row>
