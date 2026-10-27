import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("workspace patch declarations cannot be shadowed by package settings", async () => {
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    manifest.pnpm?.patchedDependencies,
    undefined,
    "Keep dependency patches together in pnpm-workspace.yaml so one map cannot hide another"
  );
});

test("tracks the Bits UI lifecycle patch for every resolved version", async () => {
  const workspace = await readFile("pnpm-workspace.yaml", "utf8");
  const lockfile = await readFile("pnpm-lock.yaml", "utf8");

  const resolvedVersions = new Set(
    [...lockfile.matchAll(/^  bits-ui@([\d.]+):/gm)].map((match) => match[1])
  );
  assert.ok(resolvedVersions.size > 0, "lockfile must resolve Bits UI");

  for (const version of resolvedVersions) {
    const patchPath = `patches/bits-ui@${version}.patch`;
    assert.ok(
      workspace.includes(`bits-ui@${version}: ${patchPath}`),
      `${patchPath} must be wired in pnpm-workspace.yaml`
    );
    assert.match(
      lockfile,
      new RegExp(`bits-ui@${version.replaceAll(".", "\\.")}:\\n\\s+hash:`),
      `${patchPath} must have a locked patch hash`
    );

    const patch = await readFile(patchPath, "utf8");
    assert.match(patch, /this\.selectionTimeout = afterSleep\(1/);
    assert.match(patch, /this\.clearSelectionTimeout\(\)/);
    assert.match(patch, /onDestroyEffect\(\(\) => \{/);
    // Bits UI 2.19.5 owns debounce cleanup upstream; older versions need it.
    if (version === "2.18.1") {
      assert.match(patch, /globalThis\.clearTimeout\(resizeTimeout\)/);
    }
    if (version === "2.19.5") {
      // Svelte defers pointer-listener attachment one microtask behind on().
      // A slider destroyed in the same tick it mounted therefore leaks its
      // four document listeners past effect teardown, and each later
      // pointerdown would read boxes of the destroyed effect (derived_inert).
      // The destroyed guard keeps every leaked document handler inert for
      // both the single and the multi slider root state.
      assert.match(patch, /destroyed = false;/);
      assert.equal(
        [...patch.matchAll(/this\.destroyed = true;/g)].length,
        2,
        "slider and link-preview root states must both flag destruction"
      );
      for (const guard of [
        /if \(this\.destroyed \|\| !this\.isActive \|\| this\.opts\.disabled\.current\)/g,
        /if \(this\.destroyed \|\| e\.button !== 0 \|\| this\.opts\.disabled\.current\)/g,
        /if \(this\.destroyed \|\| this\.opts\.disabled\.current\)/g,
      ]) {
        assert.equal(
          [...patch.matchAll(guard)].length,
          2,
          "both slider root states must guard every document pointer handler"
        );
      }
    }
  }
});
