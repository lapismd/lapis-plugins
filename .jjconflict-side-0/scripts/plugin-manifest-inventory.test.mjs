import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { activePluginManifests } from "./test-support/plugin-manifest-inventory.mjs";

async function fixture(t, declarations) {
  const root = await mkdtemp(join(tmpdir(), "lapis-plugin-manifest-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [directory, pkg, manifest] of declarations) {
    const path = join(root, directory);
    await mkdir(path);
    await writeFile(join(path, "package.json"), JSON.stringify(pkg));
    if (manifest)
      await writeFile(join(path, "manifest.json"), JSON.stringify(manifest));
  }
  return pathToFileURL(root + "/");
}

test("manifest inventory retains exact identities at different active package counts", async (t) => {
  const first = ["first", { name: "@example/first" }, { id: "first-runtime" }];
  const second = [
    "second",
    { name: "@example/second", private: false },
    { id: "second-runtime" },
  ];
  assert.deepEqual(await activePluginManifests(await fixture(t, [first])), [
    {
      directory: "first",
      packageName: "@example/first",
      pluginId: "first-runtime",
    },
  ]);
  assert.deepEqual(
    await activePluginManifests(await fixture(t, [second, first])),
    [
      {
        directory: "first",
        packageName: "@example/first",
        pluginId: "first-runtime",
      },
      {
        directory: "second",
        packageName: "@example/second",
        pluginId: "second-runtime",
      },
    ]
  );
});

test("manifest inventory excludes private plugins and non-plugin packages", async (t) => {
  const packages = await fixture(t, [
    ["active", { name: "@example/active" }, { id: "active" }],
    ["parked", { name: "@example/parked", private: true }, { id: "parked" }],
    ["helper", { name: "@example/helper" }],
  ]);
  assert.deepEqual(await activePluginManifests(packages), [
    { directory: "active", packageName: "@example/active", pluginId: "active" },
  ]);
});

test("manifest inventory fails on malformed runtime declarations", async (t) => {
  const packages = await fixture(t, [["broken", { name: "@example/broken" }]]);
  await writeFile(new URL("broken/manifest.json", packages), "{");
  await assert.rejects(activePluginManifests(packages), SyntaxError);
});
