import { describe, expect, test } from "vitest";
import {
  CanvasFlowEdgeType,
  createFlowEdge,
  createFlowNode,
  createNodeStyle,
  parseNodeSize,
  resolveCanvasColor,
  serializeFlowDocument,
  stringifyJsonCanvas,
  toFlowDocument,
  type JsonCanvas,
} from "./json-canvas";

describe("json-canvas bridge", () => {
  test("round-trips a mixed canvas document", () => {
    const input: JsonCanvas = {
      nodes: [
        {
          id: "text-1",
          type: "text",
          x: 40,
          y: 60,
          width: 280,
          height: 180,
          color: "3",
          text: "Hello world",
        },
        {
          id: "file-1",
          type: "file",
          x: 380,
          y: 80,
          width: 260,
          height: 160,
          file: "Notes/Reference.md",
          subpath: "#Heading",
        },
        {
          id: "link-1",
          type: "link",
          x: 700,
          y: 120,
          width: 260,
          height: 160,
          url: "https://example.com",
        },
        {
          id: "group-1",
          type: "group",
          x: 20,
          y: 20,
          width: 980,
          height: 420,
          label: "Workspace",
        },
      ],
      edges: [
        {
          id: "edge-1",
          fromNode: "text-1",
          fromSide: "right",
          fromEnd: "arrow",
          toNode: "file-1",
          toSide: "left",
          toEnd: "arrow",
          color: "5",
          label: "reference",
        },
      ],
    };

    const flow = toFlowDocument(input);
    const output = serializeFlowDocument(flow.nodes, flow.edges);

    expect(output).toEqual({
      nodes: input.nodes,
      edges: input.edges,
    });
  });

  test("parses width and height from flow style strings", () => {
    expect(parseNodeSize(createNodeStyle(320, 210))).toEqual({
      width: 320,
      height: 210,
    });
  });

  test("creates editable flow nodes and edges", () => {
    const textNode = createFlowNode("text", { x: 20, y: 30 }, "Draft");
    const groupNode = createFlowNode("group", { x: 100, y: 200 }, "Area");
    const edge = createFlowEdge({
      source: textNode.id,
      sourceHandle: "right-source",
      target: groupNode.id,
      targetHandle: "left-target",
    });

    expect(textNode.data.kind).toBe("text");
    expect(groupNode.data.kind).toBe("group");
    expect(edge).toMatchObject({
      source: textNode.id,
      target: groupNode.id,
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: CanvasFlowEdgeType,
      markerEnd: {
        type: "arrowclosed",
      },
    });
  });

  test("normalizes serialized canvas output", () => {
    expect(stringifyJsonCanvas({})).toBe(`{\n  "nodes": [],\n  "edges": []\n}`);
  });

  test("assigns lower z-index to group nodes", () => {
    const groupNode = createFlowNode("group", { x: 0, y: 0 }, "Area");
    const textNode = createFlowNode("text", { x: 10, y: 10 }, "Note");

    expect(groupNode.zIndex).toBeLessThan(textNode.zIndex ?? 0);
  });

  test("resolves preset and literal canvas colors", () => {
    expect(resolveCanvasColor("4")).toBe(
      "rgb(var(--canvas-color-4, 68, 207, 110))",
    );
    expect(resolveCanvasColor("#123456")).toBe("#123456");
    expect(resolveCanvasColor(undefined)).toBeUndefined();
  });

  test("keeps directional markers visible when no edge color is set", () => {
    const edge = createFlowEdge({
      source: "left",
      sourceHandle: "right-source",
      target: "right",
      targetHandle: "left-target",
    });

    if (!edge) {
      throw new Error("Expected flow edge to be created");
    }

    expect(edge.style).toBeUndefined();
    expect(edge.markerEnd).toMatchObject({
      type: "arrowclosed",
      color: "var(--xy-edge-stroke-default, var(--text-muted))",
    });
  });

  test("maps json canvas arrows and edge colors into flow markers", () => {
    const flow = toFlowDocument({
      nodes: [
        {
          id: "left",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 120,
          text: "Left",
        },
        {
          id: "right",
          type: "text",
          x: 320,
          y: 0,
          width: 200,
          height: 120,
          text: "Right",
        },
      ],
      edges: [
        {
          id: "edge-1",
          fromNode: "left",
          fromSide: "right",
          fromEnd: "arrow",
          toNode: "right",
          toSide: "left",
          toEnd: "arrow",
          color: "5",
        },
      ],
    });

    expect(flow.edges[0]).toMatchObject({
      style:
        "stroke: rgb(var(--canvas-color-5, 83, 223, 221)); stroke-width: 2px",
      type: CanvasFlowEdgeType,
      markerStart: {
        type: "arrowclosed",
        color: "rgb(var(--canvas-color-5, 83, 223, 221))",
      },
      markerEnd: {
        type: "arrowclosed",
        color: "rgb(var(--canvas-color-5, 83, 223, 221))",
      },
      data: {
        resolvedColor: "rgb(var(--canvas-color-5, 83, 223, 221))",
      },
    });
  });
});
