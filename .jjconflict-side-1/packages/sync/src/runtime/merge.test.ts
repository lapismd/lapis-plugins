import { describe, expect, it } from "vitest";
import {
  createMergeDraft,
  deterministicKeepBothPath,
  findSingleLowestCommonAncestor,
  materialiseMergeDraft,
} from "./merge";

const text = (value: string) => new TextEncoder().encode(value);
const decode = (value: Uint8Array) => new TextDecoder().decode(value);

describe("three-way merge planning", () => {
  it("auto-resolves one-sided and identical edits", () => {
    const draft = createMergeDraft({
      baseRevisionId: "A",
      leftRevisionId: "B",
      rightRevisionId: "C",
      base: { "a.md": text("base"), "same.md": text("base") },
      left: { "a.md": text("left"), "same.md": text("same") },
      right: { "a.md": text("base"), "same.md": text("same") },
      contentGenerations: {},
    });
    expect(draft.conflicts).toHaveLength(0);
    const result = materialiseMergeDraft(draft, (path) => path);
    expect(decode(result["a.md"]!)).toBe("left");
    expect(decode(result["same.md"]!)).toBe("same");
  });

  it("requires explicit choices for text, delete/edit, and binary conflicts", () => {
    const draft = createMergeDraft({
      baseRevisionId: "A",
      leftRevisionId: "B",
      rightRevisionId: "C",
      base: {
        "a.md": text("base"),
        "delete.md": text("base"),
        bin: new Uint8Array([0, 1]),
      },
      left: {
        "a.md": text("left"),
        "delete.md": text("edited"),
        bin: new Uint8Array([0, 2]),
      },
      right: { "a.md": text("right"), bin: new Uint8Array([0, 3]) },
      contentGenerations: {},
    });
    expect(draft.conflicts.map((conflict) => conflict.kind).sort()).toEqual([
      "binary-change",
      "delete-edit",
      "text-conflict",
    ]);
  });

  it("coalesces divergent renames by stable file identity", () => {
    const draft = createMergeDraft({
      baseRevisionId: "A",
      leftRevisionId: "B",
      rightRevisionId: "C",
      base: { "notes/original.md": text("base") },
      left: { "notes/local-name.md": text("local edit") },
      right: { "notes/remote-name.md": text("remote edit") },
      baseFileIds: { "notes/original.md": "stable-file" },
      leftFileIds: { "notes/local-name.md": "stable-file" },
      rightFileIds: { "notes/remote-name.md": "stable-file" },
      contentGenerations: {},
    });
    expect(draft.conflicts).toMatchObject([
      {
        path: "notes/original.md",
        kind: "divergent-rename",
        basePath: "notes/original.md",
        leftPath: "notes/local-name.md",
        rightPath: "notes/remote-name.md",
      },
    ]);
    draft.resolutions[draft.conflicts[0]!.id] = { choice: "right" };
    const result = materialiseMergeDraft(draft, (path) => path);
    expect(Object.keys(result)).toEqual(["notes/remote-name.md"]);
    expect(decode(result["notes/remote-name.md"]!)).toBe("remote edit");
  });

  it("fails closed on criss-cross merge bases", () => {
    const graph: Record<string, string[]> = {
      A: [],
      B: ["A"],
      C: ["A"],
      D: ["B", "C"],
      E: ["C", "B"],
    };
    expect(() =>
      findSingleLowestCommonAncestor("D", "E", (id) => graph[id] ?? []),
    ).toThrow("multiple incomparable merge bases");
  });

  it("creates deterministic keep-both names with collision suffixes", () => {
    const first = deterministicKeepBothPath(
      "notes/a.md",
      "Phone",
      "abcdef123456",
      new Set(),
    );
    expect(first).toBe("notes/a (Phone-abcdef12).md");
    expect(
      deterministicKeepBothPath(
        "notes/a.md",
        "Phone",
        "abcdef123456",
        new Set([first]),
      ),
    ).toBe("notes/a (Phone-abcdef12-2).md");
  });
});
