<script lang="ts">
  import {
    KanbanBoard,
    KanbanCardDetail,
    KanbanActivityView,
    type KanbanColumnData,
    type KanbanDetailBodyContext,
  } from "@lapismd/design-core/workspace/kanban";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import FilterIcon from "@lucide/svelte/icons/list-filter";
  import type { BasesEntry } from "../bases.svelte";
  import type { KanbanBasesView } from "./index";
  import FilterGroup from "../components/filters/filter-group.svelte";
  import MarkdownDetail from "./markdown-detail.svelte";
  import { buildKanbanColumns, toCardData, valueToText } from "./mapping";
  import { markdownExcerpt } from "./configuration";

  let { view }: { view: KanbanBasesView } = $props();
  let summaryById = $state<Record<string, string>>({});
  const cachedBodies = new Map<string, { mtime: number; summary: string }>();
  let selectedEntry = $state<BasesEntry | null>(null);
  let selectedColumnId = $state("");
  let detailOpen = $state(false);
  let markdownDetail = $state<{ flush(): Promise<boolean> } | null>(null);
  let openingError = $state("");

  const fields = $derived({
    titleProperty: view.titleProperty,
    chipProperty: view.chipProperty,
    displayProperties: view.displayProperties,
    descriptionProperty: view.descriptionProperty,
    tagsProperty: view.tagsProperty,
    badgeProperty: view.badgeProperty,
    badgeLabel: view.badgeLabel,
    badgeColor: view.badgeColor,
    propertyLabels: view.propertyLabels,
    propertyTypes: view.propertyTypes,
    summaries: summaryById,
  });
  const filtered = $derived.by(() => {
    try {
      return { ...view.filterGroups(), error: "" };
    } catch (error) {
      return {
        groups: [],
        totals: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
  const built = $derived(
    buildKanbanColumns({
      ...fields,
      groups: filtered.groups,
      groupProperty: view.data.groupBy ?? "",
      columnOrder: view.columnOrder,
      columnMeta: view.columnMeta,
      columnTotals: filtered.totals,
    }),
  );
  const hasGrouping = $derived(Boolean(view.data.groupBy));
  const activityEntries = $derived(
    built.columns.flatMap((column) =>
      column.cards.map((card) => ({
        card,
        columnId: column.id,
        date: view.dateProperty
          ? valueToText(view.findEntry(card.id)?.getValue(view.dateProperty))
          : null,
      })),
    ),
  );
  const selected = $derived.by(() => {
    if (!selectedEntry) return null;
    const entry = view.findEntry(selectedEntry.file.path) ?? selectedEntry;
    const column =
      built.columns.find((column) =>
        column.cards.some((card) => card.id === entry.id),
      ) ?? built.columns.find((column) => column.id === selectedColumnId);
    return {
      entry,
      column,
      card: toCardData(entry, column?.color ?? "#0e7490", fields),
    };
  });

  $effect(() => {
    const entries = view.data.data;
    const description = view.descriptionProperty;
    const files = entries
      .filter(
        (entry) => !description || !valueToText(entry.getValue(description)),
      )
      .map((entry) => ({
        id: entry.id,
        file: entry.file,
        mtime: entry.file.stat.mtime,
      }));
    let cancelled = false;
    void (async () => {
      let cursor = 0;
      const summaries: Record<string, string> = {};
      await Promise.all(
        Array.from({ length: Math.min(4, files.length) }, async () => {
          while (cursor < files.length) {
            const { id, file, mtime } = files[cursor++];
            const cached = cachedBodies.get(id);
            try {
              const summary =
                cached?.mtime === mtime
                  ? cached.summary
                  : markdownExcerpt(
                      await view.controller.app.vault.cachedRead(file),
                    );
              if (cancelled) return;
              cachedBodies.set(id, { mtime, summary });
              summaries[id] = summary;
            } catch {
              if (!cancelled) cachedBodies.delete(id);
            }
          }
        }),
      );
      if (!cancelled) summaryById = summaries;
    })();
    return () => {
      cancelled = true;
    };
  });

  async function handleCardOpen(
    cardId: string,
    columnId: string,
  ): Promise<void> {
    openingError = "";
    try {
      if (detailOpen && !((await markdownDetail?.flush()) ?? true)) return;
      const entry = view.findEntry(cardId);
      if (!entry) return;
      selectedEntry = entry;
      selectedColumnId = columnId;
      detailOpen = true;
    } catch (error) {
      openingError = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleMoveCardToColumn(
    cardId: string,
    columnId: string,
  ): Promise<void> {
    const property = view.data.groupBy;
    if (!property || !view.canMoveCards) return;
    const entry = view.findEntry(cardId);
    if (entry)
      await view.setGroupValue(
        entry,
        property,
        built.groupValues[columnId] ?? null,
      );
  }
</script>

<div class="kanban-view-host">
  {#if openingError || filtered.error}<p role="alert">
      {openingError || filtered.error}
    </p>{/if}
  {#if view.type === "activity" && !view.dateProperty}<p role="status">
      Choose a date property to arrange activity. Notes without dates are shown
      under Undated.
    </p>{/if}
  <div class="bases-kanban-canvas">
    {#if view.type === "activity"}
      <KanbanActivityView
        entries={activityEntries}
        columns={hasGrouping ? built.columns : []}
        onCardOpen={handleCardOpen}
      />
    {:else}
      <KanbanBoard
        columns={hasGrouping ? built.columns : []}
        movesEnabled={view.canMoveCards}
        anchorColumnId={view.anchorColumnId}
        onCardOpen={handleCardOpen}
        onMoveCardToColumn={handleMoveCardToColumn}
        onReorderColumns={(ids) => view.setColumnOrder(ids)}
        onEditColumn={(id, meta) => view.setColumnMeta(id, meta)}
        {columnActions}
        ariaLabel="Kanban board"
        emptyTitle={hasGrouping
          ? "No notes match this board"
          : "Group this view to see a board"}
        emptyDescription={hasGrouping
          ? "Change the active filters to surface notes on this board."
          : "Choose a group-by property in the view settings to arrange notes into kanban columns."}
      />
    {/if}
  </div>
</div>

{#snippet columnActions(column: KanbanColumnData)}
  <Popover.Root
    onOpenChange={(open) => {
      if (open) view.ensureColumnFilter(column.id);
    }}
  >
    <Popover.Trigger
      >{#snippet child({ props })}<Button
          {...props}
          variant="ghost"
          size="icon"
          aria-label={`Filter ${column.label} column`}><FilterIcon /></Button
        >{/snippet}</Popover.Trigger
    >
    <Popover.Content style="width: min(90vw, 36rem)">
      <p>Filter cards in {column.label}</p>
      <FilterGroup
        controller={view.controller}
        bind:filter={
          () => view.columnFilters[column.id] ?? { and: [] },
          (filter) => view.setColumnFilter(column.id, filter)
        }
      />
    </Popover.Content>
  </Popover.Root>
{/snippet}

{#if selected}
  <KanbanCardDetail
    card={selected.card}
    columns={built.columns}
    columnId={selected.column?.id ?? selectedColumnId}
    columnLabel={selected.column?.label ?? ""}
    bind:open={detailOpen}
    movesEnabled={view.canMoveCards}
    closeOnMove={false}
    onClose={() => {
      selectedEntry = null;
    }}
    beforeClose={async () => (await markdownDetail?.flush()) ?? true}
    onMoveToColumn={(id) => handleMoveCardToColumn(selected!.entry.id, id)}
    onSaveTitle={view.canEditTitle
      ? async (title) => {
          if (!((await markdownDetail?.flush()) ?? true))
            throw new Error("Save the body before editing its title.");
          return await view.saveTitle(selected!.entry, title);
        }
      : undefined}
    body={detailBody}
    brandLabel="Notes"
  />
{/if}

{#snippet detailBody(context: KanbanDetailBodyContext)}
  {#if selected}
    <MarkdownDetail
      bind:this={markdownDetail}
      app={view.controller.app}
      file={selected.entry.file}
      editing={context.editing}
      readOnly={view.controller.readOnly}
      onEditingChange={context.setEditing}
    />
  {/if}
{/snippet}

<style>
  .kanban-view-host {
    min-width: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .bases-kanban-canvas {
    flex: 1;
    min-height: 0;
    min-width: 0;
    --kanban-board-height: 100%;
  }
</style>
