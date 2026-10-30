export const PDF_PLUGIN_ID = "lapis-pdf";
export const PDF_VIEW_TYPE = "lapis-pdf";
export const PDF_EMBED_EXTENSION = "pdf";
export const PDF_FILENAME_PATTERN = "*.pdf";
export const SAMPLE_PDF_PATH = "Sample.pdf";
export const SAMPLE_READING_NOTE_PATH = "Notes/Reading.md";
export const SAMPLE_PLAIN_NOTE_PATH = "Notes/Welcome.md";

export const PDF_VIEWER_DEFAULTS = {
  defaultZoomLevel: "fit-width",
  scrollStrategy: "vertical",
  pageGap: 10,
  forceDarkPages: true,
} as const;

export function sampleReadingMarkdown(): string {
  return ["# Reading", "", "![[Sample.pdf]]", "", "![[Welcome.md]]", ""].join(
    "\n",
  );
}
