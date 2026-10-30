import "./styles.css";

export { default as manifest } from "../manifest.json";
export {
  PDF_EMBED_EXTENSION,
  PDF_FILENAME_PATTERN,
  PDF_PLUGIN_ID,
  PDF_VIEW_TYPE,
  PDF_VIEWER_DEFAULTS,
  SAMPLE_PDF_PATH,
  SAMPLE_PLAIN_NOTE_PATH,
  SAMPLE_READING_NOTE_PATH,
  sampleReadingMarkdown,
} from "./lib/ids";
export { default as PdfViewer } from "./lib/PdfViewer.svelte";
export { PDFPlugin } from "./lib/pdf-plugin";
export { default } from "./lib/pdf-plugin";
export { PdfFileView } from "./lib/views/pdf-view";
