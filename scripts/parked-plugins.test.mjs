import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pluginPackages, pluginPackageBySelector } from "./package-catalog.mjs";
import { selectPlugins } from "./dispatch-plugin-metadata.mjs";
import { selectReleases } from "./publish-approved-release.mjs";
import {
  registryMediaPluginBySelector,
  registryMediaPlugins,
} from "./registry-media-catalog.mjs";

test("Sync foundation stays private and excluded from activation and releases", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../packages/sync/package.json", import.meta.url)),
  );
  assert.equal(manifest.private, true);
  for (const selector of ["sync", "@lapis-notes/lapis-plugin-sync"]) {
    assert.equal(pluginPackageBySelector(selector), undefined);
    assert.throws(() => selectPlugins(selector), /Unknown plugin/);
  }
  assert.throws(
    () =>
      selectReleases(
        [
          {
            packageName: "@lapis-notes/lapis-plugin-sync",
            pluginId: "sync",
            releaseTag: "sync@0.1.0",
          },
        ],
        ["all"],
      ),
    /parked/i,
  );
  const workspace = await readFile(
    new URL("../pnpm-workspace.yaml", import.meta.url),
    "utf8",
  );
  assert.match(workspace, /!packages\/sync/);
});

test("parked Community cannot enter build, pack or metadata selection", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../packages/community/package.json", import.meta.url),
    ),
  );
  assert.equal(manifest.private, true);
  assert.equal(pluginPackages.length, 15);
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

test("private Sync UI can be previewed without entering active packages", async () => {
  const config = await readFile(
    new URL("../.storybook/main.ts", import.meta.url),
    "utf8",
  );
  assert.match(config, /stories\/plugins\/sync\/\*\*\/\*\.stories/);
  assert.ok(!pluginPackages.some((entry) => entry.pluginId === "sync"));
});

test("CI installs the private Sync catalog dependencies from a frozen registry lockfile", async () => {
  const setup = await readFile(
    new URL("../.github/actions/ci-setup/action.yml", import.meta.url),
    "utf8",
  );
  assert.match(
    setup,
    /pnpm --dir packages\/sync install --ignore-workspace --ignore-pnpmfile --frozen-lockfile/,
  );
  const lockfile = await readFile(
    new URL("../packages/sync/pnpm-lock.yaml", import.meta.url),
    "utf8",
  );
  for (const name of ["@lucide/svelte", "@zxing/browser", "qrcode"]) {
    assert.ok(lockfile.includes(name), `${name} has a frozen resolution`);
  }
  assert.doesNotMatch(
    lockfile,
    /\b(?:specifier|version|tarball):\s*['"]?(?:file|link|workspace):/,
  );
  const ci = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  assert.match(ci, /pnpm --dir packages\/sync audit --ignore-workspace/);
  assert.ok(!pluginPackages.some((entry) => entry.pluginId === "sync"));
});

test("Sync registry media is selected independently of install and release workflows", async () => {
  for (const selector of ["sync", "@lapis-notes/lapis-plugin-sync"]) {
    assert.equal(registryMediaPluginBySelector(selector)?.pluginId, "sync");
    assert.equal(pluginPackageBySelector(selector), undefined);
    assert.throws(() => selectPlugins(selector), /Unknown plugin/);
  }
  assert.ok(registryMediaPlugins.some((plugin) => plugin.directory === "sync"));
  assert.equal(registryMediaPluginBySelector("community"), undefined);
  const capture = await readFile(
    new URL("./capture-registry-media.mjs", import.meta.url),
    "utf8",
  );
  assert.match(capture, /registryMediaPluginBySelector\(options.plugin\)/);
  assert.match(
    capture,
    /selectedPlugin \? \[selectedPlugin\] : registryMediaPlugins/,
  );
  const audit = await readFile(
    new URL("./check-registry-metadata.mjs", import.meta.url),
    "utf8",
  );
  assert.match(audit, /for \(const plugin of registryMediaPlugins\)/);
  const metadata = JSON.parse(
    await readFile(
      new URL("../packages/sync/registry.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    metadata.media.banner.capture.storyId,
    "plugins-sync-registry-screenshots--banner",
  );
  assert.deepEqual(
    metadata.gallery.map((item) => item.capture.storyId),
    ["changes", "history", "file-history", "merge", "status"].map(
      (name) => `plugins-sync-registry-screenshots--${name}`,
    ),
  );
});
