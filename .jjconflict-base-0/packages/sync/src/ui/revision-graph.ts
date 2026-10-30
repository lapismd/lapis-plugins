import type { DeviceView, RevisionView } from "../presentation/types";

export const REVISION_GRAPH_ROW_HEIGHT = 76;
export const REVISION_GRAPH_LANE_WIDTH = 16;
export const REVISION_GRAPH_NODE_RADIUS = 5;
export const REVISION_GRAPH_LEFT_PAD = 12;

export const REVISION_GRAPH_LANE_COLORS = [
  "var(--ui-sync-lane-1, #2563eb)",
  "var(--ui-sync-lane-2, #16a34a)",
  "var(--ui-sync-lane-3, #d97706)",
  "var(--ui-sync-lane-4, #dc2626)",
  "var(--ui-sync-lane-5, #7c3aed)",
  "var(--ui-sync-lane-6, #0891b2)",
  "var(--ui-sync-lane-7, #db2777)",
  "var(--ui-sync-lane-8, #65a30d)",
] as const;

export type RevisionGraphLane = {
  hash: string;
  color: string;
};

export type RevisionGraphRow = {
  revision: RevisionView;
  commitLane: number;
  lanes: RevisionGraphLane[];
  mergeFromLanes: number[];
  convergingLanes: number[];
  splitFromLane: number | null;
  commitStartsLane: boolean;
  isFirst: boolean;
  isTip: boolean;
  deviceAliases: string[];
};

export function revisionGraphLaneStem(
  row: RevisionGraphRow,
  lane: number,
  rowHeight = REVISION_GRAPH_ROW_HEIGHT,
): { y1: number; y2: number } {
  const center = rowHeight / 2;
  const isSplitCommitLane =
    row.splitFromLane != null && lane === row.commitLane;
  const starts =
    row.commitStartsLane && row.commitLane === lane && !isSplitCommitLane;
  const converge = row.convergingLanes.includes(lane);
  return {
    y1: row.isFirst || starts ? center : 0,
    y2: converge || isSplitCommitLane ? center : rowHeight,
  };
}

export function laneX(lane: number): number {
  return (
    REVISION_GRAPH_LEFT_PAD +
    lane * REVISION_GRAPH_LANE_WIDTH +
    REVISION_GRAPH_LANE_WIDTH / 2
  );
}

export function graphContentLeft(row: RevisionGraphRow): number {
  const rightmost = Math.max(
    row.lanes.length - 1,
    row.mergeFromLanes.length ? Math.max(...row.mergeFromLanes) : 0,
    row.commitLane,
  );
  return (
    REVISION_GRAPH_LEFT_PAD +
    (rightmost + 1) * REVISION_GRAPH_LANE_WIDTH +
    REVISION_GRAPH_LANE_WIDTH
  );
}

export function graphSvgWidth(rows: RevisionGraphRow[]): number {
  let maxLanes = 1;
  for (const row of rows) {
    maxLanes = Math.max(
      maxLanes,
      row.lanes.length,
      row.mergeFromLanes.length ? Math.max(...row.mergeFromLanes) + 1 : 0,
      row.commitLane + 1,
    );
  }
  return (
    REVISION_GRAPH_LEFT_PAD +
    maxLanes * REVISION_GRAPH_LANE_WIDTH +
    REVISION_GRAPH_LANE_WIDTH
  );
}

export function tipRevisionIds(revisions: RevisionView[]): string[] {
  const referenced = new Set<string>();
  for (const revision of revisions) {
    for (const parent of revision.parents) referenced.add(parent);
  }
  return revisions
    .filter((revision) => !referenced.has(revision.eventId))
    .map((revision) => revision.eventId);
}

export function buildRevisionGraph(
  revisions: RevisionView[],
  devices: DeviceView[] = [],
): RevisionGraphRow[] {
  const lanes: RevisionGraphLane[] = [];
  let colorIndex = 0;
  const rows: RevisionGraphRow[] = [];
  const tips = new Set(tipRevisionIds(revisions));
  const aliasesByHead = new Map<string, string[]>();
  for (const device of devices) {
    const aliases = aliasesByHead.get(device.revisionEventId) ?? [];
    aliases.push(device.alias);
    aliasesByHead.set(device.revisionEventId, aliases);
  }

  for (let commitIndex = 0; commitIndex < revisions.length; commitIndex += 1) {
    const revision = revisions[commitIndex];
    if (!revision) continue;
    let commitLane = lanes.findIndex((lane) => lane.hash === revision.eventId);
    let commitStartsLane = false;
    if (commitLane === -1) {
      commitStartsLane = true;
      commitLane = lanes.length;
      lanes.push({
        hash: revision.eventId,
        color:
          REVISION_GRAPH_LANE_COLORS[
            colorIndex++ % REVISION_GRAPH_LANE_COLORS.length
          ] ?? REVISION_GRAPH_LANE_COLORS[0],
      });
    }

    const currentLanes = lanes.map((lane) => ({ ...lane }));
    const convergingLanes = currentLanes.flatMap((lane, index) =>
      lane.hash === revision.eventId && index !== commitLane ? [index] : [],
    );
    const firstParent = revision.parents[0];
    const otherParents = revision.parents.slice(1);
    const firstParentLane = firstParent
      ? currentLanes.findIndex((lane) => lane.hash === firstParent)
      : -1;
    const splitFromLane =
      commitLane === currentLanes.length - 1 &&
      firstParentLane !== -1 &&
      firstParentLane !== commitLane
        ? firstParentLane
        : null;

    const currentColor =
      lanes[commitLane]?.color ?? REVISION_GRAPH_LANE_COLORS[0];
    if (firstParent) {
      lanes[commitLane] = { hash: firstParent, color: currentColor };
    } else {
      lanes.splice(commitLane, 1);
    }

    const mergeFromLanes: number[] = [];
    for (const parent of otherParents) {
      const existing = lanes.findIndex((lane) => lane.hash === parent);
      if (existing !== -1) {
        mergeFromLanes.push(existing);
        continue;
      }
      mergeFromLanes.push(lanes.length);
      lanes.push({
        hash: parent,
        color:
          REVISION_GRAPH_LANE_COLORS[
            colorIndex++ % REVISION_GRAPH_LANE_COLORS.length
          ] ?? REVISION_GRAPH_LANE_COLORS[0],
      });
    }

    const seen = new Set<string>();
    for (let index = 0; index < lanes.length; ) {
      const hash = lanes[index]?.hash;
      if (!hash || seen.has(hash)) {
        lanes.splice(index, 1);
        continue;
      }
      seen.add(hash);
      index += 1;
    }

    rows.push({
      revision,
      commitLane,
      lanes: currentLanes,
      mergeFromLanes,
      convergingLanes,
      splitFromLane,
      commitStartsLane,
      isFirst: commitIndex === 0,
      isTip: tips.has(revision.eventId),
      deviceAliases: aliasesByHead.get(revision.eventId) ?? [],
    });
  }

  return rows;
}
