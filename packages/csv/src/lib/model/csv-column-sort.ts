import type { CsvGrid } from "./csv-grid";

export type CsvColumnSortDirection = "asc" | "desc";

export type CsvColumnSort = {
  index: number;
  direction: CsvColumnSortDirection;
  baseline: string[][];
  /** Baseline index for each current visual row. */
  order: number[];
};

export function nextCsvColumnSortDirection(
  state: CsvColumnSort | null,
  index: number,
): CsvColumnSortDirection | "clear" {
  if (!state || state.index !== index) return "asc";
  if (state.direction === "asc") return "desc";
  return "clear";
}

export function applyCsvColumnSort(
  grid: CsvGrid,
  state: CsvColumnSort | null,
  index: number,
  direction: CsvColumnSortDirection | "clear",
  headerRow: boolean,
): CsvColumnSort | null {
  if (direction === "clear") {
    if (state) grid.replaceRows(state.baseline);
    return null;
  }
  const baseline = state?.baseline ?? grid.getRows();
  if (state) grid.replaceRows(baseline);
  const permutation = grid.sortColumn(index, direction === "asc", headerRow ? 1 : 0);
  return { index, direction, baseline, order: permutation };
}

export function toggleCsvColumnSort(
  grid: CsvGrid,
  state: CsvColumnSort | null,
  index: number,
  headerRow: boolean,
): CsvColumnSort | null {
  return applyCsvColumnSort(
    grid,
    state,
    index,
    nextCsvColumnSortDirection(state, index),
    headerRow,
  );
}

export function noteCsvColumnSortEdit(
  state: CsvColumnSort,
  row: number,
  col: number,
  value: string,
): void {
  const source = state.order[row];
  const line = source == null ? undefined : state.baseline[source];
  if (!line) return;
  while (line.length <= col) line.push("");
  line[col] = value;
}

export function noteCsvColumnInserted(
  state: CsvColumnSort | null,
  index: number,
): CsvColumnSort | null {
  if (!state) return null;
  return {
    ...state,
    baseline: state.baseline.map((row) => {
      const next = [...row];
      next.splice(index, 0, "");
      return next;
    }),
    index: state.index >= index ? state.index + 1 : state.index,
  };
}

export function noteCsvColumnDeleted(
  state: CsvColumnSort | null,
  index: number,
): CsvColumnSort | null {
  if (!state || state.index === index) return null;
  return {
    ...state,
    baseline: state.baseline.map((row) => {
      const next = [...row];
      if (index >= 0 && index < next.length) next.splice(index, 1);
      return next;
    }),
    index: state.index > index ? state.index - 1 : state.index,
  };
}

export function noteCsvColumnMoved(
  state: CsvColumnSort | null,
  from: number,
  to: number,
): CsvColumnSort | null {
  if (!state || from === to) return state;
  return {
    ...state,
    baseline: state.baseline.map((row) => {
      const next = [...row];
      const [cell] = next.splice(from, 1);
      next.splice(to, 0, cell ?? "");
      return next;
    }),
    index: movedColumnIndex(state.index, from, to),
  };
}

function movedColumnIndex(current: number, from: number, to: number): number {
  if (current === from) return to;
  if (from < current && to >= current) return current - 1;
  if (from > current && to <= current) return current + 1;
  return current;
}
