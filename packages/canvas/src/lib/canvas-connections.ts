import { createCanvasCard } from "./canvas-authoring";
import type { CanvasEdge, EdgeSide, JsonCanvas } from "./json-canvas";

export function reconnectCanvasEdge(document: JsonCanvas, id: string, end: "from" | "to", nodeId: string, side: EdgeSide): JsonCanvas {
  if (!document.edges?.some((edge) => edge.id === id) || !document.nodes?.some((node) => node.id === nodeId)) throw new Error("The connector or card is no longer available.");
  return { ...document, edges: document.edges.map((edge) => edge.id === id ? { ...edge, [`${end}Node`]: nodeId, [`${end}Side`]: side } : edge) };
}

export type CanvasConnectionOrigin = { nodeId: string; side: EdgeSide; type: "source" | "target" };
export function connectCanvasCard(document: JsonCanvas, origin: CanvasConnectionOrigin, point: { x: number; y: number }): { document: JsonCanvas; id: string } {
  if (!document.nodes?.some((node) => node.id === origin.nodeId)) throw new Error("The starting card is no longer available.");
  const card = createCanvasCard("text", point);
  const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
  const edge: CanvasEdge = origin.type === "source"
    ? { id: crypto.randomUUID(), fromNode: origin.nodeId, fromSide: origin.side, toNode: card.id, toSide: opposite[origin.side] }
    : { id: crypto.randomUUID(), fromNode: card.id, fromSide: opposite[origin.side], toNode: origin.nodeId, toSide: origin.side };
  return { id: card.id, document: { ...document, nodes: [...(document.nodes ?? []), card], edges: [...(document.edges ?? []), edge] } };
}
