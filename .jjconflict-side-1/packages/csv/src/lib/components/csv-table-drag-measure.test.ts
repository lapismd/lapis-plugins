// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  measureColumnOverlayMetrics,
  measureRowOverlayMetrics,
} from "./csv-table-drag-measure";

function cell(
  tag: "td" | "th",
  className: string,
  width: number,
  height: number,
  attrs: Record<string, string> = {},
): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  element.getBoundingClientRect = () =>
    ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return element;
}

describe("csv-table-drag-measure", () => {
  it("measures row overlay width from all visible cells", () => {
    const table = document.createElement("table");
    table.className = "csv-data-table";
    const row = document.createElement("tr");
    row.setAttribute("data-csv-row-index", "1");
    row.append(
      cell("td", "csv-data-table__cell csv-data-table__cell--gutter", 48, 32),
      cell("td", "csv-data-table__cell", 120, 32, {
        "data-csv-col-index": "0",
      }),
      cell("td", "csv-data-table__cell", 160, 32, {
        "data-csv-col-index": "1",
      }),
      cell("td", "csv-data-table__cell csv-data-table__cell--actions", 32, 32),
    );
    table.append(row);
    document.body.append(table);

    expect(measureRowOverlayMetrics(table, 1)).toEqual({
      width: 328,
      height: 32,
      segmentSizes: [48, 120, 160],
    });
  });

  it("measures column overlay height from header and body cells", () => {
    const table = document.createElement("table");
    table.className = "csv-data-table";
    const head = cell(
      "th",
      "csv-data-table__head csv-data-table__head--label",
      96,
      40,
      {
        "data-csv-col-index": "2",
      },
    );
    const bodyA = cell("td", "csv-data-table__cell", 96, 32, {
      "data-csv-col-index": "2",
    });
    const bodyB = cell("td", "csv-data-table__cell", 96, 36, {
      "data-csv-col-index": "2",
    });
    table.append(head, bodyA, bodyB);
    document.body.append(table);

    expect(measureColumnOverlayMetrics(table, 2)).toEqual({
      width: 96,
      height: 108,
      segmentSizes: [40, 32, 36],
    });
  });
});
