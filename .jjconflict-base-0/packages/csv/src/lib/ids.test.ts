import { describe, expect, it } from "vitest";
import {
  CSV_EXTENSIONS,
  CSV_FILENAME_PATTERNS,
  CSV_PLUGIN_ID,
  CSV_VIEW_TYPE,
  SAMPLE_CSV_PATH,
  SAMPLE_READING_NOTE_PATH,
  sampleReadingMarkdown,
} from "./ids";

describe("csv ids", () => {
  it("keeps the namespaced runtime identity and both table extensions", () => {
    expect(CSV_PLUGIN_ID).toBe("lapis-csv");
    expect(CSV_VIEW_TYPE).toBe("lapis-csv");
    expect(CSV_EXTENSIONS).toEqual(["csv", "tsv"]);
    expect(CSV_FILENAME_PATTERNS).toEqual(["*.csv", "*.tsv"]);
    expect(SAMPLE_CSV_PATH).toBe("Sample.csv");
    expect(SAMPLE_READING_NOTE_PATH).toBe("Notes/Staff readings.md");
    expect(sampleReadingMarkdown()).toContain("![[Sample.csv]]");
    expect(sampleReadingMarkdown()).toContain("![[Welcome.md]]");
  });
});
