import { describe, expect, it } from "vitest";
import {
  SHEET_DEFAULT_COLUMN_WIDTH,
  SHEET_GUTTER_WIDTH,
  SHEET_HEADER_HEIGHT,
  SHEET_LETTER_HEIGHT,
  SHEET_MIN_COLUMN_WIDTH,
  SHEET_ROW_HEIGHT,
  clampColumnWidth,
  columnLetter,
  hitTestSheet,
  visibleBodyRange,
  visibleColumnRange,
} from "./sheet-layout";

const widths = [120, 80, 160];

describe("sheet layout", () => {
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
  });

  it("uses the default width when a file has no saved columns", () => {
    expect(SHEET_DEFAULT_COLUMN_WIDTH).toBeGreaterThan(SHEET_MIN_COLUMN_WIDTH);
  });
});
