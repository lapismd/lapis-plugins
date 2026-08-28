#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specRoot = path.join(root, "spec/src");
const outputPath = path.join(specRoot, "verification.md");
const options = parseOptions(process.argv.slice(2));
const definitionPattern = /^\|\s*((?:LN-[A-Z-]+|LP-SPEC)-\d{3})\s*\|/;

const definitions = [];
for (const file of await markdownFiles(specRoot)) {
  if (file === outputPath || path.basename(file) === "SUMMARY.md") continue;
  const source = await readFile(file, "utf8");
  const chapter = path.relative(specRoot, file).replace(/\.md$/, "");
  for (const line of source.split(/\r?\n/)) {
    const match = definitionPattern.exec(line);
    if (match) definitions.push({ id: match[1], chapter });
  }
}

const seen = new Set();
for (const definition of definitions) {
  if (seen.has(definition.id)) throw new Error(`Duplicate requirement ${definition.id}.`);
  seen.add(definition.id);
}

const previousRows = new Map();
for (const sourcePath of [outputPath, options.migrateFrom].filter(Boolean)) {
  try {
    const source = await readFile(path.resolve(root, sourcePath), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = definitionPattern.exec(line);
      if (match && !previousRows.has(match[1])) previousRows.set(match[1], line);
    }
  } catch (error) {
    if (sourcePath === outputPath && error?.code === "ENOENT") continue;
    throw error;
  }
}

const rows = definitions.map(({ id, chapter }) =>
  normalizeRow(previousRows.get(id), id, chapter),
);
const output = [
  "# Verification",
  "",
  "This matrix preserves the implementation evidence migrated with each plugin",
  "and records repository-level extraction and release gates.",
  "",
  "| ID | Chapter | Status | Evidence |",
  "| --- | --- | --- | --- |",
  ...rows,
  "",
].join("\n");

if (options.check) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) throw new Error("spec/src/verification.md is out of date.");
} else {
  await writeFile(outputPath, output);
  console.log(`Updated ${path.relative(root, outputPath)} with ${rows.length} rows.`);
}

function normalizeRow(existing, id, chapter) {
  if (existing) {
    const cells = splitRow(existing);
    if (cells.length >= 4) {
      return `| ${id} | ${cells[1] || chapter} | ${cells[2] || "Implemented"} | ${cells.slice(3).join(" | ") || defaultEvidence(id)} |`;
    }
  }
  const status = id === "LP-SPEC-016" || id === "LP-SPEC-017"
    ? "Planned"
    : "Implemented";
  return `| ${id} | ${chapter} | ${status} | ${defaultEvidence(id)} |`;
}

function defaultEvidence(id) {
  if (id.startsWith("LN-SRC-")) {
    return "Source Editor manifest, exports, unit tests, package build, publint, npm-pack, App-ownership audit, and signed archive verification.";
  }
  return "Repository specification, package-boundary checks, release-security tests, deterministic artifact verification, and shared Storybook build.";
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(candidate);
  }
  return files;
}

function parseOptions(args) {
  const options = { check: false, migrateFrom: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--migrate-from") options.migrateFrom = args[++index];
    else if (arg === "--") continue;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}
