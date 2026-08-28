#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { pluginPackages } from "./package-catalog.mjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".release/npm");
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const manifest = [];

for (const plugin of pluginPackages) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const { stdout } = await execFileAsync(
    "pnpm",
    ["pack", "--json", "--pack-destination", outDir],
    { cwd: packageRoot, maxBuffer: 20 * 1024 * 1024 },
  );
  const result = parsePackResult(stdout);
  if (!result?.filename) throw new Error(`${plugin.packageName} did not produce a tarball.`);
  const tarballPath = path.resolve(packageRoot, result.filename);
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  const serialized = JSON.stringify(packageJson);
  if (/"(?:workspace|link|file):/.test(serialized)) {
    throw new Error(`${plugin.packageName} tarball metadata contains a local dependency protocol.`);
  }
  const files = result.files?.map((file) => file.path).sort() ?? [];
  for (const required of [
    "CHANGELOG.md",
    "LICENSE.md",
    "README.md",
    "dist/index.js",
    "manifest.json",
    "package.json",
    "styles.css",
  ]) {
    if (!files.includes(required)) {
      throw new Error(`${plugin.packageName} tarball is missing ${required}.`);
    }
  }
  const checksum = createHash("sha256")
    .update(await readFile(tarballPath))
    .digest("hex");
  await writeFile(`${tarballPath}.sha256`, `${checksum}  ${path.basename(tarballPath)}\n`);
  manifest.push({
    packageName: plugin.packageName,
    pluginId: plugin.pluginId,
    version: packageJson.version,
    tarball: path.relative(root, tarballPath),
    sha256: checksum,
    files,
  });
  console.log(`Packed ${plugin.packageName}@${packageJson.version}: ${checksum}`);
}

await writeFile(
  path.join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

function parsePackResult(stdout) {
  const starts = [0];
  for (let index = 0; index < stdout.length; index += 1) {
    if (stdout[index] === "\n" && (stdout[index + 1] === "{" || stdout[index + 1] === "[")) {
      starts.push(index + 1);
    }
  }
  for (const start of starts.reverse()) {
    try {
      const parsed = JSON.parse(stdout.slice(start));
      return Array.isArray(parsed) ? parsed.at(-1) : parsed;
    } catch {
      // Lifecycle output can precede pnpm's final JSON object.
    }
  }
  throw new Error("pnpm pack did not emit parseable JSON metadata.");
}
