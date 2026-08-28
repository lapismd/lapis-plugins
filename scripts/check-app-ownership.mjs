#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];
for (const file of await sourceFiles(path.join(root, "packages"))) {
  if (/\.(?:test|spec)\.[cm]?[jt]s$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  if (/\bglobalThis\s*\.\s*app\b/.test(source)) {
    findings.push(`${path.relative(root, file)} reads or assigns globalThis.app`);
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verified explicit App ownership across first-party plugin sources.");
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["dist", "node_modules", ".svelte-kit"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(target)));
    else if (/\.(?:ts|svelte|js|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}
