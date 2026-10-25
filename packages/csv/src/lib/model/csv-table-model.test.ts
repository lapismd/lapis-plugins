import { describe, expect, it } from "vitest";
import { CsvGrid } from "./csv-grid";
import { rowsFromGrid } from "./csv-table-model";

describe("rowsFromGrid", () => {
  it("uses 1-based display row numbers for body rows", () => {
    const grid = CsvGrid.fromText("h1,h2\na,b\nc,d", {
      delimiter: ",",
      headerRow: true,
    });
    const rows = rowsFromGrid(grid, true);
    expect(rows.map((row) => row.displayRowNumber)).toEqual([1, 2]);
    expect(rows[0].rowIndex).toBe(1);
  });

  it("numbers all rows when header row is off", () => {
    const grid = CsvGrid.fromText("a,b\nc,d", {
      delimiter: ",",
      headerRow: false,
    });
    const rows = rowsFromGrid(grid, false);
    expect(rows.map((row) => row.displayRowNumber)).toEqual([1, 2]);
  });
});
