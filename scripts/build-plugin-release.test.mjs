import assert from "node:assert/strict";
import test from "node:test";

import { isPluginSelfReference } from "./lib/runtime-host-modules.mjs";

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
