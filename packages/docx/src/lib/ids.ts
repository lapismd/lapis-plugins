export const DOCX_PLUGIN_ID = "lapis-docx";
export const DOCX_VIEW_TYPE = "lapis-docx";
export const DOCX_EMBED_EXTENSION = "docx";
export const DOCX_FILENAME_PATTERN = "*.docx";
export const SAMPLE_DOCX_PATH = "Sample.docx";
export const SAMPLE_READING_NOTE_PATH = "Notes/Reading.md";
export const SAMPLE_PLAIN_NOTE_PATH = "Notes/Welcome.md";

export function sampleReadingMarkdown(): string {
  return ["# Reading", "", "![[Sample.docx]]", "", "![[Welcome.md]]", ""].join(
    "\n",
  );
}
