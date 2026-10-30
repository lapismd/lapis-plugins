import { describe, expect, it } from "vitest";
import {
  columnSelectionIncludingHeader,
  fullRowsAndColumns,
  dragSelectionRange,
  getCellsBetween,
  headerSelectionClassForColumn,
  selectionClassForCoord,
  selectionClassesForCells,
} from "./csv-table-selection";
import {
  dropIndicatorClasses,
  isColumnDragSource,
  isRowDragSource,
} from "./csv-table-dnd";

describe("getCellsBetween", () => {
  it("returns four cells for a 2x2 rectangle", () => {
    expect(getCellsBetween([0, 0], [1, 1])).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
  });

  it("returns empty array for a single cell", () => {
    expect(getCellsBetween([0, 0], [0, 0])).toEqual([]);
  });
});

describe("dragSelectionRange", () => {
  it("paints the anchor cell before the pointer leaves it", () => {
    expect(dragSelectionRange([2, 1], [2, 1])).toEqual({
      minRow: 2,
      maxRow: 2,
      minCol: 1,
      maxCol: 1,
    });
    expect(selectionClassForCoord(dragSelectionRange([2, 1], [2, 1]), 2, 1)).toBe(
      "is-selected top start bottom end",
    );
  });

  it("extends to the pointer's cell in either direction", () => {
    const range = dragSelectionRange([1, 2], [0, 1]);
    expect(selectionClassForCoord(range, 0, 1)).toBe("is-selected top start");
    expect(selectionClassForCoord(range, 1, 2)).toBe("is-selected bottom end");
    expect(selectionClassForCoord(range, 3, 2)).toBeUndefined();
  });
});

describe("selectionClassesForCells", () => {
  it("assigns edge classes from min/max bounds for a 2x2 block", () => {
    const classes = selectionClassesForCells([
      [1, 1],
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    expect(classes["0,0"]).toBe("is-selected top start");
    expect(classes["0,1"]).toBe("is-selected top end");
    expect(classes["1,0"]).toBe("is-selected start bottom");
    expect(classes["1,1"]).toBe("is-selected bottom end");
  });

  it("assigns full edge classes for a column selection", () => {
    const classes = selectionClassesForCells([
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
    expect(classes["0,2"]).toBe("is-selected top start end");
    expect(classes["1,2"]).toBe("is-selected start end");
    expect(classes["2,2"]).toBe("is-selected start bottom end");
  });
});

describe("headerSelectionClassForColumn", () => {
  it("uses header coord when headerRow is enabled", () => {
    expect(
      headerSelectionClassForColumn(
        1,
        [
          [0, 1],
          [1, 1],
        ],
        true,
        [1],
      ),
    ).toBe("is-selected top start end");
  });

  it("styles synthetic header when all body rows in column are selected", () => {
    expect(
      headerSelectionClassForColumn(
        0,
        [
          [1, 0],
          [2, 0],
        ],
        false,
        [1, 2],
      ),
    ).toBe("is-selected top bottom start end");
  });
});

describe("fullRowsAndColumns", () => {
  it("detects full rows and columns in a selection", () => {
    const result = fullRowsAndColumns(
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      2,
      2,
    );
    expect(result.fullRows).toEqual([0, 1]);
    expect(result.fullCols).toEqual([0, 1]);
  });

  it("returns empty arrays for partial selections", () => {
    const result = fullRowsAndColumns([[0, 0]], 2, 2);
    expect(result.fullRows).toEqual([]);
    expect(result.fullCols).toEqual([]);
  });
});

describe("columnSelectionIncludingHeader", () => {
  it("includes header row when enabled", () => {
    expect(columnSelectionIncludingHeader(3, 1, true, [1, 2])).toEqual([
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
  });

  it("skips header row when disabled", () => {
    expect(columnSelectionIncludingHeader(2, 0, false, [0, 1])).toEqual([
      [0, 0],
      [1, 0],
    ]);
  });
});

describe("dropIndicatorClasses", () => {
  it("marks column drop to the right", () => {
    expect(
      dropIndicatorClasses({ type: "csv-table-col", index: 1 }, 3, 0, 3),
    ).toBe("is-dragging-right");
  });

  it("marks row drop above", () => {
    expect(
      dropIndicatorClasses({ type: "csv-table-row", index: 3 }, 1, 1, 0),
    ).toBe("is-dragging-top");
  });

  it("detects active row and column drag sources", () => {
    expect(isRowDragSource({ type: "csv-table-row", index: 2 }, 2)).toBe(true);
    expect(isRowDragSource({ type: "csv-table-row", index: 2 }, 1)).toBe(false);
    expect(isColumnDragSource({ type: "csv-table-col", index: 1 }, 1)).toBe(
      true,
    );
    expect(isColumnDragSource({ type: "csv-table-col", index: 1 }, 0)).toBe(
      false,
    );
  });
});
