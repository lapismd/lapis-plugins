import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("tracks the Bits UI lifecycle patch for every resolved version", async () => {
  const workspace = await readFile("pnpm-workspace.yaml", "utf8");
  const lockfile = await readFile("pnpm-lock.yaml", "utf8");

  const resolvedVersions = new Set(
    [...lockfile.matchAll(/^  bits-ui@([\d.]+):/gm)].map((match) => match[1]),
  );
  assert.ok(resolvedVersions.size > 0, "lockfile must resolve Bits UI");

  for (const version of resolvedVersions) {
    const patchPath = `patches/bits-ui@${version}.patch`;
    assert.ok(
      workspace.includes(`bits-ui@${version}: ${patchPath}`),
      `${patchPath} must be wired in pnpm-workspace.yaml`,
    );
    assert.match(
      lockfile,
      new RegExp(`bits-ui@${version.replaceAll(".", "\\.")}:\\n\\s+hash:`),
      `${patchPath} must have a locked patch hash`,
    );

    const patch = await readFile(patchPath, "utf8");
    assert.match(patch, /this\.selectionTimeout = afterSleep\(1/);
    assert.match(patch, /this\.clearSelectionTimeout\(\)/);
    assert.match(patch, /onDestroyEffect\(\(\) => \{/);
    // Bits UI 2.19.5 owns debounce cleanup upstream; older versions need it.
    if (version === "2.18.1") {
      assert.match(patch, /globalThis\.clearTimeout\(resizeTimeout\)/);
    }
  }
});
