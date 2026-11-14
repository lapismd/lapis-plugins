import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  functionKeys,
  validateInventory,
  renderReport,
} from "./bases-compatibility-core.mjs";

const read = (name) =>
  JSON.parse(
    readFileSync(
      new URL(`../docs/bases-compatibility/${name}`, import.meta.url),
      "utf8"
    )
  );
const upstream = read("upstream.json");
const inventory = read("inventory.json");

test("function discovery keeps receiver types and duplicate method names distinct", () => {
  assert.deepEqual(
    functionKeys(
      "## Global\n### `date()`\n## Date type\n### `date()`\n## String type\n### `isEmpty()`\n## List type\n### `isEmpty()`"
    ),
    ["global.date", "date.date", "string.isEmpty", "list.isEmpty"]
  );
});

test("inventory rejects missing coverage, duplicate identities and evidence-free claims", () => {
  validateInventory(inventory, upstream);
  const without = structuredClone(inventory);
  without.features = without.features.filter(
    (item) => !item.functions?.includes("global.date")
  );
  assert.throws(
    () => validateInventory(without, upstream),
    /Every documented function/
  );
  const duplicate = structuredClone(inventory);
  duplicate.features.push(duplicate.features[0]);
  assert.throws(
    () => validateInventory(duplicate, upstream),
    /Duplicate feature/
  );
  const unsupported = structuredClone(inventory);
  unsupported.features[0].probes = [];
  assert.throws(
    () => validateInventory(unsupported, upstream),
    /No probe or review/
  );
});

test("report exposes failed observations and does not count manual reviews as passing probes", () => {
  const report = {
    results: [
      {
        ...inventory.features[0],
        status: "partial",
        observations: [
          { id: "pass", pass: true },
          {
            id: "fail",
            pass: false,
            expected: ["one"],
            actual: ["one", "two"],
          },
        ],
      },
      { ...inventory.features.at(-1), status: "review-required" },
    ],
  };
  const markdown = renderReport(report, upstream);
  assert.match(
    markdown,
    /0 supported, 1 partial, 0 gaps, 1 requiring manual review/
  );
  assert.match(markdown, /expected.*one.*actual.*two/);
  assert.match(markdown, /review-required \| 0\/0/);
});

test("intentional differences retain failed expectations and require rationale", () => {
  const annotated = structuredClone(inventory);
  annotated.features[0].difference = {
    kind: "intentional",
    reason: "Preserve native writes",
    evidence: "document-core.ts",
  };
  validateInventory(annotated, upstream);
  const item = {
    ...annotated.features[0],
    status: "partial",
    observations: [
      { id: "difference", pass: false, expected: true, actual: false },
    ],
  };
  const report = renderReport({ results: [item] }, upstream);
  assert.match(report, /0 supported, 1 partial/);
  assert.match(report, /Retained differences/);
  assert.match(report, /expected.*true.*actual.*false/);
  annotated.features[0].difference.evidence = "";
  assert.throws(
    () => validateInventory(annotated, upstream),
    /Missing difference rationale/
  );
});


test("provenance refresh admits only observed versions without mutating evidence", async () => {
  const { assertProvenanceOnlyRefresh } = await import("./bases-compatibility-core.mjs");
  const previous = read("report.json");
  const actual = structuredClone(previous);
  actual.implementation.packageVersion = "0.3.3";
  actual.implementation.dependencies["@lapis-notes/api"] = "0.4.0";
  const frozen = structuredClone(previous);
  assertProvenanceOnlyRefresh(previous, actual);
  assert.deepEqual(previous, frozen);
});

test("provenance refresh rejects behavioral, source, inventory and dependency-key drift", async () => {
  const { assertProvenanceOnlyRefresh } = await import("./bases-compatibility-core.mjs");
  assert.equal(typeof assertProvenanceOnlyRefresh, "function");
  const previous = read("report.json");
  const mutations = [
    (r) => { r.results[0].status = "unreviewed"; },
    (r) => { r.results[0].observations[0].pass = !r.results[0].observations[0].pass; },
    (r) => { r.implementation.sources["db.ts"] = "changed"; },
    (r) => { r.upstreamReviewedAt = "unreviewed"; },
    (r) => { r.results.pop(); },
    (r) => { r.implementation.dependencies.unreviewed = "1.0.0"; },
  ];
  for (const mutate of mutations) {
    const actual = structuredClone(previous);
    actual.implementation.packageVersion = "0.3.3";
    mutate(actual);
    assert.throws(() => assertProvenanceOnlyRefresh(previous, actual));
  }
});
