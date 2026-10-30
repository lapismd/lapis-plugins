export const CSV_PLUGIN_ID = "lapis-csv";
export const CSV_VIEW_TYPE = "lapis-csv";
export const CSV_EXTENSIONS = ["csv", "tsv"] as const;
export const CSV_FILENAME_PATTERNS = ["*.csv", "*.tsv"] as const;
export const SAMPLE_CSV_PATH = "Sample.csv";
export const SAMPLE_READING_NOTE_PATH = "Notes/Staff readings.md";
export const SAMPLE_PLAIN_NOTE_PATH = "Notes/Welcome.md";

export function sampleReadingMarkdown(): string {
  return [
    "# Staff readings",
    "",
    "The south basin kept the late tide.",
    "",
    "![[Sample.csv]]",
    "",
    "![[Welcome.md]]",
    "",
  ].join("\n");
}
