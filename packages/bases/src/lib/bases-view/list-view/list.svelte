<script lang="ts">
  import type { MetadataType } from "@lapis-notes/api";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Circle from "@lucide/svelte/icons/circle";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import Cell from "../cell.svelte";
  import type { BasesView } from "../bases.svelte";
  import SummaryStrip from "../components/summary-strip.svelte";
  import { getMetadataTypeInfo } from "../metadata-type-info";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();

  let groups = $derived(view.data.groupedData);
  let groupBy = $derived(view.data.groupBy);
  let groupLabel = $derived.by(() => {
    if (!groupBy) return "";
    return view.config.getDisplayName(groupBy) || groupBy;
  });
  let types = $derived.by(() => {
    return view.allProperties.reduce<Record<string, { type: MetadataType }>>(
      (acc, id) => {
        if (id.startsWith("note.")) {
          const key = id.substring(5);
          acc[id] = {
            type: getMetadataTypeInfo(key, "text", view.controller.app).type,
          };
        } else {
          acc[id] = { type: "text" };
        }
        return acc;
      },
      {},
    );
  });
  let visibleProperties = $derived(view.config.getOrder());
  let primaryProperty = $derived(visibleProperties[0] ?? "file.name");
  let secondaryProperties = $derived(visibleProperties.slice(1));
  let collapsedGroups = $state<Record<string, boolean>>({});

  function groupId(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    return `${groupBy || "ungrouped"}:${group.key?.toString() ?? `ungrouped_${index}`}`;
  }

  function isCollapsed(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    return !!collapsedGroups[groupId(group, index)];
  }

  function toggleGroup(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    const key = groupId(group, index);
    collapsedGroups = {
      ...collapsedGroups,
      [key]: !collapsedGroups[key],
    };
  }
</script>

<div
  class="bases-card-grid bases-record-view bases-list"
  data-layout="list"
  data-ui-component="bases-list-view"
  data-ui-part="viewport"
>
  <SummaryStrip {view} class="bases-list__summary" />
  <ScrollArea.Root
    class="bases-record-view__scroll"
    orientation="both"
    type="always"
    viewportProps={{ "aria-label": "Records" }}
  >
    <div class="bases-list__groups">
      {#each groups as group, index (groupId(group, index))}
        <section class="bases-list__group" data-grouped={Boolean(groupBy)}>
          {#if groupBy}
            <div class="bases-card-grid__group-header bases-list__group-header">
              <button
                type="button"
                data-ui-part="group-toggle"
                class="bases-list__group-toggle"
                aria-expanded={!isCollapsed(group, index)}
                onclick={() => toggleGroup(group, index)}
              >
                {#if isCollapsed(group, index)}<ChevronRight
                  />{:else}<ChevronDown />{/if}
                <span>{groupLabel}</span>
                <span class="bases-card-grid__group-value"
                  >{group.hasKey() ? group.key?.toString() : "Ungrouped"}</span
                >
                <span class="bases-list__count">{group.entries.length}</span>
              </button>
            </div>
          {/if}
          {#if !isCollapsed(group, index)}
            <ul class="bases-list__records">
              {#each group.entries as row (row.id)}
                <li class="bases-list__record" data-ui-part="row">
                  {#if groupBy}<Circle
                      class="bases-list__bullet"
                      data-ui-part="record-bullet"
                      aria-hidden="true"
                    />{/if}
                  <div class="bases-list__record-content">
                    <div class="bases-list__identity">
                      <Cell
                        app={view.controller.app}
                        name={primaryProperty}
                        label={view.config.getDisplayName(primaryProperty)}
                        file={row.file}
                        readOnly={view.controller.readOnly}
                        type={types[primaryProperty]?.type}
                        value={row.getValue(primaryProperty)}
                        editOnActivation
                      />
                    </div>
                    <dl class="bases-list__properties">
                      {#each secondaryProperties as id (id)}
                        <div class="bases-list__property">
                          <dt>{view.config.getDisplayName(id)}</dt>
                          <dd>
                            <Cell
                              app={view.controller.app}
                              name={id}
                              label={view.config.getDisplayName(id)}
                              file={row.file}
                              readOnly={view.controller.readOnly}
                              type={types[id]?.type}
                              value={row.getValue(id)}
                              editOnActivation
                            />
                          </dd>
                        </div>
                      {/each}
                    </dl>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    </div>
  </ScrollArea.Root>
</div>
