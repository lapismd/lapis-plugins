import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyCiChanges, isSpecOnlyDiff } from "./classify-ci-changes.mjs";

const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);
const entry = (path, status = "M", before = "100644", after = "100644") =>
  `:${before} ${after} ${baseSha} ${headSha} ${status}\0${path}\0`;

test("spec Markdown additions, edits and deletions use the fast route", () => {
  assert.equal(
    isSpecOnlyDiff(
      entry("spec/src/distribution.md") +
        entry("spec/records/new.md", "A", "000000") +
        entry("spec/records/old.md", "D", "100644", "000000")
    ),
    true
  );
  assert.equal(isSpecOnlyDiff(entry("spec/src/plugins/sync/index.md")), true);
});

test("mixed changes, executable spec files and unrecognized comparisons keep full CI", () => {
  for (const path of [
    "packages/sync/src/main.ts",
    "pnpm-lock.yaml",
    ".github/workflows/ci.yml",
    "scripts/check.mjs",
    "README.md",
    "spec/book.toml",
    "spec/src/check.js",
    "spec/src/plugin.md.js",
    "spec/other.md",
    "spec/src/../code.md",
    "spec/src//file.md",
    "spec/src/file\nname.md",
    "spec/src/file\\name.md",
  ]) {
    assert.equal(
      isSpecOnlyDiff(entry("spec/records/notes.md") + entry(path)),
      false,
      path
    );
  }
  for (const diff of [
    "",
    "unknown",
    entry("spec/src/a.md").slice(0, -1),
    entry("spec/src/a.md", "M", "120000", "120000"),
    entry("spec/src/a.md", "M", "100644", "100755"),
    entry("spec/src/a.md", "T"),
    entry("spec/src/a.md", "R100"),
  ])
    assert.equal(isSpecOnlyDiff(diff), false, diff);
});

test("moves across the spec boundary cannot hide the original or destination path", () => {
  for (const [from, to, expected] of [
    ["spec/src/old.md", "spec/src/new.md", true],
    ["README.md", "spec/src/new.md", false],
    ["spec/src/old.md", "scripts/new.md", false],
  ]) {
    assert.equal(
      isSpecOnlyDiff(
        entry(from, "D", "100644", "000000") + entry(to, "A", "000000")
      ),
      expected
    );
  }
});

test("classification uses the complete PR comparison with rename detection disabled", () => {
  const calls = [];
  assert.equal(
    classifyCiChanges({
      eventName: "pull_request",
      baseSha,
      headSha,
      runGit(args) {
        calls.push(args);
        return calls.length === 1
          ? `${baseSha}\n`
          : entry("spec/records/sync.md");
      },
    }),
    true
  );
  assert.deepEqual(calls, [
    ["merge-base", "--all", baseSha, headSha],
    [
      "diff",
      "--no-ext-diff",
      "--raw",
      "--no-abbrev",
      "--no-renames",
      "-z",
      `${baseSha}..${headSha}`,
      "--",
    ],
  ]);
});

test("non-PR events and missing, ambiguous or unavailable history fail closed", () => {
  for (const eventName of [
    "push",
    "workflow_dispatch",
    "workflow_call",
    undefined,
  ]) {
    assert.equal(
      classifyCiChanges({
        eventName,
        baseSha,
        headSha,
        runGit() {
          assert.fail("non-PR comparison must not run");
        },
      }),
      false
    );
  }
  for (const value of [undefined, "", "main", "-bad-revision"]) {
    assert.equal(
      classifyCiChanges({ eventName: "pull_request", baseSha: value, headSha }),
      false
    );
    assert.equal(
      classifyCiChanges({ eventName: "pull_request", baseSha, headSha: value }),
      false
    );
  }
  for (const runGit of [
    () => {
      throw new Error("history unavailable");
    },
    () => "",
    () => `${baseSha}\n${headSha}\n`,
    (args) => (args[0] === "merge-base" ? baseSha : ""),
  ]) {
    assert.equal(
      classifyCiChanges({
        eventName: "pull_request",
        baseSha,
        headSha,
        runGit,
      }),
      false
    );
  }
});

test("workflow routes every expensive lane and retains the stable aggregate", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  const job = (name) =>
    workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0];
  assert.match(job("changes"), /fetch-depth: 0/);
  assert.match(job("changes"), /run: node scripts\/classify-ci-changes\.mjs/);
  assert.match(
    job("changes"),
    /PR_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/
  );
  assert.match(
    job("changes"),
    /PR_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/
  );
  for (const lane of [
    "prerequisite",
    "build-cache",
    "quality",
    "unit",
    "storybook-static",
    "storybook-interaction",
    "release-artifacts",
  ]) {
    assert.match(
      job(lane),
      /if: needs\.changes\.outputs\.spec_only == 'false'/,
      lane
    );
    assert.match(job(lane), /needs:(?: changes|\n      - changes)/, lane);
  }
  assert.match(
    job("specification"),
    /if: needs\.changes\.outputs\.spec_only == 'true'/
  );
  assert.match(job("specification"), /run: pnpm spec:check/);
  assert.doesNotMatch(
    job("specification"),
    /run: .*?(?:turbo|storybook|plugin:build|packages:pack)/
  );
  assert.match(
    job("storybook-interaction"),
    /shard: \[1, 2, 3, 4\]/
  );
  assert.match(
    job("storybook-interaction"),
    /pnpm test:storybook -- --shard=\$\{\{ matrix\.shard \}\}\/4/
  );
  assert.match(job("validate"), /if: always\(\)/);
  assert.match(job("validate"), /- changes\n      - specification/);
  assert.doesNotMatch(workflow, /paths-ignore:/);
});
