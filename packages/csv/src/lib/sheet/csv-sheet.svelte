<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import type { CsvColumnSortDirection } from "../model/csv-column-sort";
  import type { CsvGrid } from "../model/csv-grid";
  import CsvSheetToolbar from "./csv-sheet-toolbar.svelte";
  import { paintSheet, type SheetPaintTheme } from "./sheet-paint";
  import SheetGlyph from "./sheet-glyph.svelte";
  import {
    SHEET_CELL_PADDING,
    SHEET_HEADER_HEIGHT,
    SHEET_LETTER_HEIGHT,
    SHEET_RESIZE_SLOP,
    SHEET_ROW_HEIGHT,
    SHEET_SORT_HIT,
    SHEET_SORT_PAD,
    bodyOffsets,
    cellDocumentRect,
    chromeHeight,
    clampColumnWidth,
    columnEdges,
    columnLetter,
    fittedColumnWidth,
    gridRowFromAddress,
    hitTestSheet,
    parseSheetAddress,
    sheetRowNumber,
    sheetCommands,
    sheetContentSize,
    sheetMenuTarget,
    visibleColumnRange,
    wrapLines,
    wrappedRowHeight,
    type SheetCommandId,
    type SheetHit,
  } from "./sheet-layout";

  type Cell = { row: number; col: number };

  let {
    grid,
    headerRow,
    bodyRows,
    searchCell = null,
    sort = null,
    widths,
    onWidths,
    onCellChange,
    onSort,
    onDeleteRow,
    onDeleteColumn,
    onMoveColumn,
    onMoveRow,
    onClearColumn,
    onClearRow,
    onClearCell,
    onClearSheet,
    onDeleteSheet,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onHeaderRow,
  }: {
    grid: CsvGrid;
    headerRow: boolean;
    bodyRows: readonly number[];
    searchCell?: Cell | null;
    sort?: { index: number; direction: CsvColumnSortDirection } | null;
    widths: number[];
    onWidths: (widths: number[]) => void;
    onCellChange: (row: number, col: number, value: string) => void;
    onSort: (col: number) => void;
    onDeleteRow: (index: number) => void;
    onDeleteColumn: (index: number) => void;
    onMoveColumn: (from: number, to: number) => void;
    onMoveRow: (from: number, to: number) => void;
    onClearColumn: (col: number) => void;
    onClearRow: (row: number) => void;
    onClearCell: (row: number, col: number) => void;
    onClearSheet: () => void;
    onDeleteSheet: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onHeaderRow: (headerRow: boolean) => void;
  } = $props();

  let scroller = $state<HTMLDivElement | null>(null);
  let canvas = $state<HTMLCanvasElement | null>(null);
  let scrollLeft = $state(0);
  let scrollTop = $state(0);
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let active = $state<Cell | null>(null);
  let editing = $state(false);
  let editorValue = $state("");
  let selection = $state<{
    startIndex: number;
    endIndex: number;
    startCol: number;
    endCol: number;
  } | null>(null);
  let menu = $state<{
    x: number;
    y: number;
    target: "column" | "row" | "cell" | "sheet";
    row: number;
    col: number;
  } | null>(null);
  let drag: {
    kind: "select" | "resize";
    axis: "cell" | "row" | "column";
    col: number;
    index: number;
    startWidth: number;
    startX: number;
    moved: boolean;
  } | null = null;
  let selectOnEdit = false;
  let wrap = $state(false);
  let colours = $state(false);
  let measureCanvas: HTMLCanvasElement | null = null;

  function measureText(text: string): number {
    if (typeof document === "undefined") return text.length * 7.8;
    measureCanvas ??= document.createElement("canvas");
    const context = measureCanvas.getContext("2d");
    if (!context) return text.length * 7.8;
    const family = canvas ? getComputedStyle(canvas).fontFamily : "";
    context.font = `13px ${family || "ui-monospace, monospace"}`;
    return context.measureText(text).width;
  }

  const rowOffsets = $derived.by(() => {
    if (!wrap) return null;
    const rows = grid.getRows();
    const heights = bodyRows.map((row) => {
      const cells = rows[row] ?? [];
      let lines = 1;
      for (let col = 0; col < widths.length; col += 1) {
        const inner = Math.max(1, (widths[col] ?? 0) - SHEET_CELL_PADDING);
        lines = Math.max(
          lines,
          wrapLines(cells[col] ?? "", inner, measureText).length,
        );
      }
      return wrappedRowHeight(lines);
    });
    return bodyOffsets(heights);
  });
  const size = $derived(
    sheetContentSize(
      widths,
      bodyRows.length,
      headerRow,
      rowOffsets ? rowOffsets[rowOffsets.length - 1] : undefined,
    ),
  );
  const theme = $derived(readTheme(canvas));
  const paintModel = $derived({
    widths,
    headerRow,
    headerLabels: grid.getRows()[0] ?? [],
    rowLabels: bodyRows.map((row) => String(sheetRowNumber(row) ?? "")),
    body: bodyRows.map((row) => grid.getRows()[row] ?? []),
    scrollLeft,
    scrollTop,
    viewportWidth,
    viewportHeight,
    active: activeCellPaint(),
    selection,
    search: searchPaint(),
    theme,
    wrap,
    colours,
    rowOffsets,
  });

  function sortFill(col: number): string {
    const picked =
      selection != null &&
      bodyRows.length > 0 &&
      selection.startIndex === 0 &&
      selection.endIndex >= bodyRows.length - 1 &&
      col >= selection.startCol &&
      col <= selection.endCol;
    return picked ? theme.selection : "transparent";
  }

  function readTheme(node: HTMLCanvasElement | null): SheetPaintTheme {
    const style = node ? getComputedStyle(node) : null;
    const value = (name: string, fallback: string) =>
      style?.getPropertyValue(name).trim() || fallback;
    return {
      background: value("--csv-shell-background", "#fff"),
      header: value("--csv-header-background", "#f4f4f5"),
      gutter: value("--csv-index-background", "#f4f4f5"),
      text: value("--csv-text-color", "#111"),
      muted: value("--csv-muted-color", "#666"),
      grid: value("--csv-surface-border", "#ddd"),
      selection: value("--table-selection", "rgba(37, 99, 235, 0.16)"),
      accent: value("--table-selection-border-color", "#2563eb"),
      search: value("--csv-col-5", "#b45309"),
      columns: [1, 2, 3, 4, 5].map((slot, index) =>
        value(
          `--csv-col-${slot}`,
          ["#c2410c", "#15803d", "#1d4ed8", "#a21caf", "#a16207"][index] ?? "#111",
        ),
      ),
    };
  }

  function bodyIndex(row: number): number {
    return bodyRows.indexOf(row);
  }

  function gridRow(index: number): number {
    return bodyRows[index] ?? -1;
  }

  function holdCanvas(node: HTMLCanvasElement) {
    canvas = node;
    return () => {
      if (canvas === node) canvas = null;
    };
  }

  const paintAttachment = $derived.by(() => {
    const model = paintModel;
    return (node: HTMLCanvasElement) => {
      paintSheet(node, model);
    };
  });

  function holdEditor(node: HTMLInputElement) {
    node.focus();
    if (selectOnEdit) node.select();
  }

  function activeCellPaint() {
    if (!active || commandTarget === "column" || commandTarget === "row" || commandTarget === "sheet") {
      return null;
    }
    if (headerRow && active.row === 0) {
      return { index: 0, col: active.col, header: true };
    }
    const index = bodyIndex(active.row);
    if (index < 0) return null;
    return { index, col: active.col, header: false };
  }

  function searchPaint() {
    if (!searchCell) return null;
    if (headerRow && searchCell.row === 0) {
      return { index: 0, col: searchCell.col, header: true };
    }
    const index = bodyIndex(searchCell.row);
    if (index < 0) return null;
    return { index, col: searchCell.col, header: false };
  }

  function holdScroller(node: HTMLDivElement) {
    scroller = node;
    const read = () => {
      scrollLeft = node.scrollLeft;
      scrollTop = node.scrollTop;
      viewportWidth = node.clientWidth;
      viewportHeight = node.clientHeight;
    };
    read();
    node.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", read);
      observer.disconnect();
      if (scroller === node) scroller = null;
    };
  }

  function pointerPoint(event: PointerEvent): { x: number; y: number } {
    const node = scroller;
    if (!node) return { x: 0, y: 0 };
    const rect = node.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hitAt(event: PointerEvent): SheetHit | null {
    const point = pointerPoint(event);
    return hitTestSheet({
      x: point.x,
      y: point.y,
      scrollLeft,
      scrollTop,
      widths,
      headerRow,
      bodyCount: bodyRows.length,
      offsets: rowOffsets,
    });
  }

  const commandTarget = $derived.by((): "column" | "row" | "cell" | "sheet" | null => {
    if (selection && widths.length > 0 && (bodyRows.length > 0 || selection.startIndex < 0)) {
      const oneCol = selection.startCol === selection.endCol;
      const oneRow = selection.startIndex === selection.endIndex;
      const fullRows =
        selection.startIndex === 0 && selection.endIndex >= bodyRows.length - 1;
      const fullCols =
        selection.startCol === 0 && selection.endCol >= widths.length - 1;
      if (fullRows && fullCols) return "sheet";
      if (fullRows && oneCol) return "column";
      if (fullCols && oneRow) return "row";
    }
    if (active) return "cell";
    return null;
  });

  const commandAt = $derived.by(() => {
    if (commandTarget === "column" && selection) {
      return { row: active?.row ?? 0, col: selection.startCol };
    }
    if (commandTarget === "row" && selection) {
      const row = selection.startIndex < 0 ? 0 : gridRow(selection.startIndex);
      return { row, col: active?.col ?? 0 };
    }
    return active;
  });

  const sortButtons = $derived.by(() => {
    const edges = columnEdges(widths);
    const range = visibleColumnRange({
      scrollLeft,
      viewportWidth: Math.max(viewportWidth, 1),
      widths,
    });
    const bandTop = 0;
    const bandHeight = SHEET_LETTER_HEIGHT;
    const buttons = [];
    for (let col = range.start; col < range.end; col += 1) {
      const right = edges[col + 1];
      if (right == null) continue;
      const label = headerRow ? grid.getRows()[0]?.[col] : columnLetter(col);
      buttons.push({
        col,
        left: right - SHEET_SORT_HIT + SHEET_SORT_PAD - scrollLeft,
        top: bandTop + 1,
        width: Math.max(0, SHEET_SORT_HIT - SHEET_RESIZE_SLOP - SHEET_SORT_PAD * 2),
        height: Math.max(0, bandHeight - 2),
        fill: sortFill(col),
        direction: sort?.index === col ? sort.direction : null,
        label: `Sort ${label || columnLetter(col)}`,
      });
    }
    return buttons;
  });

  const toolbarCommands = $derived.by(() => {
    const bounds = { rows: grid.getRowCount(), cols: grid.getColCount() };
    if (commandTarget === "sheet") {
      return sheetCommands("sheet", { row: 0, col: 0 }, bounds);
    }
    if (!commandTarget || !commandAt || commandAt.row < 0 || commandAt.col < 0) {
      return [];
    }
    return sheetCommands(commandTarget, commandAt, bounds);
  });

  const reference = $derived.by(() => {
    if (!commandTarget || !commandAt || commandAt.col < 0 || commandAt.row < 0) {
      return "";
    }
    const letter = columnLetter(commandAt.col);
    if (commandTarget === "column") return letter;
    const rowNumber = sheetRowNumber(commandAt.row);
    if (rowNumber == null) return letter;
    if (commandTarget === "row") return String(rowNumber);
    return `${letter}${rowNumber}`;
  });

  const menuItems = $derived.by(() => {
    if (!menu) return [];
    return sheetCommands(
      menu.target,
      { row: menu.row, col: menu.col },
      { rows: grid.getRowCount(), cols: grid.getColCount() },
    );
  });

  function applyCommand(
    id: SheetCommandId,
    row: number,
    col: number,
    target: "column" | "row" | "cell" | "sheet",
  ) {
    if (id === "move-left") onMoveColumn(col, col - 1);
    else if (id === "move-right") onMoveColumn(col, col + 1);
    else if (id === "move-up") onMoveRow(row, row - 1);
    else if (id === "move-down") onMoveRow(row, row + 1);
    else if (target === "sheet" && id === "delete") onDeleteSheet();
    else if (target === "sheet") onClearSheet();
    else if (id === "delete" && target === "column") onDeleteColumn(col);
    else if (id === "delete" && target === "row") onDeleteRow(row);
    else if (id === "clear" && target === "column") onClearColumn(col);
    else if (id === "clear" && target === "row") onClearRow(row);
    else onClearCell(row, col);
  }

  function goToAddress(value: string) {
    const address = parseSheetAddress(value);
    if (!address) return;
    if (address.kind === "column") {
      if (address.col >= grid.getColCount()) return;
      selectColumns(address.col, address.col);
      const row = headerRow ? 0 : Math.max(0, gridRow(0));
      if (row >= 0) reveal(row, address.col);
      return;
    }
    const row = gridRowFromAddress(address.row, grid.getRowCount());
    if (row == null) return;
    if (address.kind === "cell") {
      if (address.col >= grid.getColCount()) return;
      selectCell(row, address.col);
      reveal(row, address.col);
      return;
    }
    const headerIndex = headerRow && row === 0;
    const index = headerIndex ? -1 : bodyIndex(row);
    if (!headerIndex && index < 0) return;
    selectRows(index, index);
    reveal(row, 0);
  }

  function selectAll() {
    const row = headerRow ? 0 : Math.max(0, gridRow(0));
    active = { row, col: 0 };
    selection = {
      startIndex: 0,
      endIndex: Math.max(0, bodyRows.length - 1),
      startCol: 0,
      endCol: Math.max(0, widths.length - 1),
    };
    editing = false;
  }

  function selectCell(row: number, col: number) {
    active = { row, col };
    selection = null;
    editing = false;
  }

  function selectColumns(from: number, to: number) {
    const startCol = Math.min(from, to);
    const endCol = Math.max(from, to);
    const body = gridRow(0);
    active = { row: body >= 0 ? body : 0, col: startCol };
    selection = {
      startIndex: 0,
      endIndex: Math.max(0, bodyRows.length - 1),
      startCol,
      endCol,
    };
    editing = false;
  }

  function selectRows(from: number, to: number) {
    const startIndex = Math.min(from, to);
    const endIndex = Math.max(from, to);
    const row = startIndex < 0 ? 0 : gridRow(startIndex);
    const lastCol = Math.max(0, widths.length - 1);
    if (row >= 0) active = { row, col: 0 };
    selection = {
      startIndex,
      endIndex,
      startCol: 0,
      endCol: lastCol,
    };
    editing = false;
  }

  function fitColumn(col: number) {
    const surface = canvas;
    const context = surface?.getContext("2d");
    if (!surface || !context) return;
    context.font = `13px ${getComputedStyle(surface).fontFamily || "monospace"}`;
    const texts: string[] = [];
    const rowCount = grid.getRowCount();
    for (let row = 0; row < rowCount; row += 1) {
      texts.push(grid.getCell(row, col));
    }
    const next = [...widths];
    next[col] = fittedColumnWidth(
      (text) => context.measureText(text).width,
      texts,
    );
    onWidths(next);
  }

  function beginEdit(seed?: string) {
    if (!active) return;
    editorValue = seed ?? grid.getCell(active.row, active.col);
    selectOnEdit = seed == null;
    editing = true;
  }

  function commitEdit() {
    if (!editing || !active) return;
    const cell = active;
    const value = editorValue;
    editing = false;
    onCellChange(cell.row, cell.col, value);
  }

  function cancelEdit() {
    editing = false;
  }

  function moveActive(rowDelta: number, colDelta: number) {
    const colCount = grid.getColCount();
    if (!active) {
      const row = headerRow ? 1 : 0;
      selectCell(row, 0);
      reveal(row, 0);
      return;
    }
    const current = active;
    const nextCol = Math.max(0, Math.min(colCount - 1, current.col + colDelta));
    let nextRow = current.row + rowDelta;
    if (headerRow) nextRow = Math.max(0, nextRow);
    const maxRow = grid.getRowCount() - 1;
    nextRow = Math.max(0, Math.min(maxRow, nextRow));
    selectCell(nextRow, nextCol);
    reveal(nextRow, nextCol);
  }

  function reveal(row: number, col: number) {
    const node = scroller;
    if (!node) return;
    const edges = cellDocumentRect({
      col,
      top: 0,
      widths,
      height: SHEET_ROW_HEIGHT,
    });
    if (!edges) return;
    if (edges.x < node.scrollLeft + 48) {
      node.scrollLeft = Math.max(0, edges.x - 48);
    } else if (edges.x + edges.width > node.scrollLeft + node.clientWidth) {
      node.scrollLeft = edges.x + edges.width - node.clientWidth;
    }
    if (headerRow && row === 0) return;
    const index = bodyIndex(row);
    if (index < 0) return;
    const top = rowOffsets ? (rowOffsets[index] ?? 0) : index * SHEET_ROW_HEIGHT;
    const height = rowOffsets
      ? (rowOffsets[index + 1] ?? top) - top
      : SHEET_ROW_HEIGHT;
    const chrome = chromeHeight(headerRow);
    if (top < node.scrollTop) node.scrollTop = top;
    else if (top + height > node.scrollTop + node.clientHeight - chrome) {
      node.scrollTop = top + height - (node.clientHeight - chrome);
    }
  }

  function editorStyle(): string {
    if (!editing || !active) return "display: none";
    const header = headerRow && active.row === 0;
    const index = header ? 0 : bodyIndex(active.row);
    if (!header && index < 0) return "display: none";
    const rowTop = rowOffsets ? (rowOffsets[index] ?? 0) : index * SHEET_ROW_HEIGHT;
    const rowHeight = rowOffsets
      ? (rowOffsets[index + 1] ?? rowTop) - rowTop
      : SHEET_ROW_HEIGHT;
    const top = header
      ? SHEET_LETTER_HEIGHT
      : chromeHeight(headerRow) + rowTop - scrollTop;
    const rect = cellDocumentRect({
      col: active.col,
      top,
      widths,
      height: header ? SHEET_HEADER_HEIGHT : rowHeight,
    });
    if (!rect) return "display: none";
    return `left: ${rect.x - scrollLeft}px; top: ${rect.y}px; width: ${rect.width}px; height: ${rect.height}px;`;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button === 2) return;
    menu = null;
    if (editing) commitEdit();
    const hit = hitAt(event);
    if (!hit) return;
    scroller?.focus();
    if (hit.kind === "resize") {
      drag = {
        kind: "resize",
        axis: "cell",
        col: hit.col,
        index: 0,
        startWidth: widths[hit.col] ?? 0,
        startX: event.clientX,
        moved: false,
      };
      capturePointer(event.pointerId);
      return;
    }
    if (hit.kind === "sort") {
      onSort(hit.col);
      return;
    }
    if (hit.kind === "corner") {
      selectAll();
      return;
    }
    if (hit.kind === "header") {
      selectCell(0, hit.col);
      if (event.detail >= 2) beginEdit();
      return;
    }
    if (hit.kind === "letter") {
      selectColumns(hit.col, hit.col);
      drag = {
        kind: "select",
        axis: "column",
        col: hit.col,
        index: 0,
        startWidth: 0,
        startX: event.clientX,
        moved: true,
      };
      capturePointer(event.pointerId);
      return;
    }
    if (hit.kind === "row" && hit.index < 0) {
      selectRows(-1, -1);
      drag = {
        kind: "select",
        axis: "row",
        col: 0,
        index: -1,
        startWidth: 0,
        startX: event.clientX,
        moved: true,
      };
      capturePointer(event.pointerId);
      return;
    }
    const row = gridRow(hit.index);
    const col = hit.kind === "row" ? 0 : hit.col;
    if (row < 0) return;
    if (hit.kind === "row") {
      selectRows(hit.index, hit.index);
      drag = {
        kind: "select",
        axis: "row",
        col: 0,
        index: hit.index,
        startWidth: 0,
        startX: event.clientX,
        moved: true,
      };
      capturePointer(event.pointerId);
      return;
    }
    selectCell(row, col);
    if (event.detail >= 2) {
      beginEdit();
      return;
    }
    drag = {
      kind: "select",
      axis: "cell",
      col,
      index: hit.index,
      startWidth: 0,
      startX: event.clientX,
      moved: false,
    };
    selection = {
      startIndex: drag.index,
      endIndex: drag.index,
      startCol: col,
      endCol: col,
    };
    capturePointer(event.pointerId);
  }

  function capturePointer(pointerId: number) {
    try {
      scroller?.setPointerCapture(pointerId);
    } catch {
      return;
    }
  }

  function onPointerMove(event: PointerEvent) {
    const hit = hitAt(event);
    if (scroller && !drag) {
      scroller.style.cursor = hit?.kind === "resize" ? "col-resize" : "default";
    }
    if (!drag) return;
    if (drag.kind === "resize") {
      const next = [...widths];
      next[drag.col] = clampColumnWidth(drag.startWidth + event.clientX - drag.startX);
      onWidths(next);
      return;
    }
    const current = hitAt(event);
    if (!current) return;
    if (drag.axis === "column" && current.kind !== "corner" && current.kind !== "row") {
      selectColumns(drag.col, current.col);
      return;
    }
    if (drag.axis === "row" && (current.kind === "body" || current.kind === "row")) {
      selectRows(drag.index, current.index);
      return;
    }
    if (current.kind !== "body" && current.kind !== "row" && current.kind !== "header") {
      return;
    }
    const index = current.kind === "header" ? drag.index : current.index;
    const col = current.kind === "row" ? drag.col : current.col;
    if (index !== drag.index || col !== drag.col) drag.moved = true;
    selection = {
      startIndex: Math.min(drag.index, index),
      endIndex: Math.max(drag.index, index),
      startCol: Math.min(drag.col, col),
      endCol: Math.max(drag.col, col),
    };
  }

  function onPointerUp() {
    if (drag?.kind === "select" && drag.axis === "cell" && !drag.moved) selection = null;
    drag = null;
  }

  function onDoubleClick(event: MouseEvent) {
    const hit = hitAt(event as unknown as PointerEvent);
    if (hit?.kind === "resize") {
      fitColumn(hit.col);
      return;
    }
    if (hit?.kind === "header") {
      selectCell(0, hit.col);
      beginEdit();
      return;
    }
    if (hit?.kind === "body" && active) beginEdit();
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    scroller?.focus();
    if (editing) commitEdit();
    const hit = hitAt(event as unknown as PointerEvent);
    const point = scroller?.getBoundingClientRect();
    const x = point ? event.clientX - point.left : 0;
    const y = point ? event.clientY - point.top : 0;
    if (hit?.kind === "corner" || (commandTarget === "sheet" && hit)) {
      selectAll();
      menu = {
        x,
        y,
        target: "sheet",
        row: headerRow ? 0 : Math.max(0, gridRow(0)),
        col: 0,
      };
      return;
    }
    const target = hit ? sheetMenuTarget(hit) : null;
    if (!hit || !target) {
      menu = null;
      return;
    }
    if (target === "column" && "col" in hit) {
      selectColumns(hit.col, hit.col);
      menu = { x, y, target, row: headerRow ? 0 : Math.max(0, gridRow(0)), col: hit.col };
      return;
    }
    if (target === "row" && hit.kind === "row") {
      selectRows(hit.index, hit.index);
      menu = { x, y, target, row: hit.index < 0 ? 0 : gridRow(hit.index), col: 0 };
      return;
    }
    if (hit.kind !== "body") {
      menu = null;
      return;
    }
    const row = gridRow(hit.index);
    if (row < 0) {
      menu = null;
      return;
    }
    selectCell(row, hit.col);
    menu = { x, y, target: "cell", row, col: hit.col };
  }

  function closeMenu(action: () => void, keepSelection = false) {
    action();
    menu = null;
    if (!keepSelection) selection = null;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (editing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (commandTarget === "cell") beginEdit();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveActive(0, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveActive(0, -1);
    } else if (event.key === "Tab") {
      event.preventDefault();
      moveActive(0, event.shiftKey ? -1 : 1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      if (
        (commandTarget === "column" || commandTarget === "row" || commandTarget === "sheet") &&
        commandAt
      ) {
        applyCommand("delete", commandAt.row, commandAt.col, commandTarget);
        selection = null;
        return;
      }
      if (!active) return;
      onCellChange(active.row, active.col, "");
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (commandTarget !== "cell") return;
      event.preventDefault();
      beginEdit(event.key);
    }
  }

  function onEditorKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
      moveActive(1, 0);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      scroller?.focus();
    } else if (event.key === "Tab") {
      event.preventDefault();
      commitEdit();
      moveActive(0, event.shiftKey ? -1 : 1);
    }
  }
</script>

<div class="csv-sheet-stage">
  <CsvSheetToolbar
    {reference}
    commands={toolbarCommands}
    {wrap}
    {colours}
    {headerRow}
    {canUndo}
    {canRedo}
    {onUndo}
    {onRedo}
    onAddress={goToAddress}
    onCommand={(id) => {
      const at = commandAt;
      const target = commandTarget;
      if (!at || !target) return;
      const keep = id === "clear" || (target === "cell" && id === "delete");
      closeMenu(() => applyCommand(id, at.row, at.col, target), keep);
    }}
    onWrap={(value) => {
      wrap = value;
    }}
    onColours={(value) => {
      colours = value;
    }}
    onHeaderRow={(value) => onHeaderRow(value)}
  />
  <div class="csv-sheet-body">
  <div
    class="csv-sheet"
    data-testid="csv-sheet"
    data-column-width-0={widths[0] ?? 0}
    tabindex="0"
    role="grid"
    aria-rowcount={grid.getRowCount()}
    aria-colcount={grid.getColCount()}
    {@attach holdScroller}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    ondblclick={onDoubleClick}
    oncontextmenu={onContextMenu}
    onkeydown={onKeyDown}
  >
    <div class="csv-sheet__spacer" style:width="{size.width}px" style:height="{size.height}px"></div>
  </div>
  <canvas
    class="csv-sheet__canvas"
    aria-hidden="true"
    {@attach holdCanvas}
    {@attach paintAttachment}
  ></canvas>
  <div class="csv-sheet__sorts">
    {#each sortButtons as button (button.col)}
      <Button
        class="csv-sheet__sort"
        style="left: {button.left}px; top: {button.top}px; width: {button.width}px; height: {button.height}px; --csv-sort-fill: {button.fill};"
        variant="ghost"
        size="icon"
        aria-label={button.label}
        aria-pressed={button.direction != null}
        onclick={(event) => {
          event.stopPropagation();
          onSort(button.col);
        }}
        oncontextmenu={onContextMenu}
      >
        {#if button.direction === "asc"}
          <ChevronUpIcon class="csv-data-table__header-icon" />
        {:else if button.direction === "desc"}
          <ChevronDownIcon class="csv-data-table__header-icon" />
        {:else}
          <ArrowUpDownIcon class="csv-data-table__header-icon" />
        {/if}
      </Button>
    {/each}
  </div>
  {#if editing}
    <input
      class="csv-sheet__editor"
      data-testid="csv-sheet-editor"
      style={editorStyle()}
      bind:value={editorValue}
      aria-label="Edit cell"
      {@attach holdEditor}
      onkeydown={onEditorKeyDown}
      onblur={commitEdit}
    />
  {/if}
  {#if menu}
    <div
      class="csv-sheet__menu"
      style:left="{menu.x}px"
      style:top="{menu.y}px"
      role="menu"
      data-sheet-menu={menu.target}
    >
      {#each menuItems as item (item.id)}
        <button
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onclick={() => {
            const current = menu;
            if (!current) return;
            const keep =
              item.id === "clear" || (current.target === "cell" && item.id === "delete");
            closeMenu(() => applyCommand(item.id, current.row, current.col, current.target), keep);
          }}
        >
          <SheetGlyph command={item.id} />
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
  </div>
</div>

<style>
  .csv-sheet-stage {
    display: flex;
    flex-direction: column;
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .csv-sheet-body {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .csv-sheet {
    position: absolute;
    inset: 0;
    overflow: auto;
    outline: none;
  }

  .csv-sheet__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .csv-sheet__sorts {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    pointer-events: none;
  }

  :global(.csv-sheet__sort) {
    position: absolute;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    padding: 1px;
    background: var(--csv-sort-fill, transparent);
    pointer-events: auto;
  }

  :global(.csv-sheet__sort:hover) {
    background: color-mix(in srgb, var(--foreground) 10%, var(--csv-sort-fill, transparent));
  }

  .csv-sheet__editor {
    position: absolute;
    z-index: 2;
    box-sizing: border-box;
    margin: 0;
    border: 2px solid var(--table-selection-border-color, #2563eb);
    padding: 0 6px;
    background: var(--csv-shell-background, #fff);
    color: var(--csv-text-color, inherit);
    font: inherit;
    font-family: var(--csv-font-mono);
    font-size: 13px;
  }

  .csv-sheet__menu {
    position: absolute;
    z-index: 3;
    display: grid;
    min-width: 11rem;
    padding: 0.25rem;
    border: 1px solid var(--csv-surface-border, var(--border));
    border-radius: 0.375rem;
    background: var(--csv-shell-background, var(--background));
    box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
    color: var(--csv-text-color, var(--foreground));
    font-family: var(--font-interface, var(--font-sans, ui-sans-serif, system-ui, sans-serif));
    font-size: 13px;
    font-weight: 400;
    line-height: 1.3;
  }

  .csv-sheet__menu button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 0;
    background: transparent;
    color: inherit;
    padding: 0.35rem 0.5rem;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }

  .csv-sheet__menu button:hover {
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
  }

  .csv-sheet__menu button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .csv-sheet__menu button:disabled:hover {
    background: transparent;
  }
</style>
