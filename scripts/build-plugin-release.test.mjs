import assert from "node:assert/strict";
import test from "node:test";

import {
  implicitRendererEsmHostModules,
  isImplicitRendererEsmHostModule,
  isPluginSelfReference,
} from "./lib/runtime-host-modules.mjs";

test("bundles a plugin package's own manifest self-reference", () => {
  assert.equal(
    isPluginSelfReference(
      "@lapis-notes/markdown",
      "@lapis-notes/markdown/manifest.json"
    ),
    true
  );
  assert.equal(
    isPluginSelfReference(
      "@lapis-notes/markdown-lint",
      "@lapis-notes/markdown/manifest.json"
    ),
    false
  );
  assert.equal(
    isPluginSelfReference("@lapis-notes/markdown", "@lapis-notes/api"),
    false
  );
});

test("externalizes only the exact compiler-emitted Svelte renderer ABI", () => {
  assert.deepEqual(implicitRendererEsmHostModules, [
    "svelte",
    "svelte/internal/client",
    "svelte/internal/disclose-version",
  ]);
  for (const specifier of implicitRendererEsmHostModules) {
    assert.equal(isImplicitRendererEsmHostModule(specifier), true);
  }
  assert.equal(isImplicitRendererEsmHostModule("svelte/store"), false);
  assert.equal(
    isImplicitRendererEsmHostModule("svelte/internal/server"),
    false
  );
});
