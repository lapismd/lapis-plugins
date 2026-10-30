import type { Edge, EdgeMarkerType, Node } from "@xyflow/svelte";

export type CanvasColor = string;
export type NodeType = "text" | "file" | "link" | "group";
export type EdgeSide = "top" | "right" | "bottom" | "left";
export type EdgeEnd = "none" | "arrow";

const DEFAULT_EDGE_COLOR = "var(--xy-edge-stroke-default, var(--text-muted))";
const ARROW_CLOSED_MARKER_TYPE = "arrowclosed" as const;

export interface GenericNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
}

export interface TextNode extends GenericNode {
  type: "text";
  text: string;
}

export interface FileNode extends GenericNode {
  type: "file";
  file: string;
  subpath?: string;
}

export interface LinkNode extends GenericNode {
  type: "link";
  url: string;
}

export interface GroupNode extends GenericNode {
  type: "group";
  label?: string;
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
}

export type CanvasNode = TextNode | FileNode | LinkNode | GroupNode;

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: EdgeSide;
  fromEnd?: EdgeEnd;
  toNode: string;
  toSide?: EdgeSide;
  toEnd?: EdgeEnd;
  color?: CanvasColor;
  label?: string;
}

export interface JsonCanvas {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}

export type CanvasEmbedFileContent = {
  value: string;
  sourcePath?: string;
};

export type CanvasEmbedFileContents = Record<
  string,
  string | CanvasEmbedFileContent
>;

export type CanvasSummary = {
  nodeCount: number;
  edgeCount: number;
  textCount: number;
  fileCount: number;
  linkCount: number;
  groupCount: number;
};

export const CanvasFlowNodeType = "canvas-node";
export const CanvasFlowEdgeType = "canvas-edge";
export const DEFAULT_NODE_WIDTH = 260;
export const DEFAULT_NODE_HEIGHT = 160;
export const DEFAULT_GROUP_WIDTH = 320;
export const DEFAULT_GROUP_HEIGHT = 220;
export const MIN_NODE_WIDTH = 80;
export const MIN_NODE_HEIGHT = 60;
export const MIN_GROUP_WIDTH = 140;
export const MIN_GROUP_HEIGHT = 100;

export const PRESET_COLORS: Record<string, string> = {
  "1": "rgb(var(--canvas-color-1, 251, 70, 76))",
  "2": "rgb(var(--canvas-color-2, 233, 151, 63))",
  "3": "rgb(var(--canvas-color-3, 224, 222, 113))",
  "4": "rgb(var(--canvas-color-4, 68, 207, 110))",
  "5": "rgb(var(--canvas-color-5, 83, 223, 221))",
  "6": "rgb(var(--canvas-color-6, 168, 130, 255))",
};

export type FlowNodeData = {
  kind: NodeType;
  text?: string;
  file?: string;
  subpath?: string;
  previewValue?: string;
  previewSourcePath?: string;
  url?: string;
  label?: string;
  color?: CanvasColor;
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
};

export type FlowEdgeData = {
  fromEnd?: EdgeEnd;
  toEnd?: EdgeEnd;
  color?: CanvasColor;
  resolvedColor?: string;
};

export type FlowCanvasNode = Node<FlowNodeData>;
export type FlowCanvasEdge = Edge<FlowEdgeData>;

export function createEmptyCanvas(): JsonCanvas {
  return { nodes: [], edges: [] };
}

export function parseJsonCanvas(rawJson: string): JsonCanvas {
  const parsed = rawJson.trim() ? JSON.parse(rawJson) : {};
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Canvas file must contain a JSON object.");
  }
  return parsed as JsonCanvas;
}

export function stringifyJsonCanvas(canvas: JsonCanvas): string {
  return JSON.stringify(normalizeCanvas(canvas), null, 2);
}

export function normalizeCanvas(canvas: JsonCanvas): JsonCanvas {
  return {
    nodes: [...(canvas.nodes ?? [])],
    edges: [...(canvas.edges ?? [])],
  };
}

export function summarizeCanvas(canvas: JsonCanvas): CanvasSummary {
  const nodes = canvas.nodes ?? [];
  return {
    nodeCount: nodes.length,
    edgeCount: (canvas.edges ?? []).length,
    textCount: nodes.filter((node) => node.type === "text").length,
    fileCount: nodes.filter((node) => node.type === "file").length,
    linkCount: nodes.filter((node) => node.type === "link").length,
    groupCount: nodes.filter((node) => node.type === "group").length,
  };
}

export function toFlowDocument(canvas: JsonCanvas): {
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
} {
  const nodes = (canvas.nodes ?? []).map<FlowCanvasNode>((node) => ({
    id: node.id,
    type: CanvasFlowNodeType,
    position: { x: node.x, y: node.y },
    data: toFlowNodeData(node),
    style: createNodeStyle(node.width, node.height),
    zIndex: node.type === "group" ? 0 : 1,
    sourcePosition: undefined,
    targetPosition: undefined,
  }));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = (canvas.edges ?? [])
    .filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode))
    .map<FlowCanvasEdge>((edge) => {
      const edgePresentation = createFlowEdgePresentation({
        fromEnd: edge.fromEnd,
        toEnd: edge.toEnd,
        color: edge.color,
      });

      return {
        id: edge.id,
        source: edge.fromNode,
        sourceHandle: edge.fromSide
          ? toSourceHandleId(edge.fromSide)
          : undefined,
        target: edge.toNode,
        targetHandle: edge.toSide ? toTargetHandleId(edge.toSide) : undefined,
        label: edge.label,
        ...edgePresentation,
      };
    });

  return { nodes, edges };
}

export function serializeFlowDocument(
  nodes: FlowCanvasNode[],
  edges: FlowCanvasEdge[],
): JsonCanvas {
  const canvasNodes = nodes.map<CanvasNode>((node) => {
    const size = parseNodeSize(node.style);
    const common = {
      id: node.id,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      width: size.width,
      height: size.height,
      color: node.data.color,
    };

    switch (node.data.kind) {
      case "file":
        return {
          ...common,
          type: "file",
          file: node.data.file ?? "",
          subpath: node.data.subpath || undefined,
        };
      case "link":
        return {
          ...common,
          type: "link",
          url: node.data.url ?? "",
        };
      case "group":
        return {
          ...common,
          type: "group",
          label: node.data.label || undefined,
          background: node.data.background || undefined,
          backgroundStyle: node.data.backgroundStyle,
        };
      case "text":
      default:
        return {
          ...common,
          type: "text",
          text: node.data.text ?? "",
        };
    }
  });

  const canvasEdges = edges
    .filter((edge) => edge.source && edge.target)
    .map<CanvasEdge>((edge) => ({
      id: edge.id,
      fromNode: edge.source,
      fromSide: toHandleId(edge.sourceHandle),
      fromEnd: edge.data?.fromEnd,
      toNode: edge.target,
      toSide: toHandleId(edge.targetHandle),
      toEnd: edge.data?.toEnd,
      color: edge.data?.color,
      label: typeof edge.label === "string" ? edge.label : undefined,
    }));

  return {
    nodes: canvasNodes,
    edges: canvasEdges,
  };
}

export function createFlowNode(
  kind: NodeType,
  position: { x: number; y: number },
  value?: string,
): FlowCanvasNode {
  const width = kind === "group" ? DEFAULT_GROUP_WIDTH : DEFAULT_NODE_WIDTH;
  const height = kind === "group" ? DEFAULT_GROUP_HEIGHT : DEFAULT_NODE_HEIGHT;

  return {
    id: crypto.randomUUID(),
    type: CanvasFlowNodeType,
    position,
    data: createFlowNodeData(kind, value),
    style: createNodeStyle(width, height),
    zIndex: kind === "group" ? 0 : 1,
  };
}

export function createFlowEdge(connection: {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}): FlowCanvasEdge | null {
  if (!connection.source || !connection.target) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    source: connection.source,
    sourceHandle: connection.sourceHandle ?? undefined,
    target: connection.target,
    targetHandle: connection.targetHandle ?? undefined,
    ...createFlowEdgePresentation({
      fromEnd: "none",
      toEnd: "arrow",
    }),
  };
}

export function createFlowEdgePresentation(options: {
  fromEnd?: EdgeEnd;
  toEnd?: EdgeEnd;
  color?: CanvasColor;
}): Pick<
  FlowCanvasEdge,
  "type" | "style" | "markerStart" | "markerEnd" | "data"
> {
  const resolvedColor = resolveCanvasColor(options.color);

  return {
    type: CanvasFlowEdgeType,
    style: createEdgeStyle(resolvedColor),
    markerStart: createEdgeMarker(options.fromEnd, resolvedColor),
    markerEnd: createEdgeMarker(options.toEnd, resolvedColor),
    data: {
      fromEnd: options.fromEnd,
      toEnd: options.toEnd,
      color: options.color,
      resolvedColor,
    },
  };
}

export function createNodeStyle(width: number, height: number): string {
  return [
    `width: ${Math.max(width, 120)}px`,
    `height: ${Math.max(height, 80)}px`,
  ].join("; ");
}

export function parseNodeSize(style: string | undefined): {
  width: number;
  height: number;
} {
  const widthMatch = /width:\s*(\d+(?:\.\d+)?)px/i.exec(style ?? "");
  const heightMatch = /height:\s*(\d+(?:\.\d+)?)px/i.exec(style ?? "");

  return {
    width: widthMatch ? Math.round(Number(widthMatch[1])) : DEFAULT_NODE_WIDTH,
    height: heightMatch
      ? Math.round(Number(heightMatch[1]))
      : DEFAULT_NODE_HEIGHT,
  };
}

export function displayNodeValue(data: FlowNodeData): string {
  switch (data.kind) {
    case "file":
      return data.subpath
        ? `${data.file ?? ""}${data.subpath}`
        : (data.file ?? "");
    case "link":
      return data.url ?? "";
    case "group":
      return data.label ?? "";
    case "text":
    default:
      return data.text ?? "";
  }
}

export function resolveCanvasEmbedFileContent(
  fileContents: CanvasEmbedFileContents | undefined,
  file: string | undefined,
  subpath: string | undefined,
): CanvasEmbedFileContent | null {
  if (!fileContents || !file) {
    return null;
  }

  const lookupKeys = subpath ? [`${file}${subpath}`, file] : [file];

  for (const key of lookupKeys) {
    const matched = fileContents[key];
    if (!matched) {
      continue;
    }

    if (typeof matched === "string") {
      return {
        value: matched,
        sourcePath: file,
      };
    }

    return {
      value: matched.value,
      sourcePath: matched.sourcePath ?? file,
    };
  }

  return null;
}

export function resolveCanvasColor(
  color: CanvasColor | undefined,
): string | undefined {
  if (!color) {
    return undefined;
  }

  return PRESET_COLORS[color] ?? color;
}

function createEdgeStyle(color: string | undefined): string | undefined {
  if (!color) {
    return undefined;
  }

  return [`stroke: ${color}`, "stroke-width: 2px"].join("; ");
}

function createEdgeMarker(
  end: EdgeEnd | undefined,
  color?: string,
): EdgeMarkerType | undefined {
  if (end !== "arrow") {
    return undefined;
  }

  return {
    type: ARROW_CLOSED_MARKER_TYPE,
    color: color ?? DEFAULT_EDGE_COLOR,
    width: 12,
    height: 12,
    strokeWidth: 2,
  };
}

function toFlowNodeData(node: CanvasNode): FlowNodeData {
  switch (node.type) {
    case "file":
      return {
        kind: "file",
        file: node.file,
        subpath: node.subpath,
        color: node.color,
      };
    case "link":
      return {
        kind: "link",
        url: node.url,
        color: node.color,
      };
    case "group":
      return {
        kind: "group",
        label: node.label,
        color: node.color,
        background: node.background,
        backgroundStyle: node.backgroundStyle,
      };
    case "text":
    default:
      return {
        kind: "text",
        text: node.text,
        color: node.color,
      };
  }
}

function createFlowNodeData(kind: NodeType, value?: string): FlowNodeData {
  switch (kind) {
    case "file":
      return { kind, file: value ?? "" };
    case "link":
      return { kind, url: value ?? "https://" };
    case "group":
      return { kind, label: value ?? "Group" };
    case "text":
    default:
      return { kind, text: value ?? "" };
  }
}

function toSourceHandleId(side: EdgeSide): string {
  return `${side}-source`;
}

function toTargetHandleId(side: EdgeSide): string {
  return `${side}-target`;
}

function toHandleId(handleId: string | null | undefined): EdgeSide | undefined {
  if (!handleId) {
    return undefined;
  }

  const side = handleId.split("-", 1)[0];
  if (
    side === "top" ||
    side === "right" ||
    side === "bottom" ||
    side === "left"
  ) {
    return side;
  }

  return undefined;
}
