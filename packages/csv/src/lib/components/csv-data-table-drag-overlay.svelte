<script lang="ts">
  import { DragOverlay } from "@dnd-kit/svelte";
  import type { Draggable } from "@dnd-kit/dom";
  import { cn } from "@lapis-notes/ui";
  import type { CsvTableDragData } from "./csv-table-dnd";
  import type { CsvDragOverlayMetrics } from "./csv-table-drag-measure";

  type Props = {
    showRowNumbers: boolean;
    headerLabels: string[];
    metrics: CsvDragOverlayMetrics | null;
    rowValuesForIndex: (rowIndex: number) => string[];
    columnBodyValuesForIndex: (colIndex: number) => string[];
    rainbowClass: (colIndex: number, kind: "head" | "cell") => string;
    displayRowNumberForIndex?: (rowIndex: number) => string | number;
  };

  let {
    showRowNumbers,
    headerLabels,
    metrics,
    rowValuesForIndex,
    columnBodyValuesForIndex,
    rainbowClass,
    displayRowNumberForIndex,
  }: Props = $props();

  function dragData(source: Draggable): CsvTableDragData | null {
    const data = source.data as CsvTableDragData | undefined;
    if (data?.type === "csv-table-col" || data?.type === "csv-table-row") {
      return data;
    }
    return null;
  }

  function rowCellStyle(index: number): string | undefined {
    const width = metrics?.segmentSizes[index];
    if (!width) {
      return undefined;
    }
    return `width:${width}px;min-width:${width}px;max-width:${width}px`;
  }

  function columnCellStyle(index: number): string | undefined {
    const height = metrics?.segmentSizes[index];
    const width = metrics?.width;
    if (!height || !width) {
      return undefined;
    }
    return `width:${width}px;min-width:${width}px;max-width:${width}px;height:${height}px;min-height:${height}px;max-height:${height}px`;
  }
</script>

<DragOverlay>
  {#snippet children(source)}
    {@const data = dragData(source)}
    {#if data?.type === "csv-table-row"}
      {@const values = rowValuesForIndex(data.index)}
      <div
        class="csv-data-table__drag-overlay csv-data-table__drag-overlay--row"
        style={metrics
          ? `width:${metrics.width}px;height:${metrics.height}px`
          : undefined}
        role="presentation"
      >
        {#if showRowNumbers}
          <div
            class="csv-data-table__drag-overlay-cell csv-data-table__drag-overlay-cell--gutter"
            style={rowCellStyle(0)}
          >
            {displayRowNumberForIndex?.(data.index) ?? data.index + 1}
          </div>
        {/if}
        {#each values as value, colIndex (colIndex)}
          {@const segmentIndex = showRowNumbers ? colIndex + 1 : colIndex}
          <div
            class={cn(
              "csv-data-table__drag-overlay-cell",
              rainbowClass(colIndex, "cell"),
            )}
            style={rowCellStyle(segmentIndex)}
          >
            {value}
          </div>
        {/each}
      </div>
    {:else if data?.type === "csv-table-col"}
      {@const bodyValues = columnBodyValuesForIndex(data.index)}
      <div
        class="csv-data-table__drag-overlay csv-data-table__drag-overlay--col"
        style={metrics
          ? `width:${metrics.width}px;height:${metrics.height}px`
          : undefined}
        role="presentation"
      >
        <div
          class={cn(
            "csv-data-table__drag-overlay-cell csv-data-table__drag-overlay-cell--head csv-data-table__head",
            rainbowClass(data.index, "head"),
          )}
          style={columnCellStyle(0)}
        >
          {headerLabels[data.index] ?? ""}
        </div>
        {#each bodyValues as value, rowIndex (rowIndex)}
          <div
            class={cn(
              "csv-data-table__drag-overlay-cell",
              rainbowClass(data.index, "cell"),
            )}
            style={columnCellStyle(rowIndex + 1)}
          >
            {value}
          </div>
        {/each}
      </div>
    {/if}
  {/snippet}
</DragOverlay>
