import type { CanvasNode, GroupNode, JsonCanvas } from "./json-canvas";

export const CANVAS_LAYOUT_ACTIONS = [
  ["left", "Align left"], ["center", "Align horizontal centers"], ["right", "Align right"],
  ["top", "Align top"], ["middle", "Align vertical centers"], ["bottom", "Align bottom"],
  ["distribute-x", "Distribute horizontal spacing"], ["distribute-y", "Distribute vertical spacing"],
  ["row", "Arrange in a row"], ["column", "Arrange in a column"], ["grid", "Arrange in a grid"],
  ["width", "Make equal width"], ["height", "Make equal height"],
] as const;
export type CanvasLayoutAction = typeof CANVAS_LAYOUT_ACTIONS[number][0];
const GAP = 24;
function contains(group: GroupNode, node: CanvasNode): boolean {
  return node.x >= group.x && node.y >= group.y && node.x + node.width <= group.x + group.width && node.y + node.height <= group.y + group.height;
}
/** A selected group moves its contents as one layout unit. */
export function canvasLayoutRoots(document: JsonCanvas, selected: ReadonlySet<string>): CanvasNode[] {
  const nodes = document.nodes ?? [];
  const groups = nodes.flatMap((node, index) => node.type === "group" && selected.has(node.id) ? [{ node, index }] : []);
  return nodes.filter((node, index) => selected.has(node.id) && !groups.some(({ node: group, index: groupIndex }) => {
    if (group.id === node.id || !contains(group, node)) return false;
    return node.type !== "group" || group.width * group.height > node.width * node.height || groupIndex < index;
  }));
}
/** Produce one document mutation without touching identities, extensions or edges. */
export function arrangeCanvas(document: JsonCanvas, selected: ReadonlySet<string>, action: CanvasLayoutAction): JsonCanvas {
  const roots = canvasLayoutRoots(document, selected);
  if (roots.length < 2) return document;
  const left = Math.min(...roots.map((node) => node.x));
  const top = Math.min(...roots.map((node) => node.y));
  const right = Math.max(...roots.map((node) => node.x + node.width));
  const bottom = Math.max(...roots.map((node) => node.y + node.height));
  type Geometry = Partial<Pick<CanvasNode, "x" | "y" | "width" | "height">>;
  const changes = new Map<string, Geometry>();
  const assign = (node: CanvasNode, change: Geometry) => changes.set(node.id, change);
  if (action === "distribute-x" || action === "distribute-y") {
    if (roots.length < 3) return document;
    const horizontal = action === "distribute-x";
    const sorted = [...roots].sort((a, b) => horizontal ? a.x - b.x : a.y - b.y);
    const span = horizontal ? right - left : bottom - top;
    const occupied = roots.reduce((sum, node) => sum + (horizontal ? node.width : node.height), 0);
    const gap = (span - occupied) / (roots.length - 1);
    let position = horizontal ? left : top;
    for (const node of sorted) {
      assign(node, horizontal ? { x: Math.round(position) } : { y: Math.round(position) });
      position += (horizontal ? node.width : node.height) + gap;
    }
  } else if (action === "row" || action === "column") {
    let position = action === "row" ? left : top;
    for (const node of roots) {
      assign(node, action === "row" ? { x: position, y: top } : { x: left, y: position });
      position += (action === "row" ? node.width : node.height) + GAP;
    }
  } else if (action === "grid") {
    const columns = Math.ceil(Math.sqrt(roots.length));
    const widths = Array.from({ length: columns }, (_, column) => Math.max(...roots.filter((_, index) => index % columns === column).map((node) => node.width)));
    let y = top;
    for (let row = 0; row * columns < roots.length; row++) {
      const items = roots.slice(row * columns, (row + 1) * columns);
      let x = left;
      items.forEach((node, column) => { assign(node, { x, y }); x += widths[column]! + GAP; });
      y += Math.max(...items.map((node) => node.height)) + GAP;
    }
  } else {
    for (const node of roots) {
      switch (action) {
        case "left": assign(node, { x: left }); break;
        case "center": assign(node, { x: Math.round((left + right - node.width) / 2) }); break;
        case "right": assign(node, { x: right - node.width }); break;
        case "top": assign(node, { y: top }); break;
        case "middle": assign(node, { y: Math.round((top + bottom - node.height) / 2) }); break;
        case "bottom": assign(node, { y: bottom - node.height }); break;
        case "width": assign(node, { width: Math.max(...roots.map((entry) => entry.width)) }); break;
        case "height": assign(node, { height: Math.max(...roots.map((entry) => entry.height)) }); break;
      }
    }
  }
  const groups = roots.filter((node): node is GroupNode => node.type === "group").sort((a, b) => a.width * a.height - b.width * b.height);
  return { ...document, nodes: (document.nodes ?? []).map((node) => {
    const own = changes.get(node.id);
    if (own) return { ...node, ...own };
    const group = groups.find((candidate) => contains(candidate, node));
    const change = group && changes.get(group.id);
    if (!group || !change || (change.x === undefined && change.y === undefined)) return node;
    return { ...node, x: node.x + (change.x ?? group.x) - group.x, y: node.y + (change.y ?? group.y) - group.y };
  }) };
}
