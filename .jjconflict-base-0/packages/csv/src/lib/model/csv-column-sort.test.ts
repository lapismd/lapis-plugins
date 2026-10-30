import { describe, expect, it } from "vitest";
import { CsvGrid } from "./csv-grid";
import { toggleCsvColumnSort, noteCsvColumnSortEdit } from "./csv-column-sort";

function grid() {
  return CsvGrid.fromText("name,amount\nbravo,2\nalpha,10\ncharlie,1", {
    delimiter: ",",
    headerRow: true,
  });
}

describe("toggleCsvColumnSort", () => {
  it("cycles ascending, descending, and the original order", () => {
    const table = grid();
    const ascending = toggleCsvColumnSort(table, null, 0, true);
    expect(table.getRows().map((row) => row[0])).toEqual([
      "name",
      "alpha",
      "bravo",
      "charlie",
    ]);
    expect(ascending?.direction).toBe("asc");

    const descending = toggleCsvColumnSort(table, ascending, 0, true);
    expect(table.getRows().map((row) => row[0])).toEqual([
      "name",
      "charlie",
      "bravo",
      "alpha",
    ]);
    expect(descending?.direction).toBe("desc");

    const cleared = toggleCsvColumnSort(table, descending, 0, true);
    expect(cleared).toBeNull();
    expect(table.getRows().map((row) => row[0])).toEqual([
      "name",
      "bravo",
      "alpha",
      "charlie",
    ]);
  });

  it("sorts another column from the original order", () => {
    const table = grid();
    const byName = toggleCsvColumnSort(table, null, 0, true);
    const byAmount = toggleCsvColumnSort(table, byName, 1, true);
    expect(table.getRows().map((row) => row[1])).toEqual([
      "amount",
      "1",
      "2",
      "10",
    ]);
    expect(byAmount?.index).toBe(1);
  });

  it("keeps a cell edit when the original order returns", () => {
    const table = grid();
    let state = toggleCsvColumnSort(table, null, 0, true);
    const alphaRow = table.getRows().findIndex((row) => row[0] === "alpha");
    table.updateCell(alphaRow, 1, "99");
    noteCsvColumnSortEdit(state!, alphaRow, 1, "99");
    state = toggleCsvColumnSort(table, state, 0, true);
    state = toggleCsvColumnSort(table, state, 0, true);
    expect(state).toBeNull();
    expect(table.getRows()).toEqual([
      ["name", "amount"],
      ["bravo", "2"],
      ["alpha", "99"],
      ["charlie", "1"],
    ]);
  });
});
