<script lang="ts">
  import Camera from "@lucide/svelte/icons/camera";
  import GitMerge from "@lucide/svelte/icons/git-merge";
  import ArchiveRestore from "@lucide/svelte/icons/archive-restore";
  import { CopyableValue } from "@lapismd/design-core/workspace/settings";
  import type { DeviceView, RevisionView } from "../presentation/types";
  import {
    formatRevisionTimestamp,
    revisionReasonLabel,
  } from "./history-format";
  import {
    REVISION_GRAPH_NODE_RADIUS,
    REVISION_GRAPH_ROW_HEIGHT,
    buildRevisionGraph,
    graphContentLeft,
    graphSvgWidth,
    laneX,
    revisionGraphLaneStem,
    type RevisionGraphRow,
  } from "./revision-graph";
  import {
    changeSetForRevision,
    type SnapshotChangeSet,
  } from "./snapshot-changes";
  import SnapshotChangedFiles from "./SnapshotChangedFiles.svelte";
  import "./history-chrome.css";

  // DESIGN_CORE_CANDIDATE
  let {
    revisions,
    devices = [],
    changeSets = [],
    selectedId = null,
    selectedPath = null,
    onSelect,
    onSelectPath,
  }: {
    revisions: RevisionView[];
    devices?: DeviceView[];
    changeSets?: SnapshotChangeSet[];
    selectedId?: string | null;
    selectedPath?: string | null;
    onSelect?: (revision: RevisionView) => void;
    onSelectPath?: (path: string) => void;
  } = $props();

  const showsChangeSets = $derived(changeSets.length > 0);

  const rows = $derived(buildRevisionGraph(revisions, devices));
  const svgWidth = $derived(graphSvgWidth(rows));
  const rowHeight = REVISION_GRAPH_ROW_HEIGHT;
  const radius = REVISION_GRAPH_NODE_RADIUS;

  function laneColor(row: RevisionGraphRow, lane: number): string {
    return row.lanes[lane]?.color ?? "var(--ui-sync-accent)";
  }

  function vertical(
    row: RevisionGraphRow,
    lane: number,
  ): { y1: number; y2: number } {
    return revisionGraphLaneStem(row, lane, rowHeight);
  }
</script>

<ol
  class="sync-graph-list"
  style:--sync-graph-row-height="{rowHeight}px"
  aria-label="Revision graph"
>
  {#each rows as row (row.revision.eventId)}
    {@const commitX = laneX(row.commitLane)}
    {@const centerY = rowHeight / 2}
    <li
      class="sync-graph-item"
      class:sync-graph-item--selected={selectedId === row.revision.eventId}
    >
      {#if selectedId === row.revision.eventId}
        <span
          class="sync-graph-item__chip"
          data-testid="sync-graph-selected-chip"
          aria-hidden="true"
        ></span>
      {/if}
      <button
        type="button"
        class="sync-graph-row"
        class:sync-graph-row--tip={row.isTip}
        style:padding-left="{graphContentLeft(row)}px"
        style:height="{rowHeight}px"
        aria-current={selectedId === row.revision.eventId ? "true" : undefined}
        aria-expanded={showsChangeSets
          ? selectedId === row.revision.eventId
          : undefined}
        data-revision-id={row.revision.eventId}
        onclick={() => onSelect?.(row.revision)}
      >
        <svg
          class="sync-graph-svg"
          width={svgWidth}
          height={rowHeight}
          aria-hidden="true"
        >
          {#each row.lanes as lane, index (index)}
            {@const x = laneX(index)}
            {@const stem = vertical(row, index)}
            <line
              x1={x}
              y1={stem.y1}
              x2={x}
              y2={stem.y2}
              stroke={lane.color}
              stroke-width="2"
            />
          {/each}
          {#if row.splitFromLane != null}
            {@const parentX = laneX(row.splitFromLane)}
            <path
              class="sync-edge"
              d={`M ${parentX} ${rowHeight} C ${parentX} ${rowHeight - 10}, ${commitX} ${centerY + 10}, ${commitX} ${centerY}`}
              stroke={laneColor(row, row.splitFromLane)}
              stroke-width="2"
            />
          {/if}
          {#each row.mergeFromLanes as mergeLane (mergeLane)}
            {@const parentX = laneX(mergeLane)}
            <path
              class="sync-edge"
              d={`M ${commitX} ${centerY} C ${commitX} ${centerY + 22}, ${parentX} ${centerY + 10}, ${parentX} ${rowHeight}`}
              stroke={laneColor(row, mergeLane)}
              stroke-width="2"
            />
          {/each}
          {#each row.convergingLanes as convergeLane (convergeLane)}
            {@const fromX = laneX(convergeLane)}
            <path
              class="sync-edge"
              d={`M ${fromX} ${centerY} C ${fromX} ${centerY + 14}, ${commitX} ${centerY + 14}, ${commitX} ${centerY}`}
              stroke={laneColor(row, convergeLane)}
              stroke-width="2"
            />
          {/each}
          <circle
            class="sync-node"
            class:sync-node--tip={row.isTip}
            cx={commitX}
            cy={centerY}
            r={row.isTip ? radius + 1 : radius}
            fill={laneColor(row, row.commitLane)}
          />
        </svg>
        <span class="sync-graph-copy">
          <span class="sync-graph-title-row">
            {#if row.revision.reason === "merge"}
              <span class="sync-graph-icon" aria-hidden="true"
                ><GitMerge /></span
              >
            {:else if row.revision.reason === "restore-file" || row.revision.reason === "restore-vault"}
              <span class="sync-graph-icon" aria-hidden="true"
                ><ArchiveRestore /></span
              >
            {:else if row.revision.reason === "checkpoint"}
              <span class="sync-graph-icon" aria-hidden="true"><Camera /></span>
            {/if}
            <span class="sync-graph-title">{row.revision.message}</span>
          </span>
          <span class="sync-graph-meta">
            <time
              datetime={new Date(row.revision.createdAt * 1000).toISOString()}
            >
              {formatRevisionTimestamp(row.revision.createdAt)}
            </time>
          </span>
          <span class="sync-graph-chips">
            <span class="sync-chip"
              >{revisionReasonLabel(row.revision.reason)}</span
            >
            {#each row.deviceAliases as alias (alias)}
              <span class="sync-chip sync-chip--device">{alias}</span>
            {/each}
          </span>
        </span>
      </button>
      <CopyableValue
        class="sync-graph-copy-id"
        value={row.revision.eventId}
        label="revision ID"
      />
      {#if showsChangeSets && selectedId === row.revision.eventId}
        <div class="sync-graph-files">
          <SnapshotChangedFiles
            compact
            files={changeSetForRevision(changeSets, row.revision.eventId)}
            {selectedPath}
            {onSelectPath}
          />
        </div>
      {/if}
    </li>
  {/each}
</ol>
