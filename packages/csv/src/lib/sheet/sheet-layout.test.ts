import { describe, expect, it } from "vitest";
import {
  SHEET_DEFAULT_COLUMN_WIDTH,
  SHEET_GUTTER_WIDTH,
  SHEET_HEADER_HEIGHT,
  SHEET_LETTER_HEIGHT,
  SHEET_MAX_COLUMN_WIDTH,
  SHEET_MIN_COLUMN_WIDTH,
  SHEET_ROW_HEIGHT,
  clampColumnWidth,
  columnLetter,
  gridRowFromAddress,
  parseSheetAddress,
  sheetRowNumber,
  bodyOffsets,
  fittedColumnWidth,
  hitTestSheet,
  rowIndexAt,
  sheetCommands,
  sheetMenuTarget,
  visibleBodyRange,
  visibleColumnRange,
  wrapLines,
  wrappedRowHeight,
} from "./sheet-layout";

const widths = [120, 80, 160];

describe("sheet layout", () => {
  it("reads a cell address, a column, or a row", () => {
    expect(parseSheetAddress("b12")).toEqual({ kind: "cell", row: 11, col: 1 });
    expect(parseSheetAddress("$AA$1")).toEqual({ kind: "cell", row: 0, col: 26 });
    expect(parseSheetAddress("C")).toEqual({ kind: "column", col: 2 });
    expect(parseSheetAddress("4")).toEqual({ kind: "row", row: 3 });
    expect(parseSheetAddress("A0")).toBeNull();
    expect(parseSheetAddress("1B")).toBeNull();
  });

  it("numbers address rows with the row rail", () => {
    expect(sheetRowNumber(1, true)).toBe(1);
    expect(sheetRowNumber(0, true)).toBeNull();
    expect(sheetRowNumber(0, false)).toBe(1);
    expect(gridRowFromAddress(0, true, 4)).toBe(1);
    expect(gridRowFromAddress(0, false, 4)).toBe(0);
    expect(gridRowFromAddress(3, true, 4)).toBeNull();
  });

  it("labels columns the way a sheet does", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(25)).toBe("Z");
    expect(columnLetter(26)).toBe("AA");
  });

  it("keeps a resized column at least as wide as its letter", () => {
    expect(clampColumnWidth(12)).toBe(SHEET_MIN_COLUMN_WIDTH);
    expect(clampColumnWidth(140.4)).toBe(140);
  });

  it("paints a window of a long sheet instead of every row", () => {
    const range = visibleBodyRange({
      scrollTop: 0,
      viewportHeight: 200,
      bodyCount: 2500,
    });
    expect(range.start).toBe(0);
    expect(range.end).toBeLessThan(40);
    const later = visibleBodyRange({
      scrollTop: 1198 * SHEET_ROW_HEIGHT,
      viewportHeight: 200,
      bodyCount: 2500,
    });
    expect(later.start).toBeGreaterThan(1100);
    expect(later.end - later.start).toBeLessThan(40);
  });

  it("finds the visible columns past the frozen gutter", () => {
    const range = visibleColumnRange({
      scrollLeft: 100,
      viewportWidth: 150,
      widths,
    });
    expect(range.start).toBe(0);
    expect(range.end).toBeGreaterThan(range.start);
  });

  it("maps the pointer to a cell, a column boundary, or the row gutter", () => {
    const header = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + 20,
      y: SHEET_LETTER_HEIGHT + 8,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(header).toEqual({ kind: "header", col: 0 });

    const body = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + 20,
      y: SHEET_LETTER_HEIGHT + SHEET_HEADER_HEIGHT + 10,
      scrollLeft: 0,
      scrollTop: SHEET_ROW_HEIGHT,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(body).toEqual({ kind: "body", index: 1, col: 0 });

    const resize = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + widths[0],
      y: 8,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(resize).toEqual({ kind: "resize", col: 0 });

    const row = hitTestSheet({
      x: 12,
      y: SHEET_LETTER_HEIGHT + SHEET_HEADER_HEIGHT + 10,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(row).toEqual({ kind: "row", index: 0 });

    const letter = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + 16,
      y: 8,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(letter).toEqual({ kind: "letter", col: 0 });

    const sort = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + widths[0] - 10,
      y: 8,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(sort).toEqual({ kind: "sort", col: 0 });

    const headerEdge = hitTestSheet({
      x: SHEET_GUTTER_WIDTH + widths[0] - 10,
      y: SHEET_LETTER_HEIGHT + 8,
      scrollLeft: 0,
      scrollTop: 0,
      widths,
      headerRow: true,
      bodyCount: 4,
    });
    expect(headerEdge).toEqual({ kind: "header", col: 0 });
  });

  it("sizes a column to its text and still hides the rest", () => {
    expect(fittedColumnWidth((text) => text.length * 7, ["note", "Clear of weed"])).toBe(
      "Clear of weed".length * 7 + 16,
    );
    expect(fittedColumnWidth((text) => text.length * 40, ["a very long reading note"])).toBe(
      SHEET_MAX_COLUMN_WIDTH,
    );
  });

  it("wraps a long cell and grows that row", () => {
    const measure = (value: string) => value.length * 8;
    const lines = wrapLines("Weed across the culvert", 80, measure);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("Weed across the culvert");
    expect(wrappedRowHeight(1)).toBe(SHEET_ROW_HEIGHT);
    expect(wrappedRowHeight(3)).toBeGreaterThan(SHEET_ROW_HEIGHT);
    const offsets = bodyOffsets([SHEET_ROW_HEIGHT, wrappedRowHeight(3), SHEET_ROW_HEIGHT]);
    expect(rowIndexAt(offsets, 0)).toBe(0);
    expect(rowIndexAt(offsets, SHEET_ROW_HEIGHT)).toBe(1);
    expect(rowIndexAt(offsets, SHEET_ROW_HEIGHT + 4)).toBe(1);
  });

  it("lists move, clear, and delete for the pointer target", () => {
    const column = sheetCommands("column", { row: 0, col: 0 }, { rows: 4, cols: 3 });
    expect(column.map((command) => command.label)).toEqual([
      "Move left",
      "Move right",
      "Clear",
      "Delete",
    ]);
    expect(column[0]?.disabled).toBe(true);
    expect(column[1]?.disabled).toBe(false);
    expect(
      sheetCommands("row", { row: 2, col: 0 }, { rows: 4, cols: 3 }).map(
        (command) => command.id,
      ),
    ).toEqual(["move-up", "move-down", "clear", "delete"]);
    expect(
      sheetCommands("cell", { row: 1, col: 1 }, { rows: 4, cols: 3 }).map(
        (command) => command.id,
      ),
    ).toEqual(["clear", "delete"]);
    expect(
      sheetCommands("sheet", { row: 0, col: 0 }, { rows: 4, cols: 3 }).map(
        (command) => command.id,
      ),
    ).toEqual(["clear", "delete"]);
  });

  it("chooses the context menu from the pointer target", () => {
    expect(sheetMenuTarget({ kind: "letter", col: 1 })).toBe("column");
    expect(sheetMenuTarget({ kind: "header", col: 1 })).toBe("column");
    expect(sheetMenuTarget({ kind: "sort", col: 2 })).toBe("column");
    expect(sheetMenuTarget({ kind: "row", index: 3 })).toBe("row");
    expect(sheetMenuTarget({ kind: "body", index: 1, col: 2 })).toBe("cell");
    expect(sheetMenuTarget({ kind: "corner" })).toBe("sheet");
  });

  it("uses the default width when a file has no saved columns", () => {
    expect(SHEET_DEFAULT_COLUMN_WIDTH).toBeGreaterThan(SHEET_MIN_COLUMN_WIDTH);
  });
});
