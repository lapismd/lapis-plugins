<script lang="ts">
  import type { CsvColumnSortDirection } from "../model/csv-column-sort";
  import type { CsvGrid } from "../model/csv-grid";
  import { paintSheet, type SheetPaintTheme } from "./sheet-paint";
  import {
    SHEET_HEADER_HEIGHT,
    SHEET_LETTER_HEIGHT,
    SHEET_ROW_HEIGHT,
    cellDocumentRect,
    chromeHeight,
    clampColumnWidth,
    hitTestSheet,
    sheetContentSize,
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
    onInsertRow,
    onDeleteRow,
    onInsertColumn,
    onDeleteColumn,
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
    onInsertRow: (index: number) => void;
    onDeleteRow: (index: number) => void;
    onInsertColumn: (index: number) => void;
    onDeleteColumn: (index: number) => void;
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
  let menu = $state<{ x: number; y: number; row: number; col: number } | null>(
    null,
  );
  let drag: {
    kind: "select" | "resize";
    col: number;
    index: number;
    startWidth: number;
    startX: number;
    moved: boolean;
  } | null = null;
  let selectOnEdit = false;

  const size = $derived(sheetContentSize(widths, bodyRows.length, headerRow));
  const theme = $derived(readTheme(canvas));
  const paintModel = $derived({
    widths,
    headerRow,
    headerLabels: grid.getRows()[0] ?? [],
    rowLabels: bodyRows.map((row) => String(headerRow ? row : row + 1)),
    body: bodyRows.map((row) => grid.getRows()[row] ?? []),
    scrollLeft,
    scrollTop,
    viewportWidth,
    viewportHeight,
    active: activeCellPaint(),
    selection,
    search: searchPaint(),
    sort: sort ? { col: sort.index, direction: sort.direction } : null,
    theme,
  });

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
    if (!active) return null;
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
    });
  }

  function selectCell(row: number, col: number) {
    active = { row, col };
    selection = null;
    editing = false;
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
    const top = index * SHEET_ROW_HEIGHT;
    const chrome = chromeHeight(headerRow);
    if (top < node.scrollTop) node.scrollTop = top;
    else if (top + SHEET_ROW_HEIGHT > node.scrollTop + node.clientHeight - chrome) {
      node.scrollTop = top + SHEET_ROW_HEIGHT - (node.clientHeight - chrome);
    }
  }

  function editorStyle(): string {
    if (!editing || !active) return "display: none";
    const header = headerRow && active.row === 0;
    const index = header ? 0 : bodyIndex(active.row);
    if (!header && index < 0) return "display: none";
    const top = header
      ? SHEET_LETTER_HEIGHT
      : chromeHeight(headerRow) + index * SHEET_ROW_HEIGHT - scrollTop;
    const rect = cellDocumentRect({
      col: active.col,
      top,
      widths,
      height: header ? SHEET_HEADER_HEIGHT : SHEET_ROW_HEIGHT,
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
        col: hit.col,
        index: 0,
        startWidth: widths[hit.col] ?? 0,
        startX: event.clientX,
        moved: false,
      };
      capturePointer(event.pointerId);
      return;
    }
    if (hit.kind === "letter") {
      onSort(hit.col);
      return;
    }
    if (hit.kind === "corner") return;
    const row = hit.kind === "header" ? 0 : gridRow(hit.index);
    const col = hit.kind === "row" ? 0 : hit.col;
    if (row < 0) return;
    selectCell(row, col);
    if (event.detail >= 2 && hit.kind !== "row") {
      beginEdit();
      return;
    }
    if (hit.kind === "body" || hit.kind === "row") {
      drag = {
        kind: "select",
        col,
        index: hit.kind === "row" ? hit.index : hit.index,
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
    if (!current || (current.kind !== "body" && current.kind !== "row" && current.kind !== "header")) {
      return;
    }
    const index = current.kind === "header" ? drag.index : current.kind === "row" ? current.index : current.index;
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
    if (drag?.kind === "select" && !drag.moved) selection = null;
    drag = null;
  }

  function onDoubleClick() {
    if (active) beginEdit();
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    const hit = hitAt(event as unknown as PointerEvent);
    const row =
      hit?.kind === "header"
        ? 0
        : hit?.kind === "body" || hit?.kind === "row"
          ? gridRow(hit.index)
          : (active?.row ?? 0);
    const col = hit && "col" in hit ? hit.col : (active?.col ?? 0);
    if (row >= 0) selectCell(row, col);
    const point = scroller?.getBoundingClientRect();
    menu = {
      x: point ? event.clientX - point.left : 0,
      y: point ? event.clientY - point.top : 0,
      row,
      col,
    };
  }

  function onKeyDown(event: KeyboardEvent) {
    if (editing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      beginEdit();
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
      if (!active) return;
      event.preventDefault();
      onCellChange(active.row, active.col, "");
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
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
    <div class="csv-sheet__menu" style:left="{menu.x}px" style:top="{menu.y}px" role="menu">
      <button type="button" role="menuitem" onclick={() => { onInsertRow(menu?.row ?? 0); menu = null; }}>Insert row above</button>
      <button type="button" role="menuitem" onclick={() => { onInsertRow((menu?.row ?? 0) + 1); menu = null; }}>Insert row below</button>
      <button type="button" role="menuitem" onclick={() => { onDeleteRow(menu?.row ?? 0); menu = null; }}>Delete row</button>
      <button type="button" role="menuitem" onclick={() => { onInsertColumn(menu?.col ?? 0); menu = null; }}>Insert column left</button>
      <button type="button" role="menuitem" onclick={() => { onInsertColumn((menu?.col ?? 0) + 1); menu = null; }}>Insert column right</button>
      <button type="button" role="menuitem" onclick={() => { onDeleteColumn(menu?.col ?? 0); menu = null; }}>Delete column</button>
    </div>
  {/if}
</div>

<style>
  .csv-sheet-stage {
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
  }

  .csv-sheet__menu button {
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
</style>
