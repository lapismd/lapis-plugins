import type { CsvColumnSortDirection } from "../model/csv-column-sort";
import {
  SHEET_GUTTER_WIDTH,
  SHEET_HEADER_HEIGHT,
  SHEET_LETTER_HEIGHT,
  SHEET_ROW_HEIGHT,
  chromeHeight,
  columnEdges,
  columnLetter,
  visibleBodyRange,
  visibleColumnRange,
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
  selection: { startIndex: number; endIndex: number; startCol: number; endCol: number } | null;
  search: { index: number; col: number; header: boolean } | null;
  sort: { col: number; direction: CsvColumnSortDirection } | null;
  theme: SheetPaintTheme;
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
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const inset = 8;
  const textX = align === "center" ? x + width / 2 : x + inset;
  ctx.fillText(text, textX, y + height / 2, Math.max(0, width - inset * 2));
  ctx.restore();
}

function strokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
}

export function paintSheet(
  canvas: HTMLCanvasElement,
  model: SheetPaintModel,
): void {
  const scale = globalThis.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(model.viewportWidth));
  const height = Math.max(1, Math.round(model.viewportHeight));
  if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const theme = model.theme;
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `13px ${getComputedStyle(canvas).fontFamily || "monospace"}`;
  ctx.lineWidth = 1;
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
  });

  const viewX = (documentX: number) => documentX - model.scrollLeft;

  ctx.fillStyle = theme.gutter;
  ctx.fillRect(0, 0, SHEET_GUTTER_WIDTH, height);
  ctx.fillStyle = theme.header;
  ctx.fillRect(SHEET_GUTTER_WIDTH, 0, width, chrome);
  ctx.strokeStyle = theme.grid;
  ctx.fillStyle = theme.muted;
  clipText(ctx, "", 0, 0, SHEET_GUTTER_WIDTH, SHEET_LETTER_HEIGHT, "center");

  for (let col = columns.start; col < columns.end; col += 1) {
    const x = viewX(edges[col]);
    const columnWidth = model.widths[col];
    ctx.fillStyle = theme.header;
    ctx.fillRect(x, 0, columnWidth, SHEET_LETTER_HEIGHT);
    ctx.strokeStyle = theme.grid;
    strokeRect(ctx, x, 0, columnWidth, SHEET_LETTER_HEIGHT);
    ctx.fillStyle = theme.muted;
    const mark =
      model.sort?.col === col
        ? `${columnLetter(col)} ${model.sort.direction === "asc" ? "↑" : "↓"}`
        : columnLetter(col);
    clipText(ctx, mark, x, 0, columnWidth, SHEET_LETTER_HEIGHT, "center");
    if (model.headerRow) {
      ctx.fillStyle = theme.header;
      ctx.fillRect(x, SHEET_LETTER_HEIGHT, columnWidth, SHEET_HEADER_HEIGHT);
      ctx.strokeStyle = theme.grid;
      strokeRect(ctx, x, SHEET_LETTER_HEIGHT, columnWidth, SHEET_HEADER_HEIGHT);
      ctx.fillStyle = theme.text;
      clipText(
        ctx,
        model.headerLabels[col] ?? "",
        x,
        SHEET_LETTER_HEIGHT,
        columnWidth,
        SHEET_HEADER_HEIGHT,
      );
    }
  }

  for (let index = rows.start; index < rows.end; index += 1) {
    const y = chrome + index * SHEET_ROW_HEIGHT - model.scrollTop;
    ctx.fillStyle = theme.gutter;
    ctx.fillRect(0, y, SHEET_GUTTER_WIDTH, SHEET_ROW_HEIGHT);
    ctx.strokeStyle = theme.grid;
    strokeRect(ctx, 0, y, SHEET_GUTTER_WIDTH, SHEET_ROW_HEIGHT);
    ctx.fillStyle = theme.muted;
    clipText(
      ctx,
      model.rowLabels[index] ?? String(index + 1),
      0,
      y,
      SHEET_GUTTER_WIDTH,
      SHEET_ROW_HEIGHT,
      "center",
    );
    const row = model.body[index] ?? [];
    for (let col = columns.start; col < columns.end; col += 1) {
      const x = viewX(edges[col]);
      const columnWidth = model.widths[col];
      const selected =
        model.selection != null &&
        index >= model.selection.startIndex &&
        index <= model.selection.endIndex &&
        col >= model.selection.startCol &&
        col <= model.selection.endCol;
      ctx.fillStyle = selected ? theme.selection : theme.background;
      ctx.fillRect(x, y, columnWidth, SHEET_ROW_HEIGHT);
      ctx.strokeStyle = theme.grid;
      strokeRect(ctx, x, y, columnWidth, SHEET_ROW_HEIGHT);
      ctx.fillStyle = theme.text;
      clipText(ctx, row[col] ?? "", x, y, columnWidth, SHEET_ROW_HEIGHT);
    }
  }

  ctx.strokeStyle = theme.grid;
  strokeRect(ctx, 0, 0, SHEET_GUTTER_WIDTH, SHEET_LETTER_HEIGHT);
  if (model.headerRow) {
    strokeRect(ctx, 0, SHEET_LETTER_HEIGHT, SHEET_GUTTER_WIDTH, SHEET_HEADER_HEIGHT);
  }

  const outline = (
    index: number,
    col: number,
    header: boolean,
    color: string,
  ) => {
    const top = header
      ? SHEET_LETTER_HEIGHT
      : chrome + index * SHEET_ROW_HEIGHT - model.scrollTop;
    const x = viewX(edges[col] ?? 0);
    const columnWidth = model.widths[col];
    if (columnWidth == null) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, top + 1, columnWidth - 2, (header ? SHEET_HEADER_HEIGHT : SHEET_ROW_HEIGHT) - 2);
    ctx.lineWidth = 1;
  };
  if (model.search) {
    outline(model.search.index, model.search.col, model.search.header, theme.search);
  }
  if (model.active) {
    outline(model.active.index, model.active.col, model.active.header, theme.accent);
  }
}
