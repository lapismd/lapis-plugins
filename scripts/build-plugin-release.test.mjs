import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { EditorState, StateField } from "@codemirror/state";
import { approvedWorkspaceHostModules } from "./package-catalog.mjs";

import {
  scanBareImports,
  scanRuntimeBareImports,
} from "./lib/plugin-runtime-imports.mjs";
import {
  assertRendererCompilerVersion,
  assertRendererHostVersion,
  versionedRendererHostSpecifier,
  assertWorkspaceHostDependencies,
  rendererSourceModules,
  isPluginSelfReference,
  pluginRuntimeViteBase,
  rendererCompilerVersionFromLockfile,
} from "./lib/runtime-host-modules.mjs";

test("bundles a plugin package's own manifest self-reference", () => {
  assert.equal(
    isPluginSelfReference(
      "@lapis-notes/markdown",
      "@lapis-notes/markdown/manifest.json",
    ),
    true,
  );
  assert.equal(
    isPluginSelfReference(
      "@lapis-notes/markdown-lint",
      "@lapis-notes/markdown/manifest.json",
    ),
    false,
  );
  assert.equal(
    isPluginSelfReference("@lapis-notes/markdown", "@lapis-notes/api"),
    false,
  );
});

test("covers compiler internals and public browser runtime exports without server modules", () => {
  for (const specifier of [
    "svelte",
    "svelte/internal/client",
    "svelte/internal/disclose-version",
    "svelte/internal/flags/legacy",
    "svelte/store",
    "svelte/reactivity",
  ]) {
    assert.ok(rendererSourceModules.includes(specifier));
    assert.ok(
      approvedWorkspaceHostModules.some((pattern) =>
        pattern.test(versionedRendererHostSpecifier(specifier, "5.56.10")),
      ),
    );
  }
  assert.equal(rendererSourceModules.includes("svelte/internal/server"), false);
  assert.equal(rendererSourceModules.includes("svelte/compiler"), false);
});

test("emits plugin runtime assets relative to the importing chunk", () => {
  assert.equal(pluginRuntimeViteBase, "./");
});

test("detects browser bare imports in every emitted runtime chunk", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-plugin-runtime-"));
  try {
    await writeFile(
      path.join(root, "main.mjs"),
      'import "./assets/chunk.mjs";\nimport "/absolute/hosted.mjs";\nimport "https://example.invalid/remote.mjs";\n',
    );
    await writeFile(
      path.join(root, "chunk.js"),
      'import { mount } from "svelte";\nexport { Plugin } from "@lapis-notes/api";\n',
    );

    assert.deepEqual(await scanBareImports('import x from "svelte";'), [
      "svelte",
    ]);
    assert.deepEqual(
      [...(await scanRuntimeBareImports(root))],
      [["chunk.js", ["@lapis-notes/api", "svelte"]]],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires the installed compiler to match the frozen lockfile", () => {
  assert.doesNotThrow(() =>
    assertRendererCompilerVersion({ expected: "5.56.10", actual: "5.56.10" }),
  );
  assert.throws(
    () =>
      assertRendererCompilerVersion({
        expected: "^5.38.2",
        actual: "5.56.10",
      }),
    /must resolve an exact Svelte renderer version/,
  );
  assert.throws(
    () =>
      assertRendererCompilerVersion({
        expected: "5.56.10",
        actual: "5.57.0",
      }),
    /expected locked renderer 5\.56\.10/,
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
    "5.56.10",
  );
  assert.throws(
    () => rendererCompilerVersionFromLockfile("importers: {}\n"),
    /must resolve an exact Svelte renderer version/,
  );
});

test("runtime bundle shares CodeMirror extension identity with its host", async () => {
  const localRoot = new URL("../.local/", import.meta.url);
  await mkdir(localRoot, { recursive: true });
  const root = await mkdtemp(new URL("runtime-identity-", localRoot).pathname);
  try {
    const entry = path.join(root, "entry.mjs");
    await writeFile(
      entry,
      'export { EditorState } from "@codemirror/state";\n',
    );
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir: path.join(root, "dist"),
        minify: false,
        lib: { entry, formats: ["es"], fileName: () => "main.mjs" },
        rollupOptions: {
          external: (specifier) =>
            approvedWorkspaceHostModules.some((pattern) =>
              pattern.test(specifier),
            ),
        },
      },
    });
    const runtime = await import(
      pathToFileURL(path.join(root, "dist/main.mjs")).href
    );
    const hostField = StateField.define({
      create: () => "host",
      update: (value) => value,
    });
    const state = runtime.EditorState.create({
      doc: "installed",
      extensions: [hostField],
    });
    assert.equal(state.field(hostField), "host");
    assert.equal(runtime.EditorState, EditorState);
    assert.deepEqual(
      await scanBareImports(
        await readFile(path.join(root, "dist/main.mjs"), "utf8"),
      ),
      ["@codemirror/state"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires approved editor host contracts to be declared as npm peers", () => {
  assert.throws(
    () =>
      assertWorkspaceHostDependencies({ peerDependencies: {} }, [
        "@codemirror/state",
      ]),
    /requires peerDependencies\.@codemirror\/state/,
  );
  assert.throws(
    () =>
      assertWorkspaceHostDependencies(
        { peerDependencies: { "@codemirror/state": "^6.6.0" } },
        ["@codemirror/state/private"],
      ),
    /not an approved host contract/,
  );
  assert.throws(
    () =>
      assertWorkspaceHostDependencies(
        { peerDependencies: { "@codemirror/lang-yaml": "^6.1.2" } },
        ["@codemirror/lang-yaml"],
      ),
    /not an approved host contract/,
  );
  assert.doesNotThrow(() =>
    assertWorkspaceHostDependencies(
      {
        peerDependencies: {
          "@codemirror/state": "^6.6.0",
          "@lezer/common": "^1.5.2",
        },
      },
      ["@codemirror/state", "@lezer/common"],
    ),
  );
});

test("binds compiled renderer contracts to the frozen compiler without admitting raw internals", () => {
  const specifier = versionedRendererHostSpecifier(
    "svelte/internal/client",
    "5.56.10",
  );
  assert.equal(specifier, "svelte/renderer/5.56.10/internal/client");
  assert.doesNotThrow(() => assertRendererHostVersion([specifier], "5.56.10"));
  assert.throws(
    () => assertRendererHostVersion([specifier], "5.56.8"),
    /does not match locked compiler/,
  );
  assert.throws(
    () => versionedRendererHostSpecifier("svelte", "^5.0.0"),
    /exact compiler version/,
  );
  assert.equal(
    versionedRendererHostSpecifier("svelte/internal/server", "5.56.10"),
    undefined,
  );
  assert.throws(
    () =>
      assertWorkspaceHostDependencies(
        { peerDependencies: { svelte: "^5.0.0" } },
        ["svelte/internal/client"],
      ),
    /not an approved host contract/,
  );
  assert.doesNotThrow(() =>
    assertWorkspaceHostDependencies(
      { peerDependencies: { svelte: "^5.0.0" } },
      [specifier],
    ),
  );
});
