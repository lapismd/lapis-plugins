import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
  csvBodyCounts,
  csvCellMatches,
  csvDocumentMatches,
  csvSearchQuery,
  csvShownRowCount,
  csvStatusLabel,
  replaceCellText,
} from "./csv-search";

const rows = [
  ["staff", "note"],
  ["North", "Clear of weed"],
  ["South", "Weed across the culvert, stick in the mouth"],
];

describe("CSV search", () => {
  it("matches cell text and skips an invalid expression", () => {
    const query = csvSearchQuery({ search: "weed" });
    expect(csvCellMatches(rows, query)).toEqual([
      { row: 1, col: 1, from: 9, to: 13 },
      { row: 2, col: 1, from: 0, to: 4 },
    ]);
    expect(csvCellMatches(rows, csvSearchQuery({ search: "(", regexp: true }))).toEqual(
      [],
    );
  });

  it("replaces every match in a cell from the end", () => {
    const query = csvSearchQuery({ search: "a", replace: "b" });
    expect(
      replaceCellText(
        "a-a",
        [
          { from: 0, to: 1 },
          { from: 2, to: 3 },
        ],
        query,
      ),
    ).toBe("b-b");
  });

  it("applies a regular-expression replacement", () => {
    const query = csvSearchQuery({
      search: "weed",
      replace: "reed",
      regexp: true,
    });
    expect(replaceCellText("Clear of weed", [{ from: 9, to: 13 }], query)).toBe(
      "Clear of reed",
    );
  });

  it("counts document matches separately from cells", () => {
    const doc = EditorState.create({ doc: "North,weed\nSouth,weed" }).doc;
    expect(csvDocumentMatches(doc, csvSearchQuery({ search: "weed" }))).toEqual([
      { from: 6, to: 10 },
      { from: 17, to: 21 },
    ]);
  });

  it("labels columns and data rows", () => {
    expect(csvBodyCounts(2501, 4, true)).toEqual({ columns: 4, rows: 2500 });
    expect(csvStatusLabel(4, 2500)).toBe("4 columns · 2,500 rows");
    expect(csvStatusLabel(1, 1)).toBe("1 column · 1 row");
    expect(csvStatusLabel(4, 57, 23)).toBe(
      "4 columns · Showing 23 rows (filtered from 57 total rows)",
    );
    expect(csvStatusLabel(1, 1, 1)).toBe(
      "1 column · Showing 1 row (filtered from 1 total row)",
    );
    expect(csvStatusLabel(4, 2500, 0)).toBe(
      "4 columns · Showing 0 rows (filtered from 2,500 total rows)",
    );
  });

  it("counts each matching data row once and skips the header", () => {
    expect(
      csvShownRowCount(3, true, [
        { row: 0 },
        { row: 1 },
        { row: 1 },
        { row: 2 },
      ]),
    ).toBe(2);
    expect(csvShownRowCount(3, false, [{ row: 0 }, { row: 2 }])).toBe(2);
  });
});
