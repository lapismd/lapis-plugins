import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyBuiltImportBoundaries } from "./lib/npm-package-imports.mjs";

test("accepts relative imports that remain inside the installed package", async () => {
  const packageRoot = await createFixture('export { default } from "../manifest.json";');
  try {
    await verifyBuiltImportBoundaries(packageRoot, "@lapis-notes/example");
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("rejects relative imports that escape the installed package", async () => {
  const packageRoot = await createFixture('export { default } from "../../manifest.json";');
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
  const packageRoot = await mkdtemp(path.join(os.tmpdir(), "lapis-package-imports-"));
  await mkdir(path.join(packageRoot, "dist"));
  await writeFile(path.join(packageRoot, "dist/index.js"), indexSource);
  return packageRoot;
}
