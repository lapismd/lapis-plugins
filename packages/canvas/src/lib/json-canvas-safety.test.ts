import { describe, expect, test } from "vitest";
import {
  parseJsonCanvas,
  serializeFlowDocument,
  stringifyJsonCanvas,
  toFlowDocument,
  type JsonCanvas,
} from "./json-canvas";

const card = {
  id: "note",
  type: "text" as const,
  x: -20,
  y: 10,
  width: 80,
  height: 60,
  text: "Small imported card",
};

describe("JSON Canvas file safety", () => {
  test("persists public resize dimensions instead of the original presentation style", () => {
    const input = { nodes: [{ ...card, extension: "keep" }] };
    const flow = toFlowDocument(input);
    flow.nodes[0].width = 285;
    flow.nodes[0].height = 165;
    expect(serializeFlowDocument(flow.nodes, flow.edges, input).nodes?.[0]).toEqual({ ...input.nodes[0], width: 285, height: 165 });
  });
  test("preserves imported dimensions smaller than the editor resize minimum", () => {
    const input = { nodes: [{ ...card, width: 12, height: 8 }] };
    const flow = toFlowDocument(input);
    expect(serializeFlowDocument(flow.nodes, flow.edges).nodes).toEqual(input.nodes);
  });

  test("renders the default target arrow without changing omitted endpoint fields", () => {
    const flow = toFlowDocument({
      nodes: [card, { ...card, id: "other", x: 200 }],
      edges: [{ id: "edge", fromNode: "note", toNode: "other" }],
    });
    expect(flow.edges[0].markerStart).toBeUndefined();
    expect(flow.edges[0].markerEnd).toMatchObject({ type: "arrowclosed" });
    expect(serializeFlowDocument(flow.nodes, flow.edges).edges?.[0].toEnd).toBeUndefined();
  });

  test("preserves extension fields when an ordinary card is edited", () => {
    const input = parseJsonCanvas(JSON.stringify({
      version: "1.0",
      metadata: { owner: "vault", nested: [1, 2] },
      nodes: [{ ...card, custom: { collapsed: true } }, { ...card, id: "other" }],
      edges: [{ id: "edge", fromNode: "note", toNode: "other", custom: "kept" }],
    }));
    const flow = toFlowDocument(input);
    flow.nodes[0].data.text = "Changed";
    const output = JSON.parse(stringifyJsonCanvas(serializeFlowDocument(flow.nodes, flow.edges, input)));
    expect(output).toEqual({
      ...input,
      nodes: [{ ...input.nodes![0], text: "Changed" }, input.nodes![1]],
    });
  });

  test("retains the specified stacking order including overlapping groups", () => {
    const input: JsonCanvas = {
      nodes: [card, { ...card, id: "group", type: "group", label: "Above" }],
    };
    const flow = toFlowDocument(input);
    expect(flow.nodes[1].zIndex).toBeGreaterThan(flow.nodes[0].zIndex!);
    expect(serializeFlowDocument(flow.nodes, flow.edges).nodes?.map((node) => node.id))
      .toEqual(["note", "group"]);
  });

  test("does not resurrect deleted entities from extension snapshots", () => {
    const input = parseJsonCanvas(JSON.stringify({
      metadata: "kept",
      nodes: [card, { ...card, id: "other" }],
      edges: [{ id: "edge", fromNode: "note", toNode: "other" }],
    }));
    const flow = toFlowDocument(input);
    const output = serializeFlowDocument([flow.nodes[0]], [], input);
    expect(output.nodes?.map((node) => node.id)).toEqual(["note"]);
    expect(output.edges).toEqual([]);
    expect(JSON.parse(stringifyJsonCanvas(output)).metadata).toBe("kept");
  });

  test.each(["none", "arrow"] as const)("honours an explicit target endpoint: %s", (toEnd) => {
    const flow = toFlowDocument({
      nodes: [card],
      edges: [{ id: "self", fromNode: "note", toNode: "note", toEnd }],
    });
    expect(Boolean(flow.edges[0].markerEnd)).toBe(toEnd === "arrow");
    expect(serializeFlowDocument(flow.nodes, flow.edges).edges?.[0].toEnd).toBe(toEnd);
  });

  test.each([
    "[]", "null", "42", '{"nodes":{}}', '{"edges":true}',
    JSON.stringify({ nodes: [{ ...card, width: -1 }] }),
    JSON.stringify({ nodes: [{ ...card, x: 0.5 }] }),
    JSON.stringify({ nodes: [{ ...card, type: "unknown" }] }),
    JSON.stringify({ nodes: [{ ...card, text: null }] }),
    JSON.stringify({ nodes: [card, card] }),
    JSON.stringify({ nodes: [card], edges: [{ id: "e", fromNode: "note", toNode: "missing" }] }),
    JSON.stringify({ nodes: [card], edges: [{ id: "e", fromNode: "note", toNode: "note", toSide: "middle" }] }),
    JSON.stringify({ nodes: [card], edges: [{ id: "e", fromNode: "note", toNode: "note", toEnd: "circle" }] }),
  ])("rejects malformed documents without producing a writable board: %s", (raw) => {
    expect(() => parseJsonCanvas(raw)).toThrow(/Canvas/);
  });

  test("accepts empty documents and optional collections", () => {
    expect(parseJsonCanvas("")).toEqual({});
    expect(parseJsonCanvas("{}")).toEqual({});
    expect(parseJsonCanvas(JSON.stringify({ nodes: [card] })).nodes).toEqual([card]);
  });
});
