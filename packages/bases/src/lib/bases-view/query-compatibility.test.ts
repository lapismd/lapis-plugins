import { describe, expect, it, vi } from "vitest";
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);
const { Context } = await import("peaql");
const { TFile } = await import("@lapis-notes/api");
await import("./functions");
const { BasesTable } = await import("./db");
const { generateQuery } = await import("./filter-parser");
const { compileBasesExpression } = await import("./expression-compiler");

const view = {
  type: "table",
  name: "Table",
  order: ["file.path"],
  sort: [],
  filter: { and: [] },
  limit: 0,
} as import("./models").BasesViewBase;
function records() {
  return [
    {
      id: "a",
      file: new TFile("A.md", { ctime: 0, mtime: 0, size: 1 }, null),
      cache: {
        frontmatter: {
          status: "open",
          price: 12,
          age: 3,
          "display name": "Alpha",
          "a.b": "literal",
          file: "frontmatter",
        },
      },
    },
    {
      id: "b",
      file: new TFile("B.md", { ctime: 0, mtime: 0, size: 1 }, null),
      cache: { frontmatter: { status: "done", price: 4, age: 2 } },
    },
    {
      id: "c",
      file: new TFile("C.md", { ctime: 0, mtime: 0, size: 1 }, null),
      cache: { frontmatter: { status: "open", price: 0, age: 1 } },
    },
  ];
}
function run(
  filter: string,
  formulas: Record<string, string> = {},
  sort = view.sort
) {
  const db = Context.create(
    new BasesTable("bases")
      .withPropertyColumns({
        status: String,
        price: Number,
        age: Number,
        "display name": String,
        "a.b": String,
        file: String,
      })
      .data(records)
  ).withDefaultTable("bases");
  const query = generateQuery(
    { ...view, filter: { and: [filter] }, sort },
    formulas
  );
  const [, data] = db.execute(query) as [unknown, any[][]];
  return data.map((row) => row.at(-1).id);
}

describe("Bases query compatibility", () => {
  it("retains native function modifiers while compiling their expressions", () => {
    expect(compileBasesExpression("count(DISTINCT price) > 0")).toContain(
      "count(DISTINCT price)"
    );
  });
  it.each([
    ['status == "open"', ["a", "c"]],
    ['status == "open" && price > 5', ["a"]],
    ["price", ["a", "b"]],
    ["price && age", ["a", "b"]],
    ["!(price)", ["c"]],
    ['note["status"] == "done"', ["b"]],
    ['note["display name"] == "Alpha"', ["a"]],
    ['note["a.b"] == "literal"', ["a"]],
    ['note["file"] == "frontmatter"', ["a"]],
    ['"a==b" == "a==b"', ["a", "b", "c"]],
    ["'a==b' == 'a==b'", ["a", "b", "c"]],
  ])("executes %s", (filter, expected) => {
    expect(run(filter as string)).toEqual(expected);
  });

  it("resolves both formula syntaxes, nested dependencies and precedence", () => {
    const formulas = { ppu: "price / age", next: "(formula.ppu + 1) * 2" };
    expect(run("formula.ppu > 3", formulas)).toEqual(["a"]);
    expect(run('formula["ppu"] > 3', formulas)).toEqual(["a"]);
    expect(run("formula.next == 10", formulas)).toEqual(["a"]);
    expect(run('"formula.ppu" == "formula.ppu"', formulas)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("sorts dotted and bracketed formula IDs by evaluated values", () => {
    for (const property of ["formula.ppu", 'formula["ppu"]']) {
      expect(
        run("true", { ppu: "price / age" }, [
          { property: property as any, direction: "ASC" },
        ])
      ).toEqual(["c", "b", "a"]);
    }
  });

  it("rejects dotted formula cycles without hanging", () => {
    expect(() =>
      generateQuery(
        { ...view, filter: { and: ["formula.a > 0"] } },
        { a: "formula.b", b: "formula.a" }
      )
    ).toThrow(/Circular Bases formula/);
  });

  it("rejects bracketed cycles, unknown references and SQL clauses", () => {
    expect(() =>
      generateQuery(
        { ...view, filter: { and: ['formula["a"] > 0'] } },
        { a: 'formula["a"]' }
      )
    ).toThrow(/Circular Bases formula/);
    expect(() =>
      generateQuery({ ...view, filter: { and: ["formula.missing > 0"] } }, {})
    ).toThrow(/Unknown Bases formula/);
    expect(() =>
      generateQuery(
        { ...view, filter: { and: ["price > 0 ORDER BY price"] } },
        {}
      )
    ).toThrow(/Invalid Bases expression/);
    expect(() => run("price === 12")).toThrow(/Invalid Bases expression/);
  });
});
