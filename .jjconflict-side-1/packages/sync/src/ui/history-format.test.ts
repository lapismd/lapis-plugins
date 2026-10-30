import { describe, expect, it } from "vitest";
import {
  revisionReasonLabel,
  revisionRowLabel,
  shortRevisionId,
} from "./history-format";

describe("history-format", () => {
  it("labels checkpoint revisions as snapshots", () => {
    expect(revisionReasonLabel("checkpoint")).toBe("Snapshot");
    expect(shortRevisionId("rev-laptop-2")).toBe("rev-lapt");
    expect(
      revisionRowLabel({
        eventId: "rev-laptop-2",
        parents: ["rev-laptop"],
        message: "Update README and plan",
        reason: "checkpoint",
        createdAt: 1_700_000_400,
        root: "root-laptop-2",
        author: "aa".repeat(32),
      }),
    ).toContain("Update README and plan");
  });
});
