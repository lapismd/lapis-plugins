import "./styles.css";
import CanvasEmbed from "./canvas-embed.svelte";

export { CanvasEmbed };
export {
  createEmptyCanvas,
  parseJsonCanvas,
  stringifyJsonCanvas,
  normalizeCanvas,
  resolveCanvasEmbedFileContent,
  summarizeCanvas,
  toFlowDocument,
  serializeFlowDocument,
  createFlowNode,
  createFlowEdge,
  createFlowEdgePresentation,
  createNodeStyle,
  parseNodeSize,
  displayNodeValue,
  resolveCanvasColor,
} from "./lib/json-canvas";
export type {
  CanvasColor,
  CanvasEdge,
  CanvasEmbedFileContent,
  CanvasEmbedFileContents,
  CanvasNode,
  CanvasSummary,
  EdgeEnd,
  EdgeSide,
  FileNode,
  FlowCanvasEdge,
  FlowCanvasNode,
  FlowEdgeData,
  FlowNodeData,
  GenericNode,
  GroupNode,
  JsonCanvas,
  LinkNode,
  NodeType,
  TextNode,
} from "./lib/json-canvas";
