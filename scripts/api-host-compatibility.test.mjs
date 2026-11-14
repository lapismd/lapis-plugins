import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import semver from "semver";
import { pluginPackages } from "./package-catalog.mjs";

for (const plugin of pluginPackages) {
  test(`${plugin.packageName} admits API 0.4 without dropping the qualified 0.2 host`, async () => {
    const pkg = JSON.parse(
      await readFile(
        new URL(
          `../packages/${plugin.directory}/package.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const range = pkg.peerDependencies?.["@lapis-notes/api"];
    assert.ok(
      semver.satisfies("0.2.4", range),
      `${plugin.packageName}: retain the existing API 0.2.4 host`,
    );
    assert.ok(
      semver.satisfies("0.4.0", range),
      `${plugin.packageName}: published API 0.4 host is excluded by ${range}`,
    );
  });
}
