import { SearchQuery } from "@codemirror/search";
import { EditorState, type Text } from "@codemirror/state";

export type CsvCellMatch = {
  row: number;
  col: number;
  from: number;
  to: number;
};

export type CsvSearchOptions = {
  search: string;
  replace?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regexp?: boolean;
};

export function csvSearchQuery(options: CsvSearchOptions): SearchQuery {
  return new SearchQuery({
    search: options.search,
    replace: options.replace ?? "",
    caseSensitive: options.caseSensitive ?? false,
    wholeWord: options.wholeWord ?? false,
    regexp: options.regexp ?? false,
  });
}

/** Matches in row-major order. An empty or invalid query matches nothing. */
export function csvCellMatches(
  rows: readonly (readonly string[])[],
  query: SearchQuery,
): CsvCellMatch[] {
  if (!query.search || !query.valid) return [];
  const matches: CsvCellMatch[] = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cursor = query.getCursor(EditorState.create({ doc: cell }).doc);
      for (let next = cursor.next(); !next.done; next = cursor.next()) {
        matches.push({
          row: rowIndex,
          col: colIndex,
          from: next.value.from,
          to: next.value.to,
        });
      }
    });
  });
  return matches;
}

export function csvDocumentMatches(
  doc: Text,
  query: SearchQuery,
): Array<{ from: number; to: number }> {
  if (!query.search || !query.valid) return [];
  const matches: Array<{ from: number; to: number }> = [];
  const cursor = query.getCursor(doc);
  for (let next = cursor.next(); !next.done; next = cursor.next()) {
    matches.push({ from: next.value.from, to: next.value.to });
  }
  return matches;
}

/** Replacement text for one match, including regular-expression substitutions. */
export function searchReplacement(query: SearchQuery, matched: string): string {
  const replacement = query.literal
    ? query.replace
    : query.replace.replace(/\\([nrt\\])/g, (_match, escape: string) =>
        escape === "n"
          ? "\n"
          : escape === "r"
            ? "\r"
            : escape === "t"
              ? "\t"
              : "\\",
      );
  if (!query.regexp) return replacement;
  const flags = query.caseSensitive ? "" : "i";
  return matched.replace(new RegExp(query.search, flags), replacement);
}

export function replaceCellText(
  cell: string,
  ranges: readonly { from: number; to: number }[],
  query: SearchQuery,
): string {
  const ordered = [...ranges].sort((left, right) => right.from - left.from);
  let next = cell;
  for (const range of ordered) {
    const matched = next.slice(range.from, range.to);
    next =
      next.slice(0, range.from) +
      searchReplacement(query, matched) +
      next.slice(range.to);
  }
  return next;
}

export function csvBodyCounts(
  rowCount: number,
  colCount: number,
  headerRow: boolean,
): { columns: number; rows: number } {
  return {
    columns: colCount,
    rows: headerRow ? Math.max(0, rowCount - 1) : rowCount,
  };
}

export function csvStatusLabel(columns: number, rows: number): string {
  const columnLabel = columns === 1 ? "column" : "columns";
  const rowLabel = rows === 1 ? "row" : "rows";
  return `${columns.toLocaleString()} ${columnLabel} · ${rows.toLocaleString()} ${rowLabel}`;
}

export function isCsvFindShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === "f"
  );
}
