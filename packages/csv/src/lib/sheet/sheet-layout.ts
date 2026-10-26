export const SHEET_ROW_HEIGHT = 28;
export const SHEET_LETTER_HEIGHT = 22;
export const SHEET_HEADER_HEIGHT = 28;
export const SHEET_GUTTER_WIDTH = 48;
export const SHEET_MIN_COLUMN_WIDTH = 48;
export const SHEET_DEFAULT_COLUMN_WIDTH = 120;
export const SHEET_RESIZE_SLOP = 5;
export const SHEET_OVERSCAN = 8;

const sessionWidths = new Map<string, number[]>();

export type SheetHit =
  | { kind: "corner" }
  | { kind: "letter"; col: number }
  | { kind: "header"; col: number }
  | { kind: "body"; index: number; col: number }
  | { kind: "row"; index: number }
  | { kind: "resize"; col: number };

export function columnLetter(index: number): string {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export function clampColumnWidth(width: number): number {
  return Math.max(SHEET_MIN_COLUMN_WIDTH, Math.round(width));
}

export function columnWidths(
  count: number,
  stored: readonly number[] | undefined,
): number[] {
  return Array.from({ length: count }, (_, index) => {
    const width = stored?.[index];
    return width == null ? SHEET_DEFAULT_COLUMN_WIDTH : clampColumnWidth(width);
  });
}

export function readSessionWidths(path: string, count: number): number[] {
  return columnWidths(count, sessionWidths.get(path));
}

export function writeSessionWidths(path: string, widths: readonly number[]): void {
  sessionWidths.set(path, widths.map((width) => clampColumnWidth(width)));
}

export function columnEdges(widths: readonly number[]): number[] {
  const edges = [SHEET_GUTTER_WIDTH];
  for (const width of widths) {
    edges.push(edges[edges.length - 1] + width);
  }
  return edges;
}

export function chromeHeight(headerRow: boolean): number {
  return SHEET_LETTER_HEIGHT + (headerRow ? SHEET_HEADER_HEIGHT : 0);
}

export function sheetContentSize(
  widths: readonly number[],
  bodyCount: number,
  headerRow: boolean,
): { width: number; height: number } {
  const edges = columnEdges(widths);
  return {
    width: edges[edges.length - 1] ?? SHEET_GUTTER_WIDTH,
    height: chromeHeight(headerRow) + bodyCount * SHEET_ROW_HEIGHT,
  };
}

export function visibleBodyRange(options: {
  scrollTop: number;
  viewportHeight: number;
  bodyCount: number;
  overscan?: number;
}): { start: number; end: number } {
  const overscan = options.overscan ?? SHEET_OVERSCAN;
  if (options.bodyCount <= 0) return { start: 0, end: 0 };
  const start = Math.max(
    0,
    Math.floor(options.scrollTop / SHEET_ROW_HEIGHT) - overscan,
  );
  const span =
    Math.ceil(Math.max(options.viewportHeight, SHEET_ROW_HEIGHT) / SHEET_ROW_HEIGHT) +
    overscan * 2;
  return {
    start,
    end: Math.min(options.bodyCount, start + span),
  };
}

export function visibleColumnRange(options: {
  scrollLeft: number;
  viewportWidth: number;
  widths: readonly number[];
}): { start: number; end: number } {
  const edges = columnEdges(options.widths);
  const left = options.scrollLeft + SHEET_GUTTER_WIDTH;
  const right = options.scrollLeft + Math.max(options.viewportWidth, 1);
  let start = 0;
  while (start < options.widths.length && edges[start + 1] < left) start += 1;
  let end = start;
  while (end < options.widths.length && edges[end] < right) end += 1;
  return { start, end: Math.max(end, Math.min(options.widths.length, start + 1)) };
}

function columnAt(documentX: number, edges: readonly number[]): number | null {
  if (documentX < edges[0]) return null;
  for (let index = 0; index < edges.length - 1; index += 1) {
    if (documentX < edges[index + 1]) return index;
  }
  return null;
}

export function hitTestSheet(options: {
  x: number;
  y: number;
  scrollLeft: number;
  scrollTop: number;
  widths: readonly number[];
  headerRow: boolean;
  bodyCount: number;
}): SheetHit | null {
  const { x, y, widths } = options;
  if (x < 0 || y < 0 || widths.length === 0) return null;
  const edges = columnEdges(widths);
  const chrome = chromeHeight(options.headerRow);
  if (x >= SHEET_GUTTER_WIDTH) {
    const documentX = x + options.scrollLeft;
    for (let col = 0; col < widths.length; col += 1) {
      if (Math.abs(documentX - edges[col + 1]) <= SHEET_RESIZE_SLOP) {
        return { kind: "resize", col };
      }
    }
  }
  if (x < SHEET_GUTTER_WIDTH && y < chrome) return { kind: "corner" };
  if (y < SHEET_LETTER_HEIGHT) {
    const col = columnAt(x + options.scrollLeft, edges);
    return col == null ? null : { kind: "letter", col };
  }
  if (options.headerRow && y < chrome) {
    const col = columnAt(x + options.scrollLeft, edges);
    return col == null ? null : { kind: "header", col };
  }
  const index = Math.floor((y - chrome + options.scrollTop) / SHEET_ROW_HEIGHT);
  if (index < 0 || index >= options.bodyCount) return null;
  if (x < SHEET_GUTTER_WIDTH) return { kind: "row", index };
  const col = columnAt(x + options.scrollLeft, edges);
  return col == null ? null : { kind: "body", index, col };
}

export function cellDocumentRect(options: {
  col: number;
  top: number;
  widths: readonly number[];
  height: number;
}): { x: number; y: number; width: number; height: number } | null {
  const edges = columnEdges(options.widths);
  const x = edges[options.col];
  const next = edges[options.col + 1];
  if (x == null || next == null) return null;
  return { x, y: options.top, width: next - x, height: options.height };
}
