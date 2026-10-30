import Papa from "papaparse";
import type { CsvDelimiter } from "../../csv-settings";

export type SerializeCsvOptions = {
  delimiter: CsvDelimiter;
};

export function serializeCsvRows(
  rows: string[][],
  options: SerializeCsvOptions,
): string {
  return Papa.unparse(rows, {
    delimiter: options.delimiter,
    newline: "\n",
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
  });
}
