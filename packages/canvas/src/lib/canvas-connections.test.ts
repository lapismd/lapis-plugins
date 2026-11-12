import { expect, test } from "vitest";
import { parseJsonCanvas } from "./json-canvas";
import { connectCanvasCard, reconnectCanvasEdge } from "./canvas-connections";

const document = () => parseJsonCanvas(JSON.stringify({ metadata: "keep", nodes: [
  { id: "a", type: "text", text: "A", x: 0, y: 0, width: 80, height: 60 },
  { id: "b", type: "text", text: "B", x: 300, y: 0, width: 120, height: 100 },
  { id: "c", type: "text", text: "C", x: 600, y: 0, width: 180, height: 120 },
], edges: [{ id: "ab", fromNode: "a", fromSide: "right", toNode: "b", toSide: "left", label: "keep", fromEnd: "arrow", color: "4", extension: true }] }));
test.each(["from", "to"] as const)("reconnecting %s retains imported connector fields and the original document", (end) => {
  const input = document(), raw = JSON.stringify(input);
  const next = reconnectCanvasEdge(input, "ab", end, "c", "top");
  expect(next.edges![0]).toEqual({ ...input.edges![0], [`${end}Node`]: "c", [`${end}Side`]: "top" });
  expect(next.nodes).toBe(input.nodes); expect(JSON.stringify(input)).toBe(raw);
});
test("a missing connector or destination cannot delete or redirect existing content", () => {
  expect(() => reconnectCanvasEdge(document(), "absent", "to", "c", "top")).toThrow("no longer available");
  expect(() => reconnectCanvasEdge(document(), "ab", "to", "absent", "top")).toThrow("no longer available");
});
test.each(["source", "target"] as const)("a new card from a %s handle retains direction and creates fresh identities", (type) => {
  const input = document(), raw = JSON.stringify(input);
  const result = connectCanvasCard(input, { nodeId: "a", side: "bottom", type }, { x: 500.3, y: 420.8 });
  const card = result.document.nodes!.at(-1)!, edge = result.document.edges!.at(-1)!;
  expect(card).toMatchObject({ type: "text", text: "", x: 500, y: 421 });
  expect(input.nodes!.some((node) => node.id === card.id)).toBe(false);
  expect(edge.id).not.toBe("ab");
  expect(type === "source" ? edge.fromNode : edge.toNode).toBe("a");
  expect(type === "source" ? edge.toNode : edge.fromNode).toBe(card.id);
  expect(type === "source" ? edge.fromSide : edge.toSide).toBe("bottom");
  expect(result.document.edges![0]).toEqual(input.edges![0]);
  expect(JSON.stringify(input)).toBe(raw);
});
