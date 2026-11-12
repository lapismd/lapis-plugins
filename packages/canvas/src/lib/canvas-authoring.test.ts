import { expect, test } from "vitest";
import { CanvasHistory } from "./canvas-history";
import { canvasMutationGroup, createCanvasCard, pasteCanvas, selectedCanvas } from "./canvas-authoring";
import type { JsonCanvas } from "./json-canvas";

const board = (): JsonCanvas => ({ nodes: [
  { id: "a", type: "text", text: "A", x: 0, y: 0, width: 80, height: 60 },
  { id: "b", type: "text", text: "B", x: 100, y: 0, width: 80, height: 60 },
  { id: "c", type: "group", label: "Outside", x: 400, y: 0, width: 200, height: 100 },
], edges: [{ id: "internal", fromNode: "a", toNode: "b" }, { id: "external", fromNode: "b", toNode: "c" }] });

test("all card kinds have complete integer JSON Canvas fields", () => {
  for (const kind of ["text", "file", "link", "group"] as const) {
    const card = createCanvasCard(kind, { x: 1.5, y: -2.5 }, "Content");
    expect(card).toMatchObject({ type: kind, x: 2, y: -2 });
    expect(card.id).toBeTruthy();
    expect(card.width).toBeGreaterThan(0);
  }
});

test("clipboard copies only internal connectors and pastes fresh remapped identities", () => {
  const document = board();
  Object.assign(document.nodes![0], { extension: { keep: true } });
  Object.assign(document.edges![0], { extension: "edge" });
  const copied = selectedCanvas(document, new Set(["a", "b"]));
  expect(copied.edges?.map(({ id }) => id)).toEqual(["internal"]);
  const pasted = pasteCanvas(document, JSON.stringify(copied));
  const added = pasted.document.nodes!.slice(3);
  expect(pasted.ids.size).toBe(2);
  expect(added[0]).toMatchObject({ x: 40, y: 40, width: 80, height: 60, extension: { keep: true } });
  const edge = pasted.document.edges!.at(-1)!;
  expect(edge).toMatchObject({ fromNode: added[0].id, toNode: added[1].id, extension: "edge" });
  expect(edge.id).not.toBe("internal");
});

test("malformed clipboard data cannot change the current board", () => {
  const document = board();
  expect(() => pasteCanvas(document, '{"nodes":[{"id":"broken"}]}')).toThrow();
  expect(document.nodes).toHaveLength(3);
});

test("history coalesces one gesture and preserves redo until a new edit", () => {
  const history = new CanvasHistory(() => {});
  history.reset("initial");
  history.record("drag frame 1", "gesture:1");
  history.record("drag frame 2", "gesture:1");
  expect(history.undo()).toBe("initial");
  expect(history.redo()).toBe("drag frame 2");
  history.record("new card");
  expect(history.undo()).toBe("drag frame 2");
  history.record("different card");
  expect(history.canRedo).toBe(false);
});

test("separate completed text sessions and independent mutations have separate history groups", () => {
  const before = board();
  const after = structuredClone(before);
  after.nodes![0] = { ...after.nodes![0], type: "text", text: "Edited" };
  expect(canvasMutationGroup(before, after, () => 1, 1)).toBe("text:a:1");
  expect(canvasMutationGroup(before, after, () => 2, 1)).toBe("text:a:2");
  after.nodes![0].color = "4";
  expect(canvasMutationGroup(before, after, () => 1, 1)).toBeUndefined();
});

test("bounded history drops old entries without changing the current document", () => {
  const history = new CanvasHistory(() => {}, 2);
  history.reset("a"); history.record("b"); history.record("c"); history.record("d");
  expect(history.undo()).toBe("c"); expect(history.undo()).toBe("b"); expect(history.undo()).toBeNull();
  expect(history.redo()).toBe("c"); expect(history.redo()).toBe("d");
});

test("one geometry gesture coalesces all moved group members and resized cards", () => {
  const before = board();
  const after = structuredClone(before);
  after.nodes![0].x += 20; after.nodes![1].x += 20;
  expect(canvasMutationGroup(before, after, () => 1, 4)).toBe("geometry:4");
  after.nodes![0].width += 40;
  expect(canvasMutationGroup(before, after, () => 1, 4)).toBe("geometry:4");
});

test("URI lists ignore comments and unsafe schemes while resolving only existing vault paths", async () => {
  const { canvasDropTargets } = await import("./canvas-authoring");
  expect(canvasDropTargets("# comment\nhttps://example.com/canvas\njavascript:alert(1)\nNote.md\ndata:text/html,unsafe", (path) => path === "Note.md", true))
    .toEqual([{ type: "link", value: "https://example.com/canvas" }, { type: "file", value: "Note.md" }]);
  expect(canvasDropTargets("# Private note.md", (path) => path === "# Private note.md"))
    .toEqual([{ type: "file", value: "# Private note.md" }]);
});

test("copying a group includes its contained cards and internal connectors", () => {
  const document = board();
  Object.assign(document.nodes![2], { x: -20, y: -20, width: 300, height: 200 });
  document.nodes!.push({ id: "outside", type: "text", text: "Outside", x: 700, y: 0, width: 100, height: 100 });
  document.edges!.push({ id: "outbound", fromNode: "b", toNode: "outside" });
  const selected = new Set(["c"]);
  const copied = selectedCanvas(document, selected);
  expect(copied.nodes?.map(({ id }) => id)).toEqual(["a", "b", "c"]);
  expect(copied.edges?.some(({ id }) => id === "outbound")).toBe(false);
  expect([...selected]).toEqual(["c"]);
});
