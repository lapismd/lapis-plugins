import {
  SHEET_CELL_PADDING,
  SHEET_GUTTER_WIDTH,
  SHEET_HEADER_HEIGHT,
  SHEET_LETTER_HEIGHT,
  SHEET_LINE_HEIGHT,
  SHEET_ROW_HEIGHT,
  SHEET_SORT_HIT,
  SHEET_WRAP_MAX_LINES,
  chromeHeight,
  columnEdges,
  columnLetter,
  visibleBodyRange,
  visibleColumnRange,
  wrapLines,
} from "./sheet-layout";

export type SheetPaintTheme = {
  background: string;
  header: string;
  gutter: string;
  text: string;
  muted: string;
  grid: string;
  selection: string;
  accent: string;
  search: string;
  columns: readonly string[];
};

export type SheetPaintModel = {
  widths: readonly number[];
  headerRow: boolean;
  headerLabels: readonly string[];
  rowLabels: readonly string[];
  body: readonly (readonly string[])[];
  scrollLeft: number;
  scrollTop: number;
  viewportWidth: number;
  viewportHeight: number;
  active: { index: number; col: number; header: boolean } | null;
  selection: {
    startIndex: number;
    endIndex: number;
    startCol: number;
    endCol: number;
  } | null;
  search: { index: number; col: number; header: boolean } | null;
  theme: SheetPaintTheme;
  wrap: boolean;
  colours: boolean;
  rowOffsets: readonly number[] | null;
};

function clipText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  align: CanvasTextAlign = "left",
): void {
  if (width <= 1 || height <= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const inset = 8;
  const textX = align === "center" ? x + width / 2 : x + inset;
  ctx.fillText(text, textX, y + height / 2);
  ctx.restore();
}

function paintCellText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  wrap: boolean,
): void {
  if (!wrap) {
    clipText(ctx, text, x, y, width, height);
    return;
  }
  if (width <= 1 || height <= 1) return;
  const inner = Math.max(1, width - SHEET_CELL_PADDING);
  const lines = wrapLines(text, inner, (value) => ctx.measureText(value).width).slice(
    0,
    SHEET_WRAP_MAX_LINES,
  );
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let line = 0; line < lines.length; line += 1) {
    ctx.fillText(lines[line] ?? "", x + 8, y + 6 + line * SHEET_LINE_HEIGHT);
  }
  ctx.restore();
}

function hLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  if (width <= 0) return;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), 1);
}

function vLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
): void {
  if (height <= 0) return;
  ctx.fillRect(Math.round(x), Math.round(y), 1, Math.round(height));
}

function columnColor(model: SheetPaintModel, col: number): string {
  const colors = model.theme.columns;
  return colors[col % Math.max(colors.length, 1)] || model.theme.text;
}

function headerFill(model: SheetPaintModel, col: number, picked: boolean): string {
  if (picked || !model.colours) return picked ? model.theme.selection : model.theme.header;
  return `color-mix(in oklab, ${columnColor(model, col)} 8%, ${model.theme.header})`;
}

function columnSelected(
  model: SheetPaintModel,
  col: number,
): boolean {
  const selection = model.selection;
  if (!selection || model.body.length === 0) return false;
  return (
    selection.startIndex === 0 &&
    selection.endIndex >= model.body.length - 1 &&
    col >= selection.startCol &&
    col <= selection.endCol
  );
}

function sheetSelected(model: SheetPaintModel): boolean {
  const selection = model.selection;
  if (!selection || model.body.length === 0 || model.widths.length === 0) return false;
  return (
    selection.startIndex === 0 &&
    selection.endIndex >= model.body.length - 1 &&
    selection.startCol === 0 &&
    selection.endCol >= model.widths.length - 1
  );
}

function headerRowSelected(model: SheetPaintModel): boolean {
  const selection = model.selection;
  if (!selection || !model.headerRow || model.widths.length === 0) return false;
  return (
    selection.startIndex <= -1 &&
    selection.endIndex >= -1 &&
    selection.startCol === 0 &&
    selection.endCol >= model.widths.length - 1
  );
}

function rowSelected(model: SheetPaintModel, index: number): boolean {
  const selection = model.selection;
  if (!selection || model.widths.length === 0) return false;
  return (
    index >= selection.startIndex &&
    index <= selection.endIndex &&
    selection.startCol === 0 &&
    selection.endCol >= model.widths.length - 1
  );
}

export function paintSheet(
  canvas: HTMLCanvasElement,
  model: SheetPaintModel,
): void {
  const scale = globalThis.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(model.viewportWidth));
  const height = Math.max(1, Math.round(model.viewportHeight));
  if (
    canvas.width !== Math.round(width * scale) ||
    canvas.height !== Math.round(height * scale)
  ) {
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.reset();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const theme = model.theme;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `13px ${getComputedStyle(canvas).fontFamily || "monospace"}`;
  const edges = columnEdges(model.widths);
  const columns = visibleColumnRange({
    scrollLeft: model.scrollLeft,
    viewportWidth: width,
    widths: model.widths,
  });
  const chrome = chromeHeight(model.headerRow);
  const rows = visibleBodyRange({
    scrollTop: model.scrollTop,
    viewportHeight: height,
    bodyCount: model.body.length,
    offsets: model.rowOffsets,
  });
  const viewX = (documentX: number) => documentX - model.scrollLeft;
  const rowBox = (index: number) => {
    if (!model.rowOffsets) {
      return {
        y: chrome + index * SHEET_ROW_HEIGHT - model.scrollTop,
        height: SHEET_ROW_HEIGHT,
      };
    }
    const top = model.rowOffsets[index] ?? index * SHEET_ROW_HEIGHT;
    const next = model.rowOffsets[index + 1] ?? top + SHEET_ROW_HEIGHT;
    return {
      y: chrome + top - model.scrollTop,
      height: Math.max(1, next - top),
    };
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    SHEET_GUTTER_WIDTH,
    chrome,
    Math.max(0, width - SHEET_GUTTER_WIDTH),
    Math.max(0, height - chrome),
  );
  ctx.clip();
  for (let index = rows.start; index < rows.end; index += 1) {
    const box = rowBox(index);
    const row = model.body[index] ?? [];
    for (let col = columns.start; col < columns.end; col += 1) {
      const x = viewX(edges[col] ?? 0);
      const columnWidth = model.widths[col] ?? 0;
      const selected =
        model.selection != null &&
        index >= model.selection.startIndex &&
        index <= model.selection.endIndex &&
        col >= model.selection.startCol &&
        col <= model.selection.endCol;
      ctx.fillStyle = selected ? theme.selection : theme.background;
      ctx.fillRect(x, box.y, columnWidth, box.height);
      ctx.fillStyle = model.colours ? columnColor(model, col) : theme.text;
      paintCellText(ctx, row[col] ?? "", x, box.y, columnWidth, box.height, model.wrap);
      ctx.fillStyle = theme.grid;
      hLine(ctx, x, box.y + box.height - 1, columnWidth);
      vLine(ctx, x + columnWidth - 1, box.y, box.height);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(SHEET_GUTTER_WIDTH, 0, Math.max(0, width - SHEET_GUTTER_WIDTH), chrome);
  ctx.clip();
  ctx.fillStyle = theme.header;
  ctx.fillRect(SHEET_GUTTER_WIDTH, 0, width, chrome);
  for (let col = columns.start; col < columns.end; col += 1) {
    const x = viewX(edges[col] ?? 0);
    const columnWidth = model.widths[col] ?? 0;
    const picked = columnSelected(model, col);
    const headerPicked = picked || headerRowSelected(model);
    ctx.fillStyle = picked ? theme.selection : theme.header;
    ctx.fillRect(x, 0, columnWidth, SHEET_LETTER_HEIGHT);
    ctx.fillStyle = theme.muted;
    clipText(
      ctx,
      columnLetter(col),
      x,
      0,
      Math.max(0, columnWidth - SHEET_SORT_HIT),
      SHEET_LETTER_HEIGHT,
      "center",
    );
    if (model.headerRow) {
      ctx.fillStyle = headerFill(model, col, headerPicked);
      ctx.fillRect(x, SHEET_LETTER_HEIGHT, columnWidth, SHEET_HEADER_HEIGHT);
      ctx.fillStyle = model.colours ? columnColor(model, col) : theme.text;
      clipText(
        ctx,
        model.headerLabels[col] ?? "",
        x,
        SHEET_LETTER_HEIGHT,
        columnWidth,
        SHEET_HEADER_HEIGHT,
      );
    }
    ctx.fillStyle = theme.grid;
    vLine(ctx, x + columnWidth - 1, 0, chrome);
  }
  ctx.fillStyle = theme.grid;
  hLine(ctx, SHEET_GUTTER_WIDTH, SHEET_LETTER_HEIGHT - 1, width);
  if (model.headerRow) hLine(ctx, SHEET_GUTTER_WIDTH, chrome - 1, width);
  ctx.restore();

  ctx.fillStyle = theme.gutter;
  ctx.fillRect(0, 0, SHEET_GUTTER_WIDTH, height);
  for (let index = rows.start; index < rows.end; index += 1) {
    const box = rowBox(index);
    const bottom = box.y + box.height;
    if (bottom <= chrome) continue;
    const top = Math.max(box.y, chrome);
    const picked = rowSelected(model, index);
    ctx.fillStyle = picked ? theme.selection : theme.gutter;
    ctx.fillRect(0, top, SHEET_GUTTER_WIDTH - 1, bottom - top);
    ctx.fillStyle = theme.muted;
    clipText(
      ctx,
      model.rowLabels[index] ?? String(index + 1),
      0,
      box.y,
      SHEET_GUTTER_WIDTH - 1,
      box.height,
      "center",
    );
    ctx.fillStyle = theme.grid;
    hLine(ctx, 0, box.y + box.height - 1, SHEET_GUTTER_WIDTH);
  }
  ctx.fillStyle = sheetSelected(model) ? theme.selection : theme.header;
  ctx.fillRect(0, 0, SHEET_GUTTER_WIDTH, chrome);
  if (model.headerRow) {
    ctx.fillStyle = headerRowSelected(model) ? theme.selection : theme.gutter;
    ctx.fillRect(0, SHEET_LETTER_HEIGHT, SHEET_GUTTER_WIDTH - 1, SHEET_HEADER_HEIGHT);
    ctx.fillStyle = theme.muted;
    clipText(ctx, "1", 0, SHEET_LETTER_HEIGHT, SHEET_GUTTER_WIDTH - 1, SHEET_HEADER_HEIGHT, "center");
  }
  ctx.fillStyle = theme.grid;
  hLine(ctx, 0, SHEET_LETTER_HEIGHT - 1, SHEET_GUTTER_WIDTH);
  if (model.headerRow) hLine(ctx, 0, chrome - 1, SHEET_GUTTER_WIDTH);
  vLine(ctx, SHEET_GUTTER_WIDTH - 1, 0, height);

  const outline = (
    index: number,
    col: number,
    header: boolean,
    color: string,
  ) => {
    const top = header
      ? SHEET_LETTER_HEIGHT
      : rowBox(index).y;
    const x = viewX(edges[col] ?? 0);
    const columnWidth = model.widths[col];
    if (columnWidth == null) return;
    const boxWidth = columnWidth;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x + 1,
      top + 1,
      Math.max(0, boxWidth - 2),
      (header ? SHEET_HEADER_HEIGHT : rowBox(index).height) - 2,
    );
    ctx.lineWidth = 1;
  };
  const paintOutline = (
    cell: { index: number; col: number; header: boolean },
    color: string,
  ) => {
    if (cell.header) {
      outline(cell.index, cell.col, true, color);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      SHEET_GUTTER_WIDTH,
      chrome,
      Math.max(0, width - SHEET_GUTTER_WIDTH),
      Math.max(0, height - chrome),
    );
    ctx.clip();
    outline(cell.index, cell.col, false, color);
    ctx.restore();
  };
  if (model.search) paintOutline(model.search, theme.search);
  if (model.active) paintOutline(model.active, theme.accent);
}
