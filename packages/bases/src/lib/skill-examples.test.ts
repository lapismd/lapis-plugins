import { describe, expect, it, vi } from "vitest";
import yaml from "js-yaml";
import skills from "@lapis-notes/bases/skills.json";
import { normalizeBasesDocument } from "./bases-view/document-core";
describe("packaged Bases workflow", () => {
  it("keeps both document and view filters in its authored example", () => {
    const example = skills[0].files["SKILL.md"].match(
      /```yaml\n([\s\S]*?)```/,
    )![1];
    const document = normalizeBasesDocument(yaml.load(example));
    expect(document.filters).toEqual({ and: ['file.ext == "md"'] });
    expect(document.views[0].filter).toEqual({ and: ['status == "active"'] });
    expect(document.formulas).toHaveProperty("total", "price * quantity");
  });
});

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
const { Context, Decimal } = await import("peaql");
const { TFile } = await import("@lapis-notes/api");
await import("./bases-view/functions");
const { BasesTable } = await import("./bases-view/db");
const { generateQuery } = await import("./bases-view/filter-parser");
function plain(value: unknown): unknown {
  if (value instanceof Decimal) return value.number;
  return Array.isArray(value) ? value.map(plain) : value;
}
it("executes every documented collection example through the Bases query engine", () => {
  const reference = skills[0].files["references/FUNCTIONS_REFERENCE.md"];
  const examples = [...reference.matchAll(/^\| (\[.+?) \| (.+?) \|$/gm)];
  expect(examples).toHaveLength(7);
  const db = Context.create(
    new BasesTable("bases").data(() => [
      {
        id: "one",
        file: new TFile("One.md", { ctime: 0, mtime: 0, size: 1 }, null),
        cache: { frontmatter: {} },
      },
    ]),
  ).withDefaultTable("bases");
  for (const [, expression, expected] of examples) {
    const query = generateQuery(
      {
        type: "table",
        name: "Table",
        order: ["formula.result"],
        sort: [],
        filter: { and: [] },
        limit: 0,
      } as import("./bases-view/models").BasesViewBase,
      { result: expression },
    );
    const [, rows] = db.execute(query) as [unknown, unknown[][]];
    expect(plain(rows[0][0]), expression).toEqual(JSON.parse(expected));
  }
});
