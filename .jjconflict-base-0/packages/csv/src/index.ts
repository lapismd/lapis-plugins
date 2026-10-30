import "./styles.css";

export { default as manifest } from "../manifest.json";
export {
  CSV_EXTENSIONS,
  CSV_FILENAME_PATTERNS,
  CSV_PLUGIN_ID,
  CSV_VIEW_TYPE,
  SAMPLE_CSV_PATH,
  SAMPLE_PLAIN_NOTE_PATH,
  SAMPLE_READING_NOTE_PATH,
  sampleReadingMarkdown,
} from "./lib/ids";
export { default as CsvTable } from "./lib/CsvTable.svelte";
export { CSVPlugin } from "./lib/csv-plugin";
export { default } from "./lib/csv-plugin";
export { CsvFileView } from "./lib/views/csv-view";
