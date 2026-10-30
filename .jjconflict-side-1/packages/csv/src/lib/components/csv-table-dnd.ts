import {
  dropIndicatorClasses as dropIndicatorClassesBase,
  isColumnDragSource as isColumnDragSourceBase,
  isRowDragSource as isRowDragSourceBase,
  tableColDragType,
  tableRowDragType,
  type TableDragData,
  type TableDragSource,
} from "@lapis-notes/ui/table-dnd/utils";

export const CSV_TABLE_ROW_TYPE = tableRowDragType("csv");
export const CSV_TABLE_COL_TYPE = tableColDragType("csv");

export type CsvTableDragType =
  | typeof CSV_TABLE_ROW_TYPE
  | typeof CSV_TABLE_COL_TYPE;

export type CsvTableDragSource = TableDragSource;
export type CsvTableDragData = TableDragData;

export function dropIndicatorClasses(
  dragSource: CsvTableDragSource | null,
  dragOverIndex: number | null,
  rowIndex: number,
  colIndex: number,
): string {
  return dropIndicatorClassesBase(
    dragSource,
    dragOverIndex,
    rowIndex,
    colIndex,
    CSV_TABLE_ROW_TYPE,
    CSV_TABLE_COL_TYPE,
  );
}

export function isRowDragSource(
  dragSource: CsvTableDragSource | null,
  rowIndex: number,
): boolean {
  return isRowDragSourceBase(dragSource, rowIndex, CSV_TABLE_ROW_TYPE);
}

export function isColumnDragSource(
  dragSource: CsvTableDragSource | null,
  colIndex: number,
): boolean {
  return isColumnDragSourceBase(dragSource, colIndex, CSV_TABLE_COL_TYPE);
}
