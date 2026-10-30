import type { CsvGrid } from "./csv-grid";

export type CsvTableRow = {
  id: string;
  rowIndex: number;
  /** 1-based visible row index in the table body (independent of grid row). */
  displayRowNumber: number;
  cells: string[];
};

export function rowsFromGrid(grid: CsvGrid, headerRow: boolean): CsvTableRow[] {
  const all = grid.getRows();
  const offset = headerRow ? 1 : 0;
  return all.slice(offset).map((cells, index) => ({
    id: `row-${offset + index}`,
    rowIndex: offset + index,
    displayRowNumber: index + 1,
    cells: [...cells],
  }));
}

export function headerLabelsFromGrid(
  grid: CsvGrid,
  headerRow: boolean,
  colCount: number,
): string[] {
  return Array.from({ length: colCount }, (_, column) => {
    if (headerRow && grid.getRowCount() > 0) {
      return grid.getCell(0, column);
    }
    return `Column ${column + 1}`;
  });
}
