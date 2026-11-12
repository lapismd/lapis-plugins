import { afterAll, expect, test } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { Context, Decimal } from "peaql";
import { DateTime, Duration, Settings } from "luxon";
import { TFile } from "@lapis-notes/api";
import "../../src/lib/bases-view/functions";
import { BasesTable } from "../../src/lib/bases-view/db";
import { normalizeBasesDocument } from "../../src/lib/bases-view/document-core";
import {
  generateQuery,
  validateFilterPredicate,
} from "../../src/lib/bases-view/filter-parser";
import {
  renderReport,
  validateInventory,
} from "../../../../scripts/bases-compatibility-core.mjs";

const root = path.resolve(process.cwd(), "../..");
const pathJoin = (name: string) => path.join(root, name);
const read = (path: string) => JSON.parse(readFileSync(pathJoin(path), "utf8"));
const inventory = read("docs/bases-compatibility/inventory.json");
const upstream = read("docs/bases-compatibility/upstream.json");
const baselinePath = "docs/bases-compatibility/baseline.json";
const baseline = read(baselinePath);
// Validate before any --write run can replace accepted evidence.
validateInventory(inventory, upstream);
const results: Record<string, unknown>[] = [];
const previousNow = Settings.now;
const previousZone = Settings.defaultZone;
Settings.now = () => Date.UTC(2026, 10, 12, 12);
Settings.defaultZone = "UTC";
afterAll(() => {
  Settings.now = previousNow;
  Settings.defaultZone = previousZone;
});

function rows() {
  return [
    {
      id: "alpha",
      file: new TFile("Notes/Alpha.md", { ctime: 0, mtime: 0, size: 10 }),
      cache: {
        frontmatter: {
          status: "open",
          price: 12,
          age: 3,
          tags: ["book/fiction"],
          authors: ["[[Notes/Beta.md]]"],
          empty: {},
        },
        tags: [{ tag: "#book/fiction" }],
        links: [{ link: "Notes/Beta.md" }],
      },
    },
    {
      id: "beta",
      file: new TFile("Notes/Beta.md", { ctime: 0, mtime: 0, size: 20 }),
      cache: { frontmatter: { status: "done", price: 4, age: 2 } },
    },
    {
      id: "gamma",
      file: new TFile("Other/Gamma.txt", { ctime: 0, mtime: 0, size: 0 }),
      cache: { frontmatter: { status: "open", price: 0, age: 1 } },
    },
  ];
}

function database(single = false) {
  const data = rows();
  return Context.create(
    new BasesTable("bases")
      .withPropertyColumns({
        status: String,
        price: Number,
        age: Number,
        authors: Array,
        empty: Object,
      })
      .data(() => (single ? data.slice(0, 1) : data))
  ).withDefaultTable("bases");
}

function plain(value: any): any {
  if (value instanceof Decimal) return value.number;
  if (value instanceof DateTime) return value.toISO();
  if (value instanceof Duration) return value.toMillis();
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, plain(item)])
    );
  return value;
}

function execute(query: string, single = false): any[][] {
  const [, data] = database(single).execute(query) as [unknown, any[][]];
  return data;
}

function observe(probe: any) {
  if (probe.mode === "compile-error") {
    const document = normalizeBasesDocument(probe.document);
    try {
      generateQuery(document.views[0], document.formulas, document.filters);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }
  if (probe.mode === "expression") {
    const document = normalizeBasesDocument({
      formulas: { auditValue: probe.expression },
      views: [{ type: "table", name: "Audit", order: ["formula.auditValue"] }],
    });
    return plain(
      execute(
        generateQuery(document.views[0], document.formulas, document.filters),
        true
      )[0]?.[0]
    );
  }
  if (probe.mode === "parser")
    return validateFilterPredicate(probe.expression).valid;
  const document = normalizeBasesDocument(
    probe.document ?? {
      filters: probe.filter,
      views: [{ type: "table", name: "Table", order: ["file.path"] }],
    }
  );
  const query = generateQuery(
    document.views[0],
    document.formulas,
    document.filters
  );
  const data = execute(query);
  // generateQuery always projects its owning VaultRecord as the final column.
  return data.map((row) => row.at(-1).id);
}

test("inventory covers every documented function with unique IDs and evidence", () => {
  validateInventory(inventory, upstream);
});

for (const feature of inventory.features) {
  if (!feature.probes?.length) continue;
  test(`${feature.id}: ${feature.title}`, () => {
    const observations = feature.probes.map((probe: any) => {
      try {
        const actual = observe(probe);
        return {
          id: probe.id,
          pass: isDeepStrictEqual(actual, probe.expected),
          expected: probe.expected,
          actual,
        };
      } catch (error) {
        return {
          id: probe.id,
          pass: false,
          expected: probe.expected,
          error:
            error instanceof Error
              ? error.message.split("\n")[0]
              : String(error),
        };
      }
    });
    const passed = observations.filter((it: any) => it.pass).length;
    const status =
      passed === observations.length ? "supported" : passed ? "partial" : "gap";
    results.push({ id: feature.id, status, observations });
    if (process.env.BASES_COMPATIBILITY_WRITE !== "1") {
      expect(
        observations.map((it: any) => ({ id: it.id, pass: it.pass })),
        `${feature.id}: behavior changed; inspect the report and explicitly update the baseline`
      ).toEqual(baseline[feature.id]);
    }
  });
}

afterAll(() => {
  const report = {
    schemaVersion: 1,
    upstreamReviewedAt: upstream.reviewedAt,
    implementation: {
      packageVersion: read("packages/bases/package.json").version,
      dependencies: {
        "@lapis-notes/api": read("node_modules/@lapis-notes/api/package.json")
          .version,
        peaql: read("packages/bases/node_modules/peaql/package.json").version,
        luxon: read("packages/bases/node_modules/luxon/package.json").version,
      },
      sources: Object.fromEntries(
        [
          "document-core.ts",
          "expression-compiler.ts",
          "filter-parser.ts",
          "functions.ts",
          "functions-core.ts",
          "collection-functions.ts",
          "db.ts",
          "file-fields-core.ts",
        ].map((name) => [
          name,
          createHash("sha256")
            .update(
              readFileSync(
                pathJoin(`packages/bases/src/lib/bases-view/${name}`)
              )
            )
            .digest("hex"),
        ])
      ),
    },
    results: inventory.features.map((feature: any) => ({
      ...feature,
      ...(results.find((it) => it.id === feature.id) ?? {
        status: "review-required",
      }),
    })),
  };
  const json = JSON.stringify(report, null, 2) + "\n";
  const markdown = renderReport(report, upstream);
  // Keep actual observations available even when baseline or freshness checks
  // fail. CI must upload this run's evidence, not just the checked-in report.
  const output = pathJoin(".release/bases-compatibility");
  mkdirSync(output, { recursive: true });
  writeFileSync(path.join(output, "report.json"), json);
  writeFileSync(path.join(output, "report.md"), markdown);
  if (process.env.BASES_COMPATIBILITY_WRITE === "1") {
    const next = Object.fromEntries(
      results.map((it: any) => [
        it.id,
        it.observations.map((probe: any) => ({
          id: probe.id,
          pass: probe.pass,
        })),
      ])
    );
    writeFileSync(pathJoin(baselinePath), JSON.stringify(next, null, 2) + "\n");
    writeFileSync(pathJoin("docs/bases-compatibility/report.json"), json);
    writeFileSync(pathJoin("docs/bases-compatibility/report.md"), markdown);
  } else {
    expect(Object.keys(baseline).sort()).toEqual(
      results.map((it: any) => it.id).sort()
    );
    expect(
      readFileSync(pathJoin("docs/bases-compatibility/report.json"), "utf8")
    ).toBe(json);
    expect(
      readFileSync(pathJoin("docs/bases-compatibility/report.md"), "utf8")
    ).toBe(markdown);
  }
});
