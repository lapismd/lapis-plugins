import { describe, expect, it } from "vitest";
import {
  conflictedSnapshot,
  divergedSnapshot,
  historySnapshot,
  mergedSnapshot,
} from "../../test-support/ui-fixtures";
import {
  REVISION_GRAPH_ROW_HEIGHT,
  buildRevisionGraph,
  revisionGraphLaneStem,
  tipRevisionIds,
} from "./revision-graph";

describe("buildRevisionGraph", () => {
  it("keeps a linear history on one lane", () => {
    const rows = buildRevisionGraph(historySnapshot().revisions);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.commitLane).toBe(0);
    expect(rows[1]?.commitLane).toBe(0);
    expect(rows.every((row) => row.lanes.length === 1)).toBe(true);
    expect(tipRevisionIds(historySnapshot().revisions)).toEqual(["rev-b"]);
  });

  it("assigns a second lane for a forked conflicted head", () => {
    const revisions = conflictedSnapshot().revisions;
    const rows = buildRevisionGraph(revisions);
    expect(tipRevisionIds(revisions).sort()).toEqual(["rev-b", "rev-c"]);
    expect(Math.max(...rows.map((row) => row.lanes.length))).toBeGreaterThan(1);
    const fork = rows.find((row) => row.revision.eventId === "rev-c");
    const main = rows.find((row) => row.revision.eventId === "rev-b");
    expect(fork?.commitLane).not.toBe(main?.commitLane);
    expect(rows.filter((row) => row.isTip)).toHaveLength(2);
  });

  it("attaches device HEAD badges to tip revisions", () => {
    const snapshot = conflictedSnapshot();
    const rows = buildRevisionGraph(snapshot.revisions, [
      ...snapshot.devices,
      {
        publicKey: "bb".repeat(32),
        alias: "Phone",
        revisionEventId: "rev-c",
        lastSeen: 1_700_000_200,
      },
    ]);
    expect(
      rows.find((row) => row.revision.eventId === "rev-c")?.deviceAliases,
    ).toContain("Phone");
  });

  it("keeps a fork parent lane through the split row", () => {
    const rows = buildRevisionGraph(divergedSnapshot().revisions);
    const expand = rows.find((row) => row.revision.eventId === "rev-laptop");
    expect(expand?.splitFromLane).toBe(0);
    expect(expand?.commitLane).toBe(1);
    expect(revisionGraphLaneStem(expand!, 0)).toEqual({
      y1: 0,
      y2: REVISION_GRAPH_ROW_HEIGHT,
    });
    expect(revisionGraphLaneStem(expand!, 1)).toEqual({
      y1: 0,
      y2: REVISION_GRAPH_ROW_HEIGHT / 2,
    });
  });

  it("records merge-from lanes for a two-parent revision", () => {
    const rows = buildRevisionGraph(mergedSnapshot().revisions);
    const merge = rows.find((row) => row.revision.eventId === "rev-merge");
    expect(merge?.mergeFromLanes.length).toBeGreaterThan(0);
    expect(Math.max(...rows.map((row) => row.lanes.length))).toBeGreaterThan(1);
  });
});
