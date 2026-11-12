import { describe, expect, it, vi } from "vitest";
import {
  canvasNoteFilename,
  convertCanvasTextToNote,
} from "./canvas-note-conversion";
import { parseJsonCanvas, type JsonCanvas } from "./json-canvas";

function fixture() {
  let document = parseJsonCanvas(
    JSON.stringify({
      metadata: "keep",
      nodes: [
        {
          id: "a",
          type: "text",
          text: "# Draft\n\n**Exact** body",
          x: 12,
          y: -4,
          width: 120,
          height: 80,
          extension: { keep: true },
        },
        {
          id: "b",
          type: "text",
          text: "Other",
          x: 400,
          y: 0,
          width: 100,
          height: 80,
        },
      ],
      edges: [{ id: "ab", fromNode: "a", toNode: "b", extension: true }],
    }),
  );
  let current = true;
  const apply = vi.fn((next: JsonCanvas) => {
    document = next;
  });
  return {
    get document() {
      return document;
    },
    stop() {
      current = false;
    },
    binding: {
      assertCurrent() {
        if (!current) throw new Error("Canvas changed");
      },
      read: () => document,
      flush: vi.fn(async () => {}),
      apply,
    },
  };
}
describe("text card conversion", () => {
  it("captures pending editor text only after the captured writer flushes", async () => {
    const f = fixture(),
      create = vi.fn(async () => "Latest.md");
    f.binding.flush.mockImplementationOnce(async () => {
      (f.document.nodes![0] as any).text = "Latest pending Markdown";
    });
    await convertCanvasTextToNote(f.binding, "a", create);
    expect(create).toHaveBeenCalledWith("Latest pending Markdown");
  });
  it("does not create a note after a failed source flush", async () => {
    const f = fixture(),
      create = vi.fn(async () => "Draft.md");
    f.binding.flush.mockRejectedValueOnce(new Error("Source conflict"));
    await expect(
      convertCanvasTextToNote(f.binding, "a", create),
    ).rejects.toThrow("Source conflict");
    expect(create).not.toHaveBeenCalled();
    expect(f.binding.apply).not.toHaveBeenCalled();
  });
  it("writes exact Markdown before replacing only the card's content kind", async () => {
    const f = fixture(),
      before = structuredClone(f.document),
      create = vi.fn(async () => "Notes/Draft.md");
    await convertCanvasTextToNote(f.binding, "a", create);
    expect(create).toHaveBeenCalledWith("# Draft\n\n**Exact** body");
    expect(f.document).toEqual({
      ...before,
      nodes: [
        {
          id: "a",
          type: "file",
          file: "Notes/Draft.md",
          x: 12,
          y: -4,
          width: 120,
          height: 80,
          extension: { keep: true },
        },
        before.nodes![1],
      ],
    });
  });
  it("retains the text card when vault creation fails", async () => {
    const f = fixture(),
      before = structuredClone(f.document);
    await expect(
      convertCanvasTextToNote(f.binding, "a", async () => {
        throw new Error("Disk full");
      }),
    ).rejects.toThrow("Disk full");
    expect(f.document).toEqual(before);
    expect(f.binding.apply).not.toHaveBeenCalled();
  });
  it("refuses stale completion after a board transition and retains the created note", async () => {
    const f = fixture(),
      before = structuredClone(f.document);
    await expect(
      convertCanvasTextToNote(f.binding, "a", async () => {
        f.stop();
        return "Draft.md";
      }),
    ).rejects.toThrow(/Draft.md.*retained/);
    expect(f.document).toEqual(before);
    expect(f.binding.apply).not.toHaveBeenCalled();
  });
  it("refuses to overwrite a card edited while note creation was pending", async () => {
    const f = fixture();
    await expect(
      convertCanvasTextToNote(f.binding, "a", async () => {
        (f.document.nodes![0] as any).text = "Newer text";
        return "Draft.md";
      }),
    ).rejects.toThrow(/retained/);
    expect((f.document.nodes![0] as any).text).toBe("Newer text");
    expect(f.binding.apply).not.toHaveBeenCalled();
  });
  it("rejects missing and non-text targets before creating a file", async () => {
    const f = fixture(),
      create = vi.fn(async () => "Draft.md");
    await expect(
      convertCanvasTextToNote(f.binding, "missing", create),
    ).rejects.toThrow(/text card/);
    expect(create).not.toHaveBeenCalled();
  });
  it("uses a portable Markdown filename without accepting path traversal", () => {
    expect(canvasNoteFilename(" Draft.MD ")).toBe("Draft.md");
    for (const name of [
      "",
      "../Draft",
      "A/B",
      "A\\B",
      ".",
      "..",
      "A: B",
      "A\nB",
    ])
      expect(() => canvasNoteFilename(name)).toThrow(/name/);
  });
});
