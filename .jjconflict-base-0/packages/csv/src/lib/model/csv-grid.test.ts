import { describe, expect, it } from "vitest";
import { CsvGrid } from "./csv-grid";
import { parseCsvText } from "./parse-csv";
import { serializeCsvRows } from "./serialize-csv";

describe("parseCsvText", () => {
  it("parses quoted fields with embedded commas", () => {
    const result = parseCsvText('a,"b,c",d\n1,2,3', { delimiter: "," });
    expect(result.rows).toEqual([
      ["a", "b,c", "d"],
      ["1", "2", "3"],
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it("parses multiline quoted cells", () => {
    const result = parseCsvText('header\n"line1\nline2",x', { delimiter: "," });
    expect(result.rows).toEqual([["header"], ["line1\nline2", "x"]]);
  });

  it("parses TSV with tab delimiter", () => {
    const result = parseCsvText("a\tb\tc\n1\t2\t3", { delimiter: "\t" });
    expect(result.rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles ragged rows", () => {
    const result = parseCsvText("a,b\n1,2,3", { delimiter: "," });
    expect(result.rows[1]).toEqual(["1", "2", "3"]);
  });
});

describe("serializeCsvRows", () => {
  it("escapes values that need quotes", () => {
    const text = serializeCsvRows([["a", "b,c", 'd"e']], { delimiter: "," });
    expect(text).toBe('"a","b,c","d""e"');
  });
});

describe("CsvGrid", () => {
  it("round-trips through text", () => {
    const source = 'name,amount\nalpha,"1,234"\nbeta,56';
    const grid = CsvGrid.fromText(source, { delimiter: ",", headerRow: true });
    expect(grid.toText({ delimiter: "," })).toContain("alpha");
    expect(grid.getCell(1, 1)).toBe("1,234");
  });

  it("mutates rows and columns", () => {
    const grid = CsvGrid.fromText("a,b\n1,2", {
      delimiter: ",",
      headerRow: false,
    });
    grid.updateCell(0, 0, "x");
    grid.insertRowAt(1);
    grid.insertColumnAt(1);
    expect(grid.getCell(0, 0)).toBe("x");
    expect(grid.getRowCount()).toBe(3);
    expect(grid.getColCount()).toBe(3);
    grid.deleteRowAt(2);
    grid.deleteColumnAt(2);
    expect(grid.getRowCount()).toBe(2);
    expect(grid.getColCount()).toBe(2);
  });

  it("moves columns across all rows", () => {
    const grid = CsvGrid.fromText("a,b,c\n1,2,3", {
      delimiter: ",",
      headerRow: false,
    });
    grid.moveColumnAt(0, 2);
    expect(grid.getRows()).toEqual([
      ["b", "c", "a"],
      ["2", "3", "1"],
    ]);
  });

  it("moves rows while preserving column width", () => {
    const grid = CsvGrid.fromText("h1,h2\nr1a,r1b\nr2a,r2b", {
      delimiter: ",",
      headerRow: true,
    });
    grid.moveRowAt(1, 2);
    expect(grid.getCell(0, 0)).toBe("h1");
    expect(grid.getCell(1, 0)).toBe("r2a");
    expect(grid.getCell(2, 0)).toBe("r1a");
  });

  it("clears partial cell selection without deleting rows", () => {
    const grid = CsvGrid.fromText("a,b\n1,2\n3,4", {
      delimiter: ",",
      headerRow: false,
    });
    grid.clearCellsAt([
      [0, 0],
      [1, 1],
    ]);
    expect(grid.getCell(0, 0)).toBe("");
    expect(grid.getCell(0, 1)).toBe("b");
    expect(grid.getCell(1, 1)).toBe("");
    expect(grid.getRowCount()).toBe(3);
  });

  it("inserts a header row when absent", () => {
    const grid = CsvGrid.fromText("1,2\n3,4", {
      delimiter: ",",
      headerRow: false,
    });
    grid.ensureHeaderRow(["col-a", "col-b"]);
    expect(grid.getCell(0, 0)).toBe("col-a");
    expect(grid.getCell(1, 0)).toBe("1");
  });
});
