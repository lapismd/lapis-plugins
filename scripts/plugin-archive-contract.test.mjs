import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { assertSafePluginRelativePath } from "./lib/plugin-bundle.mjs";
import { verifyPluginPayload } from "./lib/verify-plugin-release.mjs";
import {
  buildPluginPayload,
  packageOfficialPlugin,
} from "./plugin-release.mjs";

test("rejects unsafe plugin archive paths", () => {
  assert.throws(
    () => assertSafePluginRelativePath("../main.mjs"),
    /Unsafe plugin file path/,
  );
  assert.throws(
    () => assertSafePluginRelativePath("assets\\main.mjs"),
    /Unsafe plugin file path/,
  );
});

test("rejects files added after the curated release manifest is created", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-plugin-contract-"));
  const input = path.join(root, "input");
  const out = path.join(root, "out");
  await mkdir(input, { recursive: true });
  await writeFile(
    path.join(input, "manifest.json"),
    JSON.stringify({
      id: "contract-test",
      name: "Contract Test",
      version: "0.1.0",
      minAppVersion: "0.1.0",
      lapis: {
        manifestVersion: 1,
        runtime: {
          entries: {
            workspace: { path: "main.mjs", format: "esm" },
          },
        },
      },
    }),
  );
  await writeFile(path.join(input, "main.mjs"), "export default class TestPlugin {}\n");
  await writeFile(path.join(input, "styles.css"), "");

  const release = await packageOfficialPlugin({
    pluginId: "contract-test",
    version: "0.1.0",
    inputDir: input,
    outDir: out,
  });
  await writeFile(path.join(release.releaseDir, "files/unsigned.txt"), "unsigned");
  const bundle = await buildPluginPayload({
    pluginId: "contract-test",
    version: "0.1.0",
    releaseDir: release.releaseDir,
  });
  const bundleBytes = await readFile(bundle.bundlePath);

  assert.throws(
    () =>
      verifyPluginPayload({
        bundleBytes,
        releaseManifest: release.releaseManifest,
      }),
    /unsigned or missing files/,
  );
  await rm(root, { recursive: true, force: true });
});
