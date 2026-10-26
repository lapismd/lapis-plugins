export const SHEET_ROW_HEIGHT = 28;
export const SHEET_LETTER_HEIGHT = 22;
export const SHEET_HEADER_HEIGHT = 28;
export const SHEET_GUTTER_WIDTH = 48;
export const SHEET_MIN_COLUMN_WIDTH = 48;
export const SHEET_DEFAULT_COLUMN_WIDTH = 120;
export const SHEET_RESIZE_SLOP = 5;
export const SHEET_OVERSCAN = 8;
export const SHEET_SORT_HIT = 40;
export const SHEET_SORT_PAD = 3;
export const SHEET_CELL_PADDING = 16;
export const SHEET_MAX_COLUMN_WIDTH = 960;
export const SHEET_LINE_HEIGHT = 16;
export const SHEET_WRAP_MAX_LINES = 4;

export type SheetCommandId =
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down"
  | "clear"
  | "delete";

export type SheetCommand = {
  id: SheetCommandId;
  label: string;
  disabled: boolean;
};

const sessionWidths = new Map<string, number[]>();

export type SheetHit =
  | { kind: "corner" }
  | { kind: "letter"; col: number }
  | { kind: "sort"; col: number }
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

export type SheetAddress =
  | { kind: "cell"; row: number; col: number }
  | { kind: "column"; col: number }
  | { kind: "row"; row: number };

export function parseSheetAddress(input: string): SheetAddress | null {
  const value = input.trim().replaceAll("$", "").toUpperCase();
  if (value.length === 0) return null;
  const cell = /^([A-Z]+)(\d+)$/.exec(value);
  if (cell) {
    const col = columnIndex(cell[1] ?? "");
    const row = Number(cell[2]) - 1;
    if (col == null || row < 0) return null;
    return { kind: "cell", row, col };
  }
  if (/^[A-Z]+$/.test(value)) {
    const col = columnIndex(value);
    return col == null ? null : { kind: "column", col };
  }
  if (/^\d+$/.test(value)) {
    const row = Number(value) - 1;
    return row < 0 ? null : { kind: "row", row };
  }
  return null;
}

/** Rail and address number for a grid row. The header row is not numbered. */
export function sheetRowNumber(gridRow: number, headerRow: boolean): number | null {
  if (gridRow < 0) return null;
  if (!headerRow) return gridRow + 1;
  return gridRow === 0 ? null : gridRow;
}

/** Grid row for a parsed address row (`A1` is 0). Null when it is not a body row. */
export function gridRowFromAddress(
  addressRow: number,
  headerRow: boolean,
  rowCount: number,
): number | null {
  const gridRow = headerRow ? addressRow + 1 : addressRow;
  if (gridRow < 0 || gridRow >= rowCount) return null;
  return gridRow;
}

function columnIndex(letters: string): number | null {
  let value = 0;
  for (const char of letters) {
    const code = char.charCodeAt(0) - 64;
    if (code < 1 || code > 26) return null;
    value = value * 26 + code;
  }
  return value - 1;
}

export function clampColumnWidth(width: number): number {
  return Math.max(
    SHEET_MIN_COLUMN_WIDTH,
    Math.min(SHEET_MAX_COLUMN_WIDTH, Math.round(width)),
  );
}

export function fittedColumnWidth(
  measure: (text: string) => number,
  texts: readonly string[],
): number {
  let widest = 0;
  for (const text of texts) widest = Math.max(widest, measure(text));
  return clampColumnWidth(widest + SHEET_CELL_PADDING);
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
  bodyHeight?: number,
): { width: number; height: number } {
  const edges = columnEdges(widths);
  return {
    width: edges[edges.length - 1] ?? SHEET_GUTTER_WIDTH,
    height: chromeHeight(headerRow) + (bodyHeight ?? bodyCount * SHEET_ROW_HEIGHT),
  };
}

export function wrapLines(
  text: string,
  innerWidth: number,
  measure: (value: string) => number,
): string[] {
  if (text.length === 0 || innerWidth <= 0) return [text];
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const next = line.length === 0 ? word : `${line} ${word}`;
      if (measure(next) <= innerWidth) {
        line = next;
        continue;
      }
      if (line.length > 0) lines.push(line);
      if (measure(word) <= innerWidth) {
        line = word;
        continue;
      }
      let chunk = "";
      for (const char of word) {
        const trial = chunk + char;
        if (chunk.length === 0 || measure(trial) <= innerWidth) chunk = trial;
        else {
          lines.push(chunk);
          chunk = char;
        }
      }
      line = chunk;
    }
    if (line.length > 0) lines.push(line);
  }
  return lines.length > 0 ? lines : [""];
}

export function wrappedRowHeight(lineCount: number): number {
  const lines = Math.max(1, Math.min(lineCount, SHEET_WRAP_MAX_LINES));
  return Math.max(SHEET_ROW_HEIGHT, 12 + lines * SHEET_LINE_HEIGHT);
}

export function bodyOffsets(heights: readonly number[]): number[] {
  const offsets = [0];
  for (const height of heights) {
    offsets.push((offsets[offsets.length - 1] ?? 0) + height);
  }
  return offsets;
}

export function rowIndexAt(offsets: readonly number[], position: number): number {
  const last = Math.max(0, offsets.length - 2);
  if (last === 0 || position <= 0) return 0;
  let low = 0;
  let high = last;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((offsets[mid] ?? 0) <= position) low = mid;
    else high = mid - 1;
  }
  return low;
}

export function sheetCommands(
  target: "column" | "row" | "cell",
  position: { row: number; col: number },
  bounds: { rows: number; cols: number },
): SheetCommand[] {
  const clear = { id: "clear" as const, label: "Clear", disabled: false };
  const remove = { id: "delete" as const, label: "Delete", disabled: false };
  if (target === "column") {
    return [
      {
        id: "move-left",
        label: "Move left",
        disabled: position.col <= 0,
      },
      {
        id: "move-right",
        label: "Move right",
        disabled: position.col >= bounds.cols - 1,
      },
      clear,
      remove,
    ];
  }
  if (target === "row") {
    return [
      {
        id: "move-up",
        label: "Move up",
        disabled: position.row <= 0,
      },
      {
        id: "move-down",
        label: "Move down",
        disabled: position.row >= bounds.rows - 1,
      },
      clear,
      remove,
    ];
  }
  return [clear, remove];
}

export function visibleBodyRange(options: {
  scrollTop: number;
  viewportHeight: number;
  bodyCount: number;
  overscan?: number;
  offsets?: readonly number[] | null;
}): { start: number; end: number } {
  const overscan = options.overscan ?? SHEET_OVERSCAN;
  if (options.bodyCount <= 0) return { start: 0, end: 0 };
  if (options.offsets && options.offsets.length > 1) {
    const start = Math.max(0, rowIndexAt(options.offsets, options.scrollTop) - overscan);
    const endIndex = rowIndexAt(
      options.offsets,
      options.scrollTop + Math.max(options.viewportHeight, SHEET_ROW_HEIGHT),
    );
    return {
      start,
      end: Math.min(options.bodyCount, endIndex + 1 + overscan),
    };
  }
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

export function sheetMenuTarget(
  hit: SheetHit,
): "column" | "row" | "cell" | null {
  switch (hit.kind) {
    case "letter":
    case "header":
    case "sort":
    case "resize":
      return "column";
    case "row":
      return "row";
    case "body":
      return "cell";
    default:
      return null;
  }
}

function inSortZone(
  documentX: number,
  edges: readonly number[],
  col: number,
): boolean {
  const right = edges[col + 1];
  if (right == null) return false;
  const fromRight = right - documentX;
  return fromRight > SHEET_RESIZE_SLOP && fromRight <= SHEET_SORT_HIT;
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
  offsets?: readonly number[] | null;
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
    if (col == null) return null;
    if (!options.headerRow && inSortZone(x + options.scrollLeft, edges, col)) {
      return { kind: "sort", col };
    }
    return { kind: "letter", col };
  }
  if (options.headerRow && y < chrome) {
    const col = columnAt(x + options.scrollLeft, edges);
    if (col == null) return null;
    if (inSortZone(x + options.scrollLeft, edges, col)) {
      return { kind: "sort", col };
    }
    return { kind: "header", col };
  }
  const bodyY = y - chrome + options.scrollTop;
  const offsets = options.offsets;
  let index: number;
  if (offsets && offsets.length > 1) {
    const total = offsets[offsets.length - 1] ?? 0;
    if (bodyY < 0 || bodyY >= total) return null;
    index = rowIndexAt(offsets, bodyY);
  } else {
    index = Math.floor(bodyY / SHEET_ROW_HEIGHT);
  }
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
