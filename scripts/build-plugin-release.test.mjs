import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  scanBareImports,
  scanRuntimeBareImports,
} from "./lib/plugin-runtime-imports.mjs";
import {
  assertRendererCompilerVersion,
  implicitRendererEsmHostModules,
  isImplicitRendererEsmHostModule,
  isPluginSelfReference,
  pluginRuntimeViteBase,
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

test("tracks the exact compiler-emitted Svelte renderer ABI", () => {
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

test("emits plugin runtime assets relative to the importing chunk", () => {
  assert.equal(pluginRuntimeViteBase, "./");
});

test("detects browser bare imports in every emitted runtime chunk", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-plugin-runtime-"));
  try {
    await writeFile(
      path.join(root, "main.mjs"),
      'import "./assets/chunk.mjs";\nimport "/absolute/hosted.mjs";\nimport "https://example.invalid/remote.mjs";\n'
    );
    await writeFile(
      path.join(root, "chunk.js"),
      'import { mount } from "svelte";\nexport { Plugin } from "@lapis-notes/api";\n'
    );

    assert.deepEqual(await scanBareImports('import x from "svelte";'), [
      "svelte",
    ]);
    assert.deepEqual([...await scanRuntimeBareImports(root)], [
      ["chunk.js", ["@lapis-notes/api", "svelte"]],
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
