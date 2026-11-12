import { afterAll, describe, expect, it, vi } from "vitest";
import { DateTime, Settings } from "luxon";
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);
const { Context, Decimal } = await import("peaql");
const { TFile } = await import("@lapis-notes/api");
await import("./functions");
const { BasesTable } = await import("./db");
const { generateQuery } = await import("./filter-parser");
const { time } = await import("./functions-core");
const previousNow = Settings.now;
const previousZone = Settings.defaultZone;
Settings.now = () => Date.UTC(2026, 10, 12, 12, 34, 56);
Settings.defaultZone = "UTC";
afterAll(() => {
  Settings.now = previousNow;
  Settings.defaultZone = previousZone;
});

function evaluate(expression: string) {
  const db = Context.create(
    new BasesTable("bases").withPropertyColumns({ due: DateTime }).data(() => [
      {
        id: "one",
        file: new TFile("One.md", { ctime: 0, mtime: 0, size: 1 }, null),
        cache: {
          frontmatter: { due: DateTime.fromISO("2025-01-02T12:30:45") },
        },
      },
    ])
  ).withDefaultTable("bases");
  const query = generateQuery(
    {
      type: "table",
      name: "Table",
      order: ["formula.result"],
      sort: [],
      filter: { and: [] },
      limit: 0,
    } as import("./models").BasesViewBase,
    { result: expression }
  );
  const [, rows] = db.execute(query) as [unknown, unknown[][]];
  const value = rows[0][0];
  return value instanceof Decimal
    ? value.number
    : value instanceof DateTime
    ? value.toISO()
    : value;
}

describe("Bases date helper query compatibility", () => {
  it("formats native JavaScript dates as a clock time", () => {
    expect(time(new Date("2025-01-02T12:30:45Z"))).toBe("12:30:45");
  });
  it.each([
    ['number(date("1970-01-02"))', 86400000],
    ["today().hour", 0],
    ["today().minute", 0],
    ['today().format("YYYY-MM-DD HH:mm:ss")', "2026-11-12 00:00:00"],
    ['now().date().format("YYYY-MM-DD HH:mm:ss")', "2026-11-12 00:00:00"],
    ['date("2025-01-02T12:30:45").date()', "2025-01-02T00:00:00.000Z"],
    ['date("2025-01-02").format("YYYY-MM-DD")', "2025-01-02"],
    ['date("2025-01-02").format("[On] MMMM Do, YYYY")', "On January 2nd, 2025"],
    ['date("2025-01-02T12:30:45").time()', "12:30:45"],
    ["note.due.time()", "12:30:45"],
    ["note.due.hour", 12],
    ["file.mtime.hour", 0],
    ['".time() today() number(date())"', ".time() today() number(date())"],
    ['format("%s", "native")', "native"],
    ['"%s".format("native")', "native"],
  ])("executes %s through a generated formula", (expression, expected) => {
    expect(evaluate(expression as string)).toEqual(expected);
  });
});
