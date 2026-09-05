import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRendererCompilerVersion,
  implicitRendererEsmHostModules,
  isImplicitRendererEsmHostModule,
  isPluginSelfReference,
  rendererCompilerVersionFromLockfile,
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

test("requires the installed compiler to match the frozen lockfile", () => {
  assert.doesNotThrow(() =>
    assertRendererCompilerVersion({ expected: "5.56.10", actual: "5.56.10" })
  );
  assert.throws(
    () =>
      assertRendererCompilerVersion({
        expected: "^5.38.2",
        actual: "5.56.10",
      }),
    /must resolve an exact Svelte renderer version/
  );
  assert.throws(
    () =>
      assertRendererCompilerVersion({
        expected: "5.56.10",
        actual: "5.57.0",
      }),
    /expected locked renderer 5\.56\.10/
  );
});

test("reads the renderer compiler version from the root frozen importer", () => {
  assert.equal(
    rendererCompilerVersionFromLockfile(`lockfileVersion: '9.0'

importers:

  .:
    devDependencies:
      svelte:
        specifier: ^5.38.2
        version: 5.56.10

  packages/example:
    devDependencies: {}
`),
    "5.56.10"
  );
  assert.throws(
    () => rendererCompilerVersionFromLockfile("importers: {}\n"),
    /must resolve an exact Svelte renderer version/
  );
});
