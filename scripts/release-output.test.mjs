import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { preparePluginReleaseRoot } from "./lib/release-output.mjs";

test("full release preparation removes stale signed bundles", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-release-output-"));
  const releaseRoot = path.join(root, "plugins");
  await preparePluginReleaseRoot({ releaseRoot, clean: false });
  const stale = path.join(releaseRoot, "old-version.lapis-plugin");
  await writeFile(stale, "old signature");

  await preparePluginReleaseRoot({ releaseRoot, clean: true });

  await assert.rejects(readFile(stale), { code: "ENOENT" });
  await rm(root, { recursive: true, force: true });
});

test("single-plugin preparation preserves other generated candidates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-release-output-"));
  const releaseRoot = path.join(root, "plugins");
  await preparePluginReleaseRoot({ releaseRoot, clean: false });
  const existing = path.join(releaseRoot, "existing.lapis-plugin");
  await writeFile(existing, "current candidate");

  await preparePluginReleaseRoot({ releaseRoot, clean: false });

  assert.equal(await readFile(existing, "utf8"), "current candidate");
  await rm(root, { recursive: true, force: true });
});
