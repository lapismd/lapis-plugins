import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const patchedVersions = ["2.18.1", "2.19.0"];

test("tracks the Bits UI lifecycle patch for every resolved version", async () => {
  const workspace = await readFile("pnpm-workspace.yaml", "utf8");
  const lockfile = await readFile("pnpm-lock.yaml", "utf8");

  for (const version of patchedVersions) {
    const patchPath = `patches/bits-ui@${version}.patch`;
    assert.ok(
      workspace.includes(`bits-ui@${version}: ${patchPath}`),
      `${patchPath} must be wired in pnpm-workspace.yaml`
    );
    assert.match(lockfile, new RegExp(`bits-ui@${version}:`));

    const patch = await readFile(patchPath, "utf8");
    assert.match(patch, /this\.selectionTimeout = afterSleep\(1/);
    assert.match(patch, /this\.clearSelectionTimeout\(\)/);
    assert.match(patch, /onDestroyEffect\(\(\) => \{/);
    assert.match(patch, /globalThis\.clearTimeout\(resizeTimeout\)/);
  }
});
