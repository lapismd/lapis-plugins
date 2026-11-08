<script lang="ts">
  import PropertyPicker from "../components/property-picker.svelte";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import type { QueryController } from "../bases.svelte";
  import type { KanbanBasesView } from "./index";
  import { applyColumnOrder, toColumnSources } from "./mapping";

  let { controller }: { controller: QueryController } = $props();
  const board = $derived(controller.view as KanbanBasesView);
  const ready = $derived(typeof board.setGrouping === "function");
  const columns = $derived(
    applyColumnOrder(
      toColumnSources(board.data.groupedData, board.data.groupBy ?? ""),
      board.columnOrder,
    ),
  );
  const anchor = $derived(
    board.anchorColumnId === null
      ? "__none__"
      : (board.anchorColumnId ?? "__automatic__"),
  );
  const anchorLabel = $derived(
    anchor === "__none__"
      ? "None"
      : anchor === "__automatic__"
        ? "Automatic (first column)"
        : (columns.find((column) => column.id === anchor)?.label ??
          "Selected column unavailable"),
  );
</script>

{#if ready}
  <Field.Field class="bases-view-setting">
    <Field.Label>Group by</Field.Label>
    <PropertyPicker
      label="Group by"
      columns={controller.getAllColumns()}
      value={board.data.groupBy}
      placeholder="None"
      onChange={(value) => board.setGrouping(value)}
    />
  </Field.Field>
  {#if board.type === "kanban"}
    <Field.Field class="bases-view-setting">
      <Field.Label>Always-open column</Field.Label>
      <Select.Root
        type="single"
        value={anchor}
        onValueChange={(value) =>
          board.setAnchorColumn(
            value === "__automatic__"
              ? undefined
              : value === "__none__"
                ? null
                : value,
          )}
      >
        <Select.Trigger
          class="bases-board-setting-trigger"
          aria-label="Always-open column">{anchorLabel}</Select.Trigger
        >
        <Select.Content
          ><Select.Group>
            <Select.Item
              value="__automatic__"
              label="Automatic (first column)"
            />
            <Select.Item value="__none__" label="None" />
            {#each columns as column (column.id)}
              <Select.Item
                value={column.id}
                label={board.columnMeta[column.id]?.title ?? column.label}
              />
            {/each}
          </Select.Group></Select.Content
        >
      </Select.Root>
    </Field.Field>
  {/if}
{/if}

<style>
  :global(.bases-board-setting-trigger) {
    width: 100%;
  }
</style>
