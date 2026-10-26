export type CsvCellCoord = [row: number, col: number];

export type CsvSelectionState = {
  start: CsvCellCoord;
  end: CsvCellCoord;
  isMouseDown: boolean;
};

export function createSelectionState(): CsvSelectionState {
  return { start: [-1, -1], end: [-1, -1], isMouseDown: false };
}

export type CsvSelectionRange = {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
};

/** Inclusive bounds for a drag, including the anchor cell. */
export function dragSelectionRange(
  start: CsvCellCoord,
  end: CsvCellCoord,
): CsvSelectionRange | null {
  const [row1, col1] = start;
  const [row2, col2] = end;
  if (row1 < 0 || col1 < 0 || row2 < 0 || col2 < 0) {
    return null;
  }
  return {
    minRow: Math.min(row1, row2),
    maxRow: Math.max(row1, row2),
    minCol: Math.min(col1, col2),
    maxCol: Math.max(col1, col2),
  };
}

export function selectionClassForCoord(
  range: CsvSelectionRange | null,
  row: number,
  col: number,
): string | undefined {
  if (
    !range ||
    row < range.minRow ||
    row > range.maxRow ||
    col < range.minCol ||
    col > range.maxCol
  ) {
    return undefined;
  }
  const decorations = ["is-selected"];
  if (row === range.minRow) decorations.push("top");
  if (col === range.minCol) decorations.push("start");
  if (row === range.maxRow) decorations.push("bottom");
  if (col === range.maxCol) decorations.push("end");
  return decorations.join(" ");
}

export function coordFromTarget(target: EventTarget | null): CsvCellCoord {
  if (!(target instanceof Element)) {
    return [-1, -1];
  }
  const cell = target.closest("[data-csv-cell]");
  if (!(cell instanceof HTMLElement) || !cell.dataset.csvCell) {
    return [-1, -1];
  }
  const [row, col] = cell.dataset.csvCell.split(":").map(Number);
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return [-1, -1];
  }
  return [row, col];
}

export function getCellsBetween(
  start: CsvCellCoord,
  end: CsvCellCoord,
): CsvCellCoord[] {
  const [row1, col1] = start;
  const [row2, col2] = end;

  if (row1 < 0 || col1 < 0 || row2 < 0 || col2 < 0) {
    return [];
  }

  const minRow = Math.min(row1, row2);
  const maxRow = Math.max(row1, row2);
  const minCol = Math.min(col1, col2);
  const maxCol = Math.max(col1, col2);

  const cells: CsvCellCoord[] = [];
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      cells.push([row, col]);
    }
  }

  if (cells.length === 1) {
    return [];
  }
  return cells;
}

export function selectionClassesForCells(
  selected: CsvCellCoord[],
): Record<string, string> {
  const data: Record<string, string> = {};
  if (!selected.length) {
    return data;
  }

  let minRow = selected[0][0];
  let maxRow = selected[0][0];
  let minCol = selected[0][1];
  let maxCol = selected[0][1];
  for (const [row, col] of selected) {
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
  }

  for (const pos of selected) {
    const id = pos.join(",");
    const [row, col] = pos;
    const decorations: string[] = ["is-selected"];
    if (row === minRow) {
      decorations.push("top");
    }
    if (col === minCol) {
      decorations.push("start");
    }
    if (row === maxRow) {
      decorations.push("bottom");
    }
    if (col === maxCol) {
      decorations.push("end");
    }
    data[id] = decorations.join(" ");
  }

  return data;
}

export function headerSelectionClassForColumn(
  colIndex: number,
  selected: CsvCellCoord[],
  headerRow: boolean,
  bodyRowIndices: number[],
): string | undefined {
  if (headerRow) {
    return selectionClassesForCells(selected)[`0,${colIndex}`];
  }

  if (bodyRowIndices.length === 0) {
    return undefined;
  }

  const allBodyRowsSelected = bodyRowIndices.every((rowIndex) =>
    selected.some(([row, col]) => row === rowIndex && col === colIndex),
  );
  if (!allBodyRowsSelected) {
    return undefined;
  }

  return "is-selected top bottom start end";
}

export function columnSelection(
  rowCount: number,
  column: number,
): CsvCellCoord[] {
  return Array.from({ length: rowCount }, (_, row) => [row, column]);
}

export function rowSelection(colCount: number, row: number): CsvCellCoord[] {
  return Array.from({ length: colCount }, (_, col) => [row, col]);
}

export function columnSelectionIncludingHeader(
  gridRowCount: number,
  column: number,
  headerRow: boolean,
  bodyRowIndices: number[],
): CsvCellCoord[] {
  const coords: CsvCellCoord[] = [];
  if (headerRow && gridRowCount > 0) {
    coords.push([0, column]);
  }
  for (const rowIndex of bodyRowIndices) {
    coords.push([rowIndex, column]);
  }
  return coords;
}

export function fullRowsAndColumns(
  selectedCells: CsvCellCoord[],
  rowCount: number,
  colCount: number,
): { fullRows: number[]; fullCols: number[] } {
  const rowMap: Map<number, Set<number>> = new Map();
  const colMap: Map<number, Set<number>> = new Map();
  for (const [row, col] of selectedCells) {
    if (!rowMap.has(row)) rowMap.set(row, new Set());
    if (!colMap.has(col)) colMap.set(col, new Set());
    rowMap.get(row)!.add(col);
    colMap.get(col)!.add(row);
  }

  const fullRows: number[] = [];
  const fullCols: number[] = [];

  for (const [row, cols] of rowMap.entries()) {
    if (cols.size === colCount) {
      fullRows.push(row);
    }
  }

  for (const [col, rows] of colMap.entries()) {
    if (rows.size === rowCount) {
      fullCols.push(col);
    }
  }

  return { fullRows, fullCols };
}

export function coordsFromCellElement(
  cell: HTMLElement | null,
  currentTarget: EventTarget | null,
): CsvCellCoord {
  let tableCell = cell;
  while (tableCell && !tableCell.dataset.csvCell) {
    if (tableCell === currentTarget) {
      return [-1, -1];
    }
    tableCell = tableCell.parentElement;
  }
  if (!tableCell?.dataset.csvCell) {
    return [-1, -1];
  }
  const [row, col] = tableCell.dataset.csvCell.split(":").map(Number);
  return [row, col];
}
