import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pluginPackages, pluginPackageBySelector } from "./package-catalog.mjs";
import { selectPlugins } from "./dispatch-plugin-metadata.mjs";
import { selectReleases } from "./publish-approved-release.mjs";

test("parked Community cannot enter build, pack or metadata selection", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../packages/community/package.json", import.meta.url),
    ),
  );
  assert.equal(manifest.private, true);
  assert.equal(pluginPackages.length, 12);
  assert.ok(!pluginPackages.some((entry) => entry.pluginId === "community"));
  for (const selector of ["community", "@lapis-notes/community"]) {
    assert.equal(pluginPackageBySelector(selector), undefined);
    assert.throws(() => selectPlugins(selector), /Unknown plugin/);
  }
  assert.ok(
    !selectPlugins("all").some((entry) => entry.pluginId === "community"),
  );
});

test("stale Community release plans fail closed before publication", () => {
  const release = {
    packageName: "@lapis-notes/community",
    pluginId: "community",
    releaseTag: "community@0.1.0",
  };
  for (const selectors of [
    ["all"],
    ["community"],
    ["@lapis-notes/community"],
  ]) {
    assert.throws(() => selectReleases([release], selectors), /parked/i);
  }
});

test("Community is excluded from recursive tasks, stories and both release routes", async () => {
  const read = (file) =>
    readFile(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(await read("pnpm-workspace.yaml"), /!packages\/community/);
  for (const file of [
    ".github/workflows/release.yml",
    ".github/workflows/release-nostr.yml",
  ]) {
    assert.doesNotMatch(
      await read(file),
      /plugin_community|@lapis-notes\/community|^            community$/m,
    );
  }
  const stories = await read(".storybook/main.ts");
  assert.match(stories, /pluginPackages\.map/);
  assert.doesNotMatch(stories, /packages\/community|@lapis-notes\/community/);
});
