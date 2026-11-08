import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyBuiltImportBoundaries } from "./lib/npm-package-imports.mjs";

test("accepts relative imports that remain inside the installed package", async () => {
  const packageRoot = await createFixture(
    'export { default } from "../manifest.json";',
  );
  try {
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example");
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("rejects relative imports that escape the installed package", async () => {
  const packageRoot = await createFixture(
    'export { default } from "../../manifest.json";',
  );
  try {
    await assert.rejects(
      verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example"),
      /built import escapes the installed package: dist\/index\.js -> \.\.\/\.\.\/manifest\.json/,
    );
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

async function createFixture(indexSource) {
  const packageRoot = await mkdtemp(
    path.join(os.tmpdir(), "lapis-package-imports-"),
  );
  await mkdir(path.join(packageRoot, "dist"));
  await writeFile(path.join(packageRoot, "dist/index.js"), indexSource);
  await writeFile(path.join(packageRoot, "manifest.json"), "{}");
  return packageRoot;
}

test("rejects a DOCX dynamic import whose vendor target is omitted from the tarball", async () => {
  const packageRoot = await createFixture("export const value = 1;");
  try {
    await mkdir(path.join(packageRoot, "dist/lib"), { recursive: true });
    await mkdir(path.join(packageRoot, "vendor/wordcanvas"), {
      recursive: true,
    });
    await writeFile(
      path.join(packageRoot, "dist/lib/mount-docx.js"),
      'export const load = () => import("../../vendor/wordcanvas/entry.js");',
    );
    await writeFile(
      path.join(packageRoot, "vendor/wordcanvas/entry.js"),
      "export class WordCanvas {}",
    );
    await assert.rejects(
      verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/docx", [
        "dist/lib/mount-docx.js",
      ]),
      /built import is missing from the npm package/,
    );
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("rejects a relative module absent from the built package", async () => {
  const packageRoot = await createFixture(
    'export const load = () => import("./missing.js");',
  );
  try {
    await assert.rejects(
      verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example"),
      /built import is missing from the npm package/,
    );
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("accepts shipped extensionless modules, Svelte imports and query-qualified assets", async () => {
  const packageRoot = await createFixture(
    'import "./helper"; import "./viewer.svelte"; import "./worker.js?worker";',
  );
  try {
    for (const name of ["helper.js", "viewer.svelte", "worker.js"])
      await writeFile(path.join(packageRoot, "dist", name), "");
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example", [
      "dist/index.js",
      "dist/helper.js",
      "dist/viewer.svelte",
      "dist/worker.js",
    ]);
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("ignores import-shaped text inside comments and strings", async () => {
  const packageRoot = await createFixture(
    '// import "./comment-only.js";\nexport const example = `import "./example-only.js";`;',
  );
  try {
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example");
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("resolves emitted Svelte rune and generated parser modules with a JavaScript suffix", async () => {
  const packageRoot = await createFixture(
    'import "./state.svelte"; import "./csv.parser";',
  );
  try {
    await writeFile(
      path.join(packageRoot, "dist/state.svelte.js"),
      "export const state = {};",
    );
    await writeFile(
      path.join(packageRoot, "dist/csv.parser.js"),
      "export const parser = {};",
    );
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example", [
      "dist/index.js",
      "dist/state.svelte.js",
      "dist/csv.parser.js",
    ]);
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("checks the packed inventory and still rejects a shipped test with escaping imports", async () => {
  const packageRoot = await createFixture("export const value = 1;");
  try {
    await writeFile(
      path.join(packageRoot, "dist/metadata.test.js"),
      'import fixture from "../../../crates/native/fixture.json";',
    );
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example", [
      "dist/index.js",
    ]);
    await assert.rejects(
      verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example", [
        "dist/index.js",
        "dist/metadata.test.js",
      ]),
      /built import escapes the installed package/,
    );
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});
