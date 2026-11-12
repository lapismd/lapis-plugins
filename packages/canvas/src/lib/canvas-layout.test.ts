import { expect, test } from "vitest";
import { arrangeCanvas, CANVAS_LAYOUT_ACTIONS, canvasLayoutRoots } from "./canvas-layout";
import { parseJsonCanvas, type JsonCanvas } from "./json-canvas";
const document = parseJsonCanvas(JSON.stringify({ metadata: { keep: true }, nodes: [
  { id: "a", type: "text", x: 0, y: 0, width: 120, height: 80, text: "A", extra: "retain" },
  { id: "b", type: "text", x: 260, y: 100, width: 200, height: 140, text: "B" },
  { id: "c", type: "text", x: 620, y: 240, width: 80, height: 60, text: "C" },
], edges: [{ id: "ab", fromNode: "a", toNode: "b", extra: true }] }));
const all = new Set(["a", "b", "c"]);
for (const [action] of CANVAS_LAYOUT_ACTIONS) test(`${action} preserves original geometry data, identities and extensions`, () => {
  const before = structuredClone(document);
  const next = arrangeCanvas(document, all, action);
  expect(document).toEqual(before);
  expect(JSON.parse(JSON.stringify(next)).metadata).toEqual({ keep: true });
  expect(next.nodes!.map((node) => node.id)).toEqual(["a", "b", "c"]);
  expect(JSON.parse(JSON.stringify(next)).nodes[0].extra).toBe("retain");
  expect(next.edges).toEqual(document.edges);
  for (const node of next.nodes!) {
    expect(Number.isInteger(node.x) && Number.isInteger(node.y)).toBe(true);
    expect(node.width > 0 && node.height > 0).toBe(true);
    if (action !== "width" && action !== "height") expect([node.width, node.height]).toEqual([before.nodes!.find((entry) => entry.id === node.id)!.width, before.nodes!.find((entry) => entry.id === node.id)!.height]);
  }
});

test("alignment uses selection bounds and leaves other cards untouched", () => {
  expect(arrangeCanvas(document, all, "left").nodes!.map((node) => node.x)).toEqual([0, 0, 0]);
  expect(arrangeCanvas(document, all, "right").nodes!.map((node) => node.x + node.width)).toEqual([700, 700, 700]);
  expect(arrangeCanvas(document, all, "center").nodes!.map((node) => node.x + node.width / 2)).toEqual([350, 350, 350]);
  expect(arrangeCanvas(document, all, "top").nodes!.map((node) => node.y)).toEqual([0, 0, 0]);
  expect(arrangeCanvas(document, all, "bottom").nodes!.map((node) => node.y + node.height)).toEqual([300, 300, 300]);
  expect(arrangeCanvas(document, all, "middle").nodes!.map((node) => node.y + node.height / 2)).toEqual([150, 150, 150]);
  expect(arrangeCanvas(document, new Set(["a", "b"]), "left").nodes![2]).toBe(document.nodes![2]);
});

test("distribution equalizes gaps and preserves both outside anchors", () => {
  const horizontal = arrangeCanvas(document, all, "distribute-x").nodes!;
  expect(horizontal.map((node) => node.x)).toEqual([0, 270, 620]);
  expect(horizontal[1]!.x - horizontal[0]!.x - horizontal[0]!.width).toBe(horizontal[2]!.x - horizontal[1]!.x - horizontal[1]!.width);
  expect(arrangeCanvas(document, all, "distribute-y").nodes!.map((node) => node.y)).toEqual([0, 90, 240]);
  expect(arrangeCanvas(document, new Set(["a", "b"]), "distribute-x")).toBe(document);
});

test("row, column, grid and size justification use actual imported dimensions", () => {
  const positions = (action: "row" | "column" | "grid") => arrangeCanvas(document, all, action).nodes!.map(({ x, y }) => [x, y]);
  expect(positions("row")).toEqual([[0, 0], [144, 0], [368, 0]]);
  expect(positions("column")).toEqual([[0, 0], [0, 104], [0, 268]]);
  expect(positions("grid")).toEqual([[0, 0], [144, 0], [0, 164]]);
  expect(arrangeCanvas(document, all, "width").nodes!.map((node) => node.width)).toEqual([200, 200, 200]);
  expect(arrangeCanvas(document, all, "height").nodes!.map((node) => node.height)).toEqual([140, 140, 140]);
});

test("a selected group moves its unselected descendants once and retains their sizes", () => {
  const grouped: JsonCanvas = { nodes: [
    { id: "g", type: "group", x: 100, y: 100, width: 400, height: 300, label: "Group" },
    { id: "inside", type: "text", x: 130, y: 160, width: 80, height: 60, text: "Inside" },
    { id: "outside", type: "text", x: 0, y: 0, width: 120, height: 80, text: "Outside" },
  ] };
  const selection = new Set(["g", "inside", "outside"]);
  expect(canvasLayoutRoots(grouped, selection).map((node) => node.id)).toEqual(["g", "outside"]);
  const next = arrangeCanvas(grouped, selection, "left");
  expect(next.nodes![0]!.x).toBe(0);
  expect(next.nodes![1]).toMatchObject({ x: 30, y: 160, width: 80, height: 60 });
  expect(next.nodes![2]).toEqual(grouped.nodes![2]);
});
