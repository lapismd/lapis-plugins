import "./styles.css";

export { default as manifest } from "../manifest.json";
export {
  DOCX_EMBED_EXTENSION,
  DOCX_FILENAME_PATTERN,
  DOCX_PLUGIN_ID,
  DOCX_VIEW_TYPE,
  SAMPLE_DOCX_PATH,
  SAMPLE_PLAIN_NOTE_PATH,
  SAMPLE_READING_NOTE_PATH,
  sampleReadingMarkdown,
} from "./lib/ids";
export { default as DocxViewer } from "./lib/DocxViewer.svelte";
export { DOCXPlugin } from "./lib/docx-plugin";
export { default } from "./lib/docx-plugin";
export { DocxFileView } from "./lib/views/docx-view";
