import { describe, expect, it, vi } from "vitest";
import type { RevisionView } from "../presentation/types";
import {
  changeSetFromSnapshots,
  changeSetsForPath,
  fileChangeAtPath,
  fileChangeFromTexts,
  filterRevisionsForPath,
  loadRevisionChangeSets,
} from "./snapshot-changes";

function revision(
  eventId: string,
  parents: string[],
  root = eventId,
): RevisionView {
  return {
    eventId,
    parents,
    message: eventId,
    reason: "checkpoint",
    createdAt: 1_700_000_000,
    root,
    author: "aa".repeat(32),
  };
}

describe("snapshot-changes", () => {
  it("counts added and removed lines from a unified diff", () => {
    const change = fileChangeFromTexts(
      "README.md",
      "# Vault\n",
      "# Vault\n\nLaptop edits.\n",
    );
    expect(change.additions).toBeGreaterThan(0);
    expect(change.deletions).toBe(0);
    expect(change.oldText).toBe("# Vault\n");
    expect(change.newText).toBe("# Vault\n\nLaptop edits.\n");
  });

  it("diffs a revision snapshot against its parent", () => {
    const changeSet = changeSetFromSnapshots(
      "rev-2",
      { "README.md": "hello from laptop\n", "notes.md": "# Notes\n" },
      { "README.md": "hello\n" },
    );
    expect(changeSet.revisionId).toBe("rev-2");
    expect(changeSet.files.map((file) => file.path)).toEqual([
      "README.md",
      "notes.md",
    ]);
    expect(fileChangeAtPath(changeSet.files, "notes.md")?.oldText).toBe("");
    expect(fileChangeAtPath(changeSet.files, "README.md")?.newText).toBe(
      "hello from laptop\n",
    );
  });

  it("omits unchanged paths and treats missing current files as deletions", () => {
    const changeSet = changeSetFromSnapshots(
      "rev-3",
      { "keep.md": "same\n" },
      { "keep.md": "same\n", "gone.md": "bye\n" },
    );
    expect(changeSet.files).toHaveLength(1);
    expect(changeSet.files[0]?.path).toBe("gone.md");
    expect(changeSet.files[0]?.newText).toBe("");
  });

  it("loads change sets from a revision file reader and reuses shared roots", async () => {
    const filesAtRevision = vi.fn(async (eventId: string) => {
      if (eventId === "rev-root") return { "README.md": "hello\n" };
      if (eventId === "rev-child") {
        return { "README.md": "hello\n", "notes.md": "# Notes\n" };
      }
      return {};
    });
    const changeSets = await loadRevisionChangeSets({ filesAtRevision }, [
      revision("rev-child", ["rev-root"], "root-child"),
      revision("rev-root", [], "root-root"),
    ]);
    expect(filesAtRevision).toHaveBeenCalledTimes(2);
    expect(changeSets[0]?.files.map((file) => file.path)).toEqual(["notes.md"]);
    expect(changeSets[1]?.files.map((file) => file.path)).toEqual([
      "README.md",
    ]);
  });

  it("filters revisions to those that changed a path and rewires parents", () => {
    const revisions = [
      revision("rev-phone", ["rev-notes"]),
      revision("rev-notes", ["rev-root"]),
      revision("rev-root", []),
    ];
    const changeSets = [
      changeSetFromSnapshots(
        "rev-phone",
        { "README.md": "phone\n", "notes.md": "# Notes\n" },
        { "README.md": "hello\n", "notes.md": "# Notes\n" },
      ),
      changeSetFromSnapshots(
        "rev-notes",
        { "README.md": "hello\n", "notes.md": "# Notes\n" },
        { "README.md": "hello\n" },
      ),
      changeSetFromSnapshots("rev-root", { "README.md": "hello\n" }),
    ];

    const filtered = filterRevisionsForPath(revisions, changeSets, "README.md");
    expect(filtered.map((revision) => revision.eventId)).toEqual([
      "rev-phone",
      "rev-root",
    ]);
    expect(filtered[0]?.parents).toEqual(["rev-root"]);
    expect(
      changeSetsForPath(changeSets, "README.md").map(
        (entry) => entry.revisionId,
      ),
    ).toEqual(["rev-phone", "rev-root"]);
  });
});
