import Papa from "papaparse";
import type { CsvDelimiter } from "../../csv-settings";

export type ParseCsvOptions = {
  delimiter: CsvDelimiter;
};

export type ParseCsvResult = {
  rows: string[][];
  errors: Papa.ParseError[];
};

export function parseCsvText(
  text: string,
  options: ParseCsvOptions,
): ParseCsvResult {
  const trimmed = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parsed = Papa.parse<string[]>(trimmed, {
    delimiter: options.delimiter,
    skipEmptyLines: false,
  });

  const rows = (parsed.data as string[][]).map((row) =>
    row.map((cell) => (cell ?? "").toString()),
  );

  return {
    rows,
    errors: parsed.errors ?? [],
  };
}
