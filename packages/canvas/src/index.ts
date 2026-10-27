import "./styles.css";

import { CanvasPlugin } from "./canvas-plugin";
import CanvasEmbed from "./canvas-embed.svelte";

export { default as manifest } from "../manifest.json";
export {
  CANVAS_EMBED_EXTENSION,
  CANVAS_FILENAME_PATTERN,
  CANVAS_PLUGIN_ID,
  CANVAS_VIEW_TYPE,
  SAMPLE_CANVAS_PATH,
  SAMPLE_CONNECTORS_CANVAS_PATH,
  SAMPLE_FILE_CANVAS_PATH,
  SAMPLE_GROUP_CANVAS_PATH,
  SAMPLE_LINK_CANVAS_PATH,
  SAMPLE_MARKDOWN_TOUR_PATH,
  SAMPLE_READING_NOTE_PATH,
  SAMPLE_SECTION_CANVAS_PATH,
  SAMPLE_TASK_PATH,
  SAMPLE_TEXT_CANVAS_PATH,
  SAMPLE_WELCOME_PATH,
  sampleCanvasDocument,
  sampleCanvasFiles,
  sampleConnectorsCanvasDocument,
  sampleFileCanvasDocument,
  sampleGroupCanvasDocument,
  sampleLinkCanvasDocument,
  sampleMarkdownTour,
  sampleReadingMarkdown,
  sampleSectionCanvasDocument,
  sampleTaskMarkdown,
  sampleTextCanvasDocument,
  sampleWelcomeMarkdown,
} from "./lib/ids";
export { CanvasEmbed };
export { CanvasPlugin };
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

export default CanvasPlugin;
