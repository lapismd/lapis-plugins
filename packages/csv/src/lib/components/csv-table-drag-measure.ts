export type CsvDragOverlayMetrics = {
  width: number;
  height: number;
  segmentSizes: number[];
};

function readSize(element: HTMLElement): number {
  return element.getBoundingClientRect().width;
}

function readHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height;
}

export function measureRowOverlayMetrics(
  table: HTMLElement,
  rowIndex: number,
): CsvDragOverlayMetrics | null {
  const row = table.querySelector<HTMLElement>(
    `tr[data-csv-row-index="${rowIndex}"]`,
  );
  if (!row) {
    return null;
  }

  const cells = Array.from(
    row.querySelectorAll<HTMLElement>(
      "td.csv-data-table__cell:not(.csv-data-table__cell--actions)",
    ),
  );
  if (!cells.length) {
    return null;
  }

  const segmentSizes = cells.map(readSize);
  const height = Math.max(...cells.map(readHeight));

  return {
    width: segmentSizes.reduce((total, size) => total + size, 0),
    height,
    segmentSizes,
  };
}

export function measureColumnOverlayMetrics(
  table: HTMLElement,
  colIndex: number,
): CsvDragOverlayMetrics | null {
  const head = table.querySelector<HTMLElement>(
    `th[data-csv-col-index="${colIndex}"]`,
  );
  const bodyCells = Array.from(
    table.querySelectorAll<HTMLElement>(`td[data-csv-col-index="${colIndex}"]`),
  );
  const segments = head ? [head, ...bodyCells] : bodyCells;
  if (!segments.length) {
    return null;
  }

  const segmentSizes = segments.map(readHeight);
  const width = Math.max(...segments.map(readSize));

  return {
    width,
    height: segmentSizes.reduce((total, size) => total + size, 0),
    segmentSizes,
  };
}
