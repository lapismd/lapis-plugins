import { describe, expect, it, vi } from "vitest";
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

function evaluate(expression: string) {
  const db = Context.create(
    new BasesTable("bases")
      .withPropertyColumns({
        items: Array,
        nested: Array,
        empty: Array,
        offset: Number,
      })
      .data(() => [
        {
          id: "one",
          file: new TFile("One.md", { ctime: 0, mtime: 0, size: 1 }, null),
          cache: {
            frontmatter: {
              items: [1, 2, 3],
              nested: [1, [2, 3]],
              empty: [],
              offset: 10,
            },
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
  function plain(value: unknown): unknown {
    if (value instanceof Decimal) return value.number;
    return Array.isArray(value) ? value.map(plain) : value;
  }
  return plain(rows[0][0]);
}

describe("Bases collection query compatibility", () => {
  it.each([
    ["[1,2,3].contains(2)", true],
    ["[1,2,3].contains(4)", false],
    ["[1,2,3].containsAll(2,3)", true],
    ["[1,2,3].containsAny(3,4)", true],
    ["[1,2,3].reverse()", [3, 2, 1]],
    ["[1,2,3,4].slice(1,3)", [2, 3]],
    ["[1,2,3].slice(-2)", [2, 3]],
    ["[30,1,2].sort()", [1, 2, 30]],
    ["[10.5,2.5,1.5].sort()", [1.5, 2.5, 10.5]],
    ["[1.5,2.5].contains(1.5)", true],
    ["[1.5,1.5,2.5].unique()", [1.5, 2.5]],
    ["[1,2,2,3].unique()", [1, 2, 3]],
    ['[1,2,3].join(",")', "1,2,3"],
    ["note.items.reverse()", [3, 2, 1]],
    ["note.nested.flat()", [1, 2, 3]],
    ["note.empty.isEmpty()", true],
    ["[1,2,3,4].filter(value > 2)", [3, 4]],
    ["[1,2,3,4].filter(index > 1)", [3, 4]],
    ["[1,2,3].reduce(acc + value, 0)", 6],
    ["note.items.reduce(acc + value + index, note.offset)", 19],
    ["note.empty.reduce(acc + value, 10)", 10],
    ["[1,2,3].map(value + index)", [1, 3, 5]],
    ['["a","b"].reduce(acc + value, "")', "ab"],
    ['[1,2,3].filter(value.isType("number"))', [1, 2, 3]],
    [
      "[1,2].map(note.items.map(value + index))",
      [
        [1, 3, 5],
        [1, 3, 5],
      ],
    ],
    ["[0,1,2].filter(value)", [1, 2]],
    ["[1,2].map(value + note.offset)", [11, 12]],
    ["[].isEmpty()", true],
    ["[null]", [null]],
    ["[[1,2]]", [[1, 2]]],
    ['[null,0,false,""]', [null, 0, false, ""]],
    ["[null].map(value)", [null]],
    ["[1,[2,3]].flat()", [1, 2, 3]],
    ["'note[\"value\"] [1,2]'", 'note["value"] [1,2]'],
    ['".filter(value == 1)"', ".filter(value == 1)"],
  ])("executes %s through a generated formula", (expression, expected) => {
    expect(evaluate(expression as string)).toEqual(expected);
  });
});
