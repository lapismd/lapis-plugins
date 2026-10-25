import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { delimiterForExtension, parseDelimitedText } from "./parse-csv";

const samplePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../assets/sample.csv",
);

describe("parseDelimitedText", () => {
  it("keeps a quoted comma in one field", () => {
    const rows = parseDelimitedText(
      'staff,note\nSouth,"Weed across the culvert, stick in the mouth"\n',
      ",",
    );
    expect(rows).toEqual([
      ["staff", "note"],
      ["South", "Weed across the culvert, stick in the mouth"],
    ]);
  });

  it("keeps a quoted line break and an escaped quote", () => {
    const rows = parseDelimitedText('name,note\nEast,"line one\nline ""two"""\n', ",");
    expect(rows).toEqual([
      ["name", "note"],
      ["East", 'line one\nline "two"'],
    ]);
  });

  it("splits tabs for a tsv extension and commas otherwise", () => {
    expect(delimiterForExtension("tsv")).toBe("\t");
    expect(delimiterForExtension("TSV")).toBe("\t");
    expect(delimiterForExtension("csv")).toBe(",");
    expect(parseDelimitedText("staff\ttime\nNorth\t06:12\n", "\t")).toEqual([
      ["staff", "time"],
      ["North", "06:12"],
    ]);
  });

  it("parses the seeded harbor sample as one header and five rows", () => {
    const rows = parseDelimitedText(readFileSync(samplePath, "utf8"), ",");
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual(["staff", "time", "reading_m", "note"]);
    expect(rows[2]).toEqual([
      "South",
      "06:14",
      "1.61",
      "Weed across the culvert, stick in the mouth",
    ]);
    expect(rows.every((row) => row.length === 4)).toBe(true);
  });
});
