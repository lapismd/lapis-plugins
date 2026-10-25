import type { CsvDelimiter } from "../../csv-settings";
import { parseCsvText } from "./parse-csv";
import { serializeCsvRows } from "./serialize-csv";

export type CsvGridOptions = {
  delimiter: CsvDelimiter;
  headerRow: boolean;
};

export class CsvGrid {
  private rows: string[][];

  private constructor(rows: string[][]) {
    this.rows = rows.map((row) => [...row]);
  }

  static fromText(text: string, options: CsvGridOptions): CsvGrid {
    const { rows } = parseCsvText(text, { delimiter: options.delimiter });
    const normalized = rows.length ? rows : [[""]];
    return new CsvGrid(normalized);
  }

  static empty(): CsvGrid {
    return new CsvGrid([[""]]);
  }

  clone(): CsvGrid {
    return new CsvGrid(this.rows);
  }

  getRowCount(): number {
    return this.rows.length;
  }

  getColCount(): number {
    return this.rows.reduce((max, row) => Math.max(max, row.length), 0);
  }

  getRows(): string[][] {
    return this.rows.map((row) => [...row]);
  }

  getCell(row: number, col: number): string {
    return this.rows[row]?.[col] ?? "";
  }

  updateCell(row: number, col: number, value: string): void {
    this.ensureSize(row + 1, col + 1);
    this.rows[row][col] = value;
    this.trimTrailingEmpty();
  }

  insertRowAt(index: number): void {
    const width = this.getColCount();
    const row = Array.from({ length: Math.max(width, 1) }, () => "");
    const clamped = Math.max(0, Math.min(index, this.rows.length));
    this.rows.splice(clamped, 0, row);
  }

  deleteRowAt(index: number): void {
    if (this.rows.length <= 1) {
      this.rows = [[""]];
      return;
    }
    if (index >= 0 && index < this.rows.length) {
      this.rows.splice(index, 1);
    }
  }

  insertColumnAt(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.getColCount()));
    for (const row of this.rows) {
      row.splice(clamped, 0, "");
    }
    if (this.rows.length === 0) {
      this.rows.push([""]);
    }
  }

  deleteColumnAt(index: number): void {
    const width = this.getColCount();
    if (width <= 1) {
      this.rows = this.rows.map(() => [""]);
      return;
    }
    for (const row of this.rows) {
      if (index >= 0 && index < row.length) {
        row.splice(index, 1);
      }
    }
  }

  moveColumnAt(from: number, to: number): void {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    const width = this.getColCount();
    if (from >= width || to >= width) {
      return;
    }
    for (const row of this.rows) {
      const [cell] = row.splice(from, 1);
      row.splice(to, 0, cell);
    }
  }

  moveRowAt(from: number, to: number): void {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    if (from >= this.rows.length || to >= this.rows.length) {
      return;
    }
    const [row] = this.rows.splice(from, 1);
    this.rows.splice(to, 0, row);
  }

  clearCellsAt(coords: Array<[row: number, col: number]>): void {
    for (const [row, col] of coords) {
      if (row >= 0 && col >= 0 && row < this.rows.length) {
        if (col < this.rows[row].length) {
          this.rows[row][col] = "";
        }
      }
    }
    this.trimTrailingEmpty();
  }

  ensureHeaderRow(initialLabels?: string[]): void {
    if (this.rows.length === 0) {
      const width = Math.max(this.getColCount(), initialLabels?.length ?? 1);
      this.rows.push(
        Array.from(
          { length: width },
          (_, column) => initialLabels?.[column] ?? "",
        ),
      );
      return;
    }
    const width = this.getColCount();
    this.rows.unshift(
      Array.from(
        { length: width },
        (_, column) => initialLabels?.[column] ?? "",
      ),
    );
  }

  sortColumn(index: number, ascending: boolean, startRow = 0): void {
    const body = this.rows.slice(startRow);
    body.sort((left, right) => {
      const a = left[index] ?? "";
      const b = right[index] ?? "";
      const cmp = a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return ascending ? cmp : -cmp;
    });
    this.rows.splice(startRow, body.length, ...body);
  }

  toText(options: Pick<CsvGridOptions, "delimiter">): string {
    const rows = this.getRows();
    if (rows.length === 0) {
      return "";
    }
    return serializeCsvRows(rows, { delimiter: options.delimiter });
  }

  private ensureSize(rowCount: number, colCount: number): void {
    while (this.rows.length < rowCount) {
      this.rows.push(Array.from({ length: colCount }, () => ""));
    }
    for (const row of this.rows) {
      while (row.length < colCount) {
        row.push("");
      }
    }
  }

  private trimTrailingEmpty(): void {
    while (this.rows.length > 1) {
      const last = this.rows[this.rows.length - 1];
      if (last.some((cell) => cell.trim().length > 0)) {
        break;
      }
      this.rows.pop();
    }
  }
}
