#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyPluginBundle } from "./lib/verify-plugin-release.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.resolve(root, process.argv[2] ?? ".release/plugins");
const publicKey = await readFile(
  path.join(root, ".release/plugin-release-public.pem"),
  "utf8",
);
const bundlePaths = await findBundles(releaseRoot);
if (!bundlePaths.length) throw new Error(`No .lapis-plugin bundles under ${releaseRoot}.`);

for (const bundlePath of bundlePaths) {
  const bundleBytes = await readFile(bundlePath);
  verifyPluginBundle({ bundleBytes, publicKey });
  const expectedChecksum = (await readFile(`${bundlePath}.sha256`, "utf8")).split(/\s+/)[0];
  const actualChecksum = createHash("sha256").update(bundleBytes).digest("hex");
  if (expectedChecksum !== actualChecksum) {
    throw new Error(`${path.basename(bundlePath)} checksum file is invalid.`);
  }
  console.log(`Verified ${path.basename(bundlePath)} (${actualChecksum}).`);
}

async function findBundles(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await findBundles(target)));
    else if (entry.isFile() && entry.name.endsWith(".lapis-plugin")) paths.push(target);
  }
  return paths.sort();
}
