import { parseJsonCanvas, type CanvasNode, type JsonCanvas, type NodeType } from "./json-canvas";

export function createCanvasCard(type: NodeType, point: { x: number; y: number }, value = ""): CanvasNode {
  const base = { id: crypto.randomUUID(), x: Math.round(point.x), y: Math.round(point.y), width: type === "group" ? 320 : 260, height: type === "group" ? 220 : 160 };
  switch (type) {
    case "text": return { ...base, type, text: value };
    case "file": return { ...base, type, file: value };
    case "link": return { ...base, type, url: value };
    case "group": return { ...base, type, label: value || "Group" };
  }
}

export function selectedCanvas(document: JsonCanvas, selected: Set<string>): JsonCanvas {
  const included = new Set(selected);
  for (const group of (document.nodes ?? []).filter((node) => node.type === "group" && selected.has(node.id))) {
    for (const node of document.nodes ?? []) {
      if (node.x >= group.x && node.y >= group.y && node.x + node.width <= group.x + group.width && node.y + node.height <= group.y + group.height) included.add(node.id);
    }
  }
  return {
    nodes: (document.nodes ?? []).filter((node) => included.has(node.id)),
    edges: (document.edges ?? []).filter((edge) => included.has(edge.fromNode) && included.has(edge.toNode)),
  };
}

/** Preserve extension fields while allocating fresh node and edge identities. */
export function pasteCanvas(document: JsonCanvas, raw: string, offset = { x: 40, y: 40 }): { document: JsonCanvas; ids: Set<string> } {
  const incoming = parseJsonCanvas(raw);
  const mapping = new Map((incoming.nodes ?? []).map((node) => [node.id, crypto.randomUUID()]));
  const nodes = (incoming.nodes ?? []).map((node) => ({ ...node, id: mapping.get(node.id)!, x: Math.round(node.x + offset.x), y: Math.round(node.y + offset.y) }));
  const edges = (incoming.edges ?? []).map((edge) => ({ ...edge, id: crypto.randomUUID(), fromNode: mapping.get(edge.fromNode)!, toNode: mapping.get(edge.toNode)! }));
  return { document: { ...document, nodes: [...(document.nodes ?? []), ...nodes], edges: [...(document.edges ?? []), ...edges] }, ids: new Set(mapping.values()) };
}

/** Coalesce only text changes in one editor session or geometry in one gesture. */
export function canvasMutationGroup(before: JsonCanvas, after: JsonCanvas, textSession: (id: string) => number, gesture: number): string | undefined {
  if (JSON.stringify(before.edges) !== JSON.stringify(after.edges) || before.nodes?.length !== after.nodes?.length) return;
  const changed = (after.nodes ?? []).filter((node, index) => JSON.stringify(node) !== JSON.stringify(before.nodes?.[index]));
  if (changed.length === 1 && changed[0].type === "text") {
    const node = changed[0];
    const previous = before.nodes?.find(({ id }) => id === node.id);
    if (previous?.type === "text" && JSON.stringify({ ...previous, text: node.text }) === JSON.stringify(node)) return `text:${node.id}:${textSession(node.id)}`;
  }
  if (gesture > 0 && changed.length && changed.every((node) => {
    const previous = before.nodes?.find(({ id }) => id === node.id);
    return previous && JSON.stringify({ ...previous, x: node.x, y: node.y, width: node.width, height: node.height }) === JSON.stringify(node);
  })) return `geometry:${gesture}`;
}

export function canvasDropTargets(raw: string, fileExists: (path: string) => boolean, uriList = false): { type: "file" | "link"; value: string }[] {
  const text = raw.trim();
  if (!uriList && fileExists(text)) return [{ type: "file", value: text }];
  return text.split(/\r?\n/).flatMap<{ type: "file" | "link"; value: string }>((line) => {
    const value = line.trim();
    if (!value || value.startsWith("#")) return [];
    if (fileExists(value)) return [{ type: "file" as const, value }];
    try {
      const url = new URL(value);
      if (['http:', 'https:'].includes(url.protocol)) return [{ type: "link" as const, value: url.href }];
    } catch { /* Unsupported drop content does not mutate the board. */ }
    return [];
  });
}
