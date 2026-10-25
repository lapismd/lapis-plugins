<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
  } from "@dnd-kit/dom";
  import { onMount, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ContextMenu from "@lapismd/design-core/shadcn/context-menu";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import CodeIcon from "@lucide/svelte/icons/code";
  import { cn } from "@lapis-notes/ui";
  import { Menu } from "@lapis-notes/api";
  import { ContextMenu as MenuComponent } from "@lapis-notes/api/menu";
  import { CsvGrid } from "../model/csv-grid";
  import {
    headerLabelsFromGrid,
    rowsFromGrid,
    type CsvTableRow,
  } from "../model/csv-table-model";
  import {
    coordsFromCellElement,
    columnSelectionIncludingHeader,
    createSelectionState,
    fullRowsAndColumns,
    getCellsBetween,
    headerSelectionClassForColumn,
    rowSelection,
    selectionClassesForCells,
    type CsvCellCoord,
  } from "./csv-table-selection";
  import type { CsvTableDragSource } from "./csv-table-dnd";
  import { tableReorderSensors } from "@lapis-notes/ui/table-dnd/sensors";
  import {
    measureColumnOverlayMetrics,
    measureRowOverlayMetrics,
    type CsvDragOverlayMetrics,
  } from "./csv-table-drag-measure";
  import CsvCell from "./csv-cell.svelte";
  import CsvDataTableColumnHead from "./csv-data-table-column-head.svelte";
  import CsvDataTableColumnHeader from "./csv-data-table-column-header.svelte";
  import CsvDataTableDataCell from "./csv-data-table-data-cell.svelte";
  import CsvDataTableRowGripCell from "./csv-data-table-row-grip-cell.svelte";
  import CsvDataTableDragOverlay from "./csv-data-table-drag-overlay.svelte";
  import CsvDataTableRow from "./csv-data-table-row.svelte";
  import CsvDataTableRowActions from "./csv-data-table-row-actions.svelte";
  import {
    createCsvRowVirtualizer,
    CSV_ROW_HEIGHT,
    CSV_ROW_OVERSCAN,
  } from "./csv-row-virtualizer.svelte";

  type Props = {
    grid: CsvGrid;
    headerRow: boolean;
    showRowNumbers: boolean;
    scrollViewport?: HTMLElement | null;
    /** Grid row indexes to keep. Null shows every body row. */
    rowFilter?: ReadonlySet<number> | null;
    searchCell?: { row: number; col: number } | null;
    onChange: (grid: CsvGrid) => void;
    onSettingsChange?: (patch: { headerRow?: boolean }) => void;
    onToggleSource?: () => void;
  };

  let {
    grid,
    headerRow,
    showRowNumbers,
    scrollViewport = null,
    rowFilter = null,
    searchCell = null,
    onChange,
    onSettingsChange,
    onToggleSource,
  }: Props = $props();

  const colCount = $derived(grid.getColCount());
  const tableData = $derived.by(() => {
    const body = rowsFromGrid(grid, headerRow);
    const filter = rowFilter;
    if (!filter) return body;
    return body.filter((row) => filter.has(row.rowIndex));
  });
  const headerLabels = $derived(
    headerLabelsFromGrid(grid, headerRow, colCount),
  );
  const bodyRowIndices = $derived(tableData.map((row) => row.rowIndex));
  const columnSpan = $derived(colCount + (showRowNumbers ? 1 : 0) + 1);
  const rowVirtualizer = createCsvRowVirtualizer();
  const visibleRows = $derived(rowVirtualizer.items);
  const totalSize = $derived(rowVirtualizer.totalSize);

  $effect(() => {
    const count = tableData.length;
    const viewport = scrollViewport;
    untrack(() => {
      rowVirtualizer.setOptions({
        count,
        enabled: viewport != null,
        estimateSize: () => CSV_ROW_HEIGHT,
        getScrollElement: () => viewport,
        overscan: CSV_ROW_OVERSCAN,
      });
    });
  });

  const rowPadding = $derived.by(() => {
    const items = visibleRows;
    if (items.length === 0) return { top: 0, bottom: 0 };
    const last = items[items.length - 1];
    return {
      top: Math.max(0, items[0].start),
      bottom: Math.max(0, totalSize - last.end),
    };
  });

  const selectionPos = createSelectionState();
  let selected: CsvCellCoord[] = $state([]);
  let menuCoords: CsvCellCoord = $state([-1, -1]);
  let dragSource: CsvTableDragSource | null = $state(null);
  let dragOverIndex: number | null = $state(null);
  let dragOverlayMetrics: CsvDragOverlayMetrics | null = $state(null);

  const selectedClasses = $derived(selectionClassesForCells(selected));

  function emitChange(nextGrid: CsvGrid = grid) {
    onChange(nextGrid.clone());
  }

  function updateCell(row: number, col: number, value: string) {
    grid.updateCell(row, col, value);
    emitChange();
  }

  function updateHeaderLabel(colIndex: number, value: string) {
    if (!headerRow) {
      const labels = headerLabelsFromGrid(grid, false, colCount);
      labels[colIndex] = value;
      grid.ensureHeaderRow(labels);
      onSettingsChange?.({ headerRow: true });
    }
    grid.updateCell(0, colIndex, value);
    emitChange();
  }

  function insertRowAt(index: number) {
    grid.insertRowAt(index);
    emitChange();
  }

  function deleteRowAt(index: number) {
    grid.deleteRowAt(index);
    selected = [];
    emitChange();
  }

  function insertColumnAt(index: number) {
    grid.insertColumnAt(index);
    emitChange();
  }

  function deleteColumnAt(index: number) {
    grid.deleteColumnAt(index);
    selected = [];
    emitChange();
  }

  function moveColumnAt(from: number, to: number) {
    grid.moveColumnAt(from, to);
    emitChange();
  }

  function moveRowAt(from: number, to: number) {
    grid.moveRowAt(from, to);
    emitChange();
  }

  function sortColumn(index: number, ascending: boolean) {
    grid.sortColumn(index, ascending, headerRow ? 1 : 0);
    emitChange();
  }

  function clearCells(cells: CsvCellCoord[]) {
    grid.clearCellsAt(cells);
    selected = [];
    emitChange();
  }

  function deleteCells(cells: CsvCellCoord[]) {
    const { fullRows, fullCols } = fullRowsAndColumns(
      cells,
      grid.getRowCount(),
      colCount,
    );
    if (fullRows.length + fullCols.length > 0) {
      fullRows.sort((a, b) => b - a).forEach((row) => grid.deleteRowAt(row));
      fullCols.sort((a, b) => b - a).forEach((col) => grid.deleteColumnAt(col));
    } else {
      grid.clearCellsAt(cells);
    }
    selected = [];
    emitChange();
  }

  function navigateFrom(
    row: number,
    col: number,
    direction: "next" | "prev" | "down" | "up",
  ) {
    const maxRow = grid.getRowCount() - 1;
    const maxCol = colCount - 1;
    let nextRow = row;
    let nextCol = col;

    switch (direction) {
      case "next":
        if (nextCol < maxCol) nextCol += 1;
        else if (nextRow < maxRow) {
          nextRow += 1;
          nextCol = 0;
        }
        break;
      case "prev":
        if (nextCol > 0) nextCol -= 1;
        else if (nextRow > 0) {
          nextRow -= 1;
          nextCol = maxCol;
        }
        break;
      case "down":
        if (nextRow < maxRow) nextRow += 1;
        break;
      case "up":
        if (nextRow > 0) nextRow -= 1;
        break;
    }

    const target = document.querySelector<HTMLElement>(
      `[data-csv-cell="${nextRow}:${nextCol}"]`,
    );
    target
      ?.querySelector<HTMLElement>(".csv-cell__display, .csv-cell__input")
      ?.focus();
  }

  function onMouseDown(evt: MouseEvent) {
    if (evt.button !== 0) {
      return;
    }
    if ((evt.target as HTMLElement).closest(".csv-cell__input")) {
      return;
    }
    selected = [];
    selectionPos.isMouseDown = true;
    selectionPos.start = coordsFromCellElement(
      evt.target as HTMLElement,
      evt.currentTarget,
    );
    evt.preventDefault();
  }

  function onMouseOver(evt: MouseEvent) {
    if (!selectionPos.isMouseDown) {
      return;
    }
    selectionPos.end = coordsFromCellElement(
      evt.target as HTMLElement,
      evt.currentTarget,
    );
    selected = getCellsBetween(selectionPos.start, selectionPos.end);
    evt.preventDefault();
  }

  const handleDocumentMouseOver = (evt: MouseEvent) => {
    if (!selectionPos.isMouseDown) {
      return;
    }
    onMouseOver(evt);
  };

  function selectColumn(column: number) {
    setTimeout(() => {
      selected = columnSelectionIncludingHeader(
        grid.getRowCount(),
        column,
        headerRow,
        bodyRowIndices,
      );
    });
  }

  function selectRowByIndex(rowIndex: number) {
    setTimeout(() => {
      selected = rowSelection(colCount, rowIndex);
    });
  }

  function selectRow(row: CsvTableRow) {
    selectRowByIndex(row.rowIndex);
  }

  function handleDragOver(event: DragOverEvent) {
    const target = event.operation.target?.data as
      | { type: string; index: number }
      | undefined;
    if (
      target &&
      dragSource &&
      target.type === dragSource.type &&
      target.index !== dragSource.index
    ) {
      dragOverIndex = target.index;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.operation.source?.data as
      | { type: string; index: number }
      | undefined;
    const table = event.operation.source?.element?.closest(".csv-data-table");
    if (data?.type === "csv-table-col") {
      dragSource = { type: "csv-table-col", index: data.index };
      selected = columnSelectionIncludingHeader(
        grid.getRowCount(),
        data.index,
        headerRow,
        bodyRowIndices,
      );
      dragOverlayMetrics =
        table instanceof HTMLElement
          ? measureColumnOverlayMetrics(table, data.index)
          : null;
    } else if (data?.type === "csv-table-row") {
      dragSource = { type: "csv-table-row", index: data.index };
      selected = rowSelection(colCount, data.index);
      dragOverlayMetrics =
        table instanceof HTMLElement
          ? measureRowOverlayMetrics(table, data.index)
          : null;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const source = event.operation.source?.data as
      | { type: string; index: number }
      | undefined;
    const target = event.operation.target?.data as
      | { type: string; index: number }
      | undefined;
    const targetIndex =
      target &&
      source &&
      target.type === source.type &&
      target.index !== source.index
        ? target.index
        : dragOverIndex;

    if (
      !event.canceled &&
      source &&
      targetIndex !== null &&
      source.index !== targetIndex
    ) {
      if (source.type === "csv-table-col") {
        moveColumnAt(source.index, targetIndex);
        selectColumn(targetIndex);
      } else if (source.type === "csv-table-row") {
        moveRowAt(source.index, targetIndex);
        selectRowByIndex(targetIndex);
      }
    }

    dragSource = null;
    dragOverIndex = null;
    dragOverlayMetrics = null;
  }

  function menuEvent(
    cb: (props: { row: number; col: number; evt: Event }) => void,
  ) {
    return (evt: MouseEvent | KeyboardEvent) => {
      const [row, col] = menuCoords;
      if (row === -1 || col === -1) {
        return;
      }
      cb({ row, col, evt });
      menuCoords = [-1, -1];
    };
  }

  function createMenu() {
    const menu = new Menu();

    if (!selected.length) {
      menu
        .addMenu((submenu) => {
          submenu
            .setTitle("Row")
            .addItem((item) =>
              item
                .setTitle("Insert row above")
                .setIcon("between-vertical-start")
                .onClick(menuEvent(({ row }) => insertRowAt(row))),
            )
            .addItem((item) =>
              item
                .setTitle("Insert row below")
                .setIcon("between-vertical-end")
                .onClick(menuEvent(({ row }) => insertRowAt(row + 1))),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Move row up")
                .setIcon("arrow-up")
                .onClick(
                  menuEvent(({ row }) => {
                    if (row > 0) moveRowAt(row, row - 1);
                  }),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Move row down")
                .setIcon("arrow-down")
                .onClick(
                  menuEvent(({ row }) => {
                    if (row < grid.getRowCount() - 1) {
                      moveRowAt(row, row + 1);
                    }
                  }),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Delete row")
                .setIcon("trash-2")
                .onClick(menuEvent(({ row }) => deleteRowAt(row))),
            );
        })
        .addMenu((submenu) => {
          submenu
            .setTitle("Column")
            .addItem((item) =>
              item
                .setTitle("Sort A–Z")
                .setIcon("arrow-down-a-z")
                .onClick(menuEvent(({ col }) => sortColumn(col, true))),
            )
            .addItem((item) =>
              item
                .setTitle("Sort Z–A")
                .setIcon("arrow-down-z-a")
                .onClick(menuEvent(({ col }) => sortColumn(col, false))),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Move column left")
                .setIcon("arrow-left")
                .onClick(
                  menuEvent(({ col }) => {
                    if (col > 0) moveColumnAt(col, col - 1);
                  }),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Move column right")
                .setIcon("arrow-right")
                .onClick(
                  menuEvent(({ col }) => {
                    if (col < colCount - 1) moveColumnAt(col, col + 1);
                  }),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Insert column left")
                .setIcon("between-horizontal-start")
                .onClick(menuEvent(({ col }) => insertColumnAt(col))),
            )
            .addItem((item) =>
              item
                .setTitle("Insert column right")
                .setIcon("between-horizontal-end")
                .onClick(menuEvent(({ col }) => insertColumnAt(col + 1))),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Delete column")
                .setIcon("trash-2")
                .onClick(menuEvent(({ col }) => deleteColumnAt(col))),
            );
        });
    } else {
      menu
        .addItem((item) =>
          item
            .setTitle("Delete cells")
            .setIcon("trash-2")
            .onClick(() => deleteCells(selected)),
        )
        .addItem((item) =>
          item
            .setTitle("Clear cells")
            .setIcon("eraser")
            .onClick(() => clearCells(selected)),
        );
    }

    return menu;
  }

  function rainbowClass(colIndex: number, kind: "head" | "cell"): string {
    const slot = (colIndex % 5) + 1;
    return `csv-data-table__${kind} csv-data-table__col-${slot}`;
  }

  function rowValuesForIndex(rowIndex: number): string[] {
    return Array.from({ length: colCount }, (_, colIndex) =>
      grid.getCell(rowIndex, colIndex),
    );
  }

  function columnBodyValuesForIndex(colIndex: number): string[] {
    return tableData.map((row) => row.cells[colIndex] ?? "");
  }

  function displayRowNumberForIndex(rowIndex: number): number {
    const row = tableData.find((entry) => entry.rowIndex === rowIndex);
    return row?.displayRowNumber ?? rowIndex + 1;
  }

  function headerSelectedClass(colIndex: number): string | undefined {
    return headerSelectionClassForColumn(
      colIndex,
      selected,
      headerRow,
      bodyRowIndices,
    );
  }

  onMount(() => {
    const onMouseUp = (evt: MouseEvent) => {
      const target = evt.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          ".csv-data-table__col-grip, .csv-data-table__row-grip, .csv-data-table__header-menu, .csv-data-table__row-actions, [data-grab-handle], [role='menu'], [role='menuitem'], [data-slot='context-menu-content']",
        )
      ) {
        selectionPos.isMouseDown = false;
        return;
      }
      if (!selectionPos.isMouseDown && selected.length && evt.button === 0) {
        setTimeout(() => {
          selected = [];
        });
      }
      selectionPos.isMouseDown = false;
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", handleDocumentMouseOver);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", handleDocumentMouseOver);
    };
  });
</script>

<DragDropProvider
  sensors={tableReorderSensors}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <ContextMenu.Root>
    <ContextMenu.Trigger class="csv-data-table__shell group/trigger">
      <Table.Root
        class="csv-data-table overflow-visible"
        data-csv-row-count={tableData.length}
        data-csv-rendered-rows={visibleRows.length}
      >
        <Table.Header>
          <Table.Row class="csv-data-table__header-row">
            {#if showRowNumbers}
              <Table.Head
                class="csv-data-table__head csv-data-table__head--gutter"
              >
                #
              </Table.Head>
            {/if}
            {#each Array.from({ length: colCount }) as _, colIndex (colIndex)}
              <CsvDataTableColumnHead
                {colIndex}
                {dragSource}
                {dragOverIndex}
                selectedClass={headerSelectedClass(colIndex)}
                isDragSource={dragSource?.type === "csv-table-col" &&
                  dragSource.index === colIndex}
                class={cn(
                  "csv-data-table__head csv-data-table__head--label",
                  rainbowClass(colIndex, "head"),
                )}
              >
                {#snippet children({ attachColGripHandle })}
                  <CsvDataTableColumnHeader
                    title={headerLabels[colIndex] ?? ""}
                    {colIndex}
                    {colCount}
                    isSynthetic={!headerRow}
                    {attachColGripHandle}
                    onSelectColumn={() => selectColumn(colIndex)}
                    onLabelChange={(value) =>
                      updateHeaderLabel(colIndex, value)}
                    onSortAsc={() => sortColumn(colIndex, true)}
                    onSortDesc={() => sortColumn(colIndex, false)}
                    onInsertLeft={() => insertColumnAt(colIndex)}
                    onInsertRight={() => insertColumnAt(colIndex + 1)}
                    onMoveLeft={() => moveColumnAt(colIndex, colIndex - 1)}
                    onMoveRight={() => moveColumnAt(colIndex, colIndex + 1)}
                    onDelete={() => deleteColumnAt(colIndex)}
                  />
                {/snippet}
              </CsvDataTableColumnHead>
            {/each}
            <Table.Head
              class="csv-data-table__head csv-data-table__head--actions"
            >
              {#if !onToggleSource}
                <span class="csv-data-table__actions-label">Row actions</span>
              {/if}
              {#if onToggleSource}
                <Button
                  variant="ghost"
                  size="icon"
                  class="csv-data-table__source-toggle"
                  aria-label="View CSV source"
                  onclick={onToggleSource}
                >
                  <CodeIcon />
                </Button>
              {/if}
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if rowPadding.top > 0}
            <Table.Row aria-hidden="true">
              <Table.Cell
                colspan={columnSpan}
                style="height: {rowPadding.top}px; padding: 0; border: 0;"
              ></Table.Cell>
            </Table.Row>
          {/if}
          {#each visibleRows as virtualRow (virtualRow.key)}
            {@const row = tableData[virtualRow.index]}
            {#if row}
            <CsvDataTableRow
              rowIndex={row.rowIndex}
              virtualIndex={virtualRow.index}
              class="csv-data-table__row group"
              isRowDragSource={dragSource?.type === "csv-table-row" &&
                dragSource.index === row.rowIndex}
            >
              {#snippet children()}
                {#if showRowNumbers}
                  <Table.Cell
                    class="csv-data-table__cell csv-data-table__cell--gutter"
                  >
                    <span class="csv-data-table__rownum"
                      >{row.displayRowNumber}</span
                    >
                  </Table.Cell>
                {/if}
                {#each Array.from( { length: colCount }, ) as _, colIndex (colIndex)}
                  {@const coordId = `${row.rowIndex},${colIndex}`}
                  {@const value = row.cells[colIndex] ?? ""}
                  {@const cellProps = {
                    rowIndex: row.rowIndex,
                    colIndex,
                    dragSource,
                    dragOverIndex,
                    selectedClass: selectedClasses[coordId],
                    isColDragSource:
                      dragSource?.type === "csv-table-col" &&
                      dragSource.index === colIndex,
                    class: rainbowClass(colIndex, "cell"),
                    onmousedown: onMouseDown,
                    onmouseenter: onMouseOver,
                    oncontextmenu: () => {
                      menuCoords = [row.rowIndex, colIndex];
                    },
                  }}
                  {#if colIndex === 0}
                    <CsvDataTableRowGripCell
                      {...cellProps}
                      onSelectRow={() => selectRow(row)}
                    >
                      <div
                        class="csv-data-table__cell-shell"
                        data-csv-cell={`${row.rowIndex}:${colIndex}`}
                        data-csv-search={searchCell?.row === row.rowIndex &&
                        searchCell.col === colIndex
                          ? "active"
                          : undefined}
                        data-csv-selected={selectedClasses[coordId]
                          ? "true"
                          : undefined}
                      >
                        <CsvCell
                          {value}
                          multiline={value.includes("\n")}
                          class="csv-data-table__cell-editor"
                          onContentChange={(nextValue) =>
                            updateCell(row.rowIndex, colIndex, nextValue)}
                          onNavigate={(direction) =>
                            navigateFrom(row.rowIndex, colIndex, direction)}
                        />
                      </div>
                    </CsvDataTableRowGripCell>
                  {:else}
                    <CsvDataTableDataCell {...cellProps}>
                      <div
                        class="csv-data-table__cell-shell"
                        data-csv-cell={`${row.rowIndex}:${colIndex}`}
                        data-csv-search={searchCell?.row === row.rowIndex &&
                        searchCell.col === colIndex
                          ? "active"
                          : undefined}
                        data-csv-selected={selectedClasses[coordId]
                          ? "true"
                          : undefined}
                      >
                        <CsvCell
                          {value}
                          multiline={value.includes("\n")}
                          class="csv-data-table__cell-editor"
                          onContentChange={(nextValue) =>
                            updateCell(row.rowIndex, colIndex, nextValue)}
                          onNavigate={(direction) =>
                            navigateFrom(row.rowIndex, colIndex, direction)}
                        />
                      </div>
                    </CsvDataTableDataCell>
                  {/if}
                {/each}
                <Table.Cell
                  class="csv-data-table__cell csv-data-table__cell--actions"
                >
                  <CsvDataTableRowActions
                    onInsertAbove={() => insertRowAt(row.rowIndex)}
                    onInsertBelow={() => insertRowAt(row.rowIndex + 1)}
                    onDelete={() => deleteRowAt(row.rowIndex)}
                  />
                </Table.Cell>
              {/snippet}
            </CsvDataTableRow>
            {/if}
          {:else}
            {#if tableData.length === 0}
              <Table.Row>
                <Table.Cell colspan={columnSpan} class="csv-data-table__empty">
                  {rowFilter ? "No matching rows" : "No rows"}
                </Table.Cell>
              </Table.Row>
            {/if}
          {/each}
          {#if rowPadding.bottom > 0}
            <Table.Row aria-hidden="true">
              <Table.Cell
                colspan={columnSpan}
                style="height: {rowPadding.bottom}px; padding: 0; border: 0;"
              ></Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </ContextMenu.Trigger>
    <MenuComponent class="csv-data-table__menu" menu={createMenu()} />
  </ContextMenu.Root>
  <CsvDataTableDragOverlay
    {showRowNumbers}
    {headerLabels}
    metrics={dragOverlayMetrics}
    {rainbowClass}
    {rowValuesForIndex}
    {columnBodyValuesForIndex}
    {displayRowNumberForIndex}
  />
</DragDropProvider>
