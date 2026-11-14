import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  partitionChangeset,
  renderChangeset,
} from "./version-public-packages.mjs";

const mixed = `---
"@lapis-notes/ai": patch
"@lapis-notes/bases": patch
"@lapis-notes/history": minor
---

Keep the other packages on this release.
`;

test("splits explicitly held entries out of a mixed changeset", () => {
  const parsed = partitionChangeset(mixed, [
    "@lapis-notes/bases",
    "@lapis-notes/history",
  ]);
  assert.deepEqual(
    parsed.rest.map((entry) => entry.name),
    ["@lapis-notes/ai"],
  );
  assert.deepEqual(
    parsed.held.map((entry) => `${entry.name}:${entry.bump}`),
    ["@lapis-notes/bases:patch", "@lapis-notes/history:minor"],
  );
  assert.match(
    renderChangeset(parsed.rest, parsed.body),
    /"@lapis-notes\/ai": patch/,
  );
  assert.doesNotMatch(
    renderChangeset(parsed.rest, parsed.body),
    /bases|history/,
  );
  assert.match(
    renderChangeset(parsed.held, parsed.body),
    /Keep the other packages/,
  );
});

test("release planning preserves compatible peer bumps and majors incompatible peers", () => {
  const directory = mkdtempSync(join(tmpdir(), "lapis-peer-release-"));
  const writeJson = (file, value) =>
    writeFileSync(join(directory, file), JSON.stringify(value));
  try {
    mkdirSync(join(directory, ".changeset"));
    const config = JSON.parse(
      readFileSync(
        new URL("../.changeset/config.json", import.meta.url),
        "utf8",
      ),
    );
    writeJson("package.json", {
      name: "peer-regression",
      private: true,
      packageManager: "pnpm@10.34.5",
    });
    writeFileSync(
      join(directory, "pnpm-workspace.yaml"),
      "packages:\n  - packages/*\n",
    );
    writeJson(".changeset/config.json", { ...config, changelog: false });
    for (const [name, peers] of [
      ["format", undefined],
      ["consumer-compatible", { format: "^0.2.7 || ^0.3.0" }],
      ["consumer-incompatible", { format: "^0.2.7" }],
    ]) {
      mkdirSync(join(directory, "packages", name), { recursive: true });
      writeJson(`packages/${name}/package.json`, {
        name,
        version: name === "format" ? "0.2.7" : "0.1.13",
        peerDependencies: peers,
      });
    }
    writeFileSync(
      join(directory, ".changeset/release.md"),
      '---\n"format": minor\n"consumer-compatible": patch\n---\n\nCompatible additive release.\n',
    );
    const jj = (...args) =>
      execFileSync(
        "jj",
        [
          "--config",
          'user.name="Release fixture"',
          "--config",
          'user.email="release-fixture@localhost"',
          ...args,
        ],
        { cwd: directory, stdio: ["ignore", "pipe", "pipe"] },
      );
    jj("git", "init", "--colocate");
    jj("commit", "-m", "Initial release fixture");
    jj("bookmark", "create", "main", "-r", "@-");
    const output = join(directory, "plan.json");
    const require = createRequire(import.meta.url);
    execFileSync(
      process.execPath,
      [require.resolve("@changesets/cli/bin.js"), "status", "--output", output],
      { cwd: directory, encoding: "utf8" },
    );
    const versions = new Map(
      JSON.parse(readFileSync(output, "utf8")).releases.map((entry) => [
        entry.name,
        entry.newVersion,
      ]),
    );
    assert.equal(versions.get("format"), "0.3.0");
    assert.equal(versions.get("consumer-compatible"), "0.1.14");
    assert.equal(versions.get("consumer-incompatible"), "1.0.0");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
