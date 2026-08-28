#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxMarkdownBytes = 256 * 1024;
const allowedKeys = new Set([
  "$schema",
  "schemaVersion",
  "categories",
  "highlights",
  "documentationUrl",
  "content",
]);
const findings = [];

for (const plugin of pluginPackages) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const sourcePath = path.join(packageRoot, "registry.json");
  let source;
  try {
    source = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch (error) {
    findings.push(`${plugin.directory}: registry.json is missing or invalid (${error.message})`);
    continue;
  }
  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key)) findings.push(`${plugin.directory}: unsupported registry field ${key}`);
  }
  if (source.schemaVersion !== 1) {
    findings.push(`${plugin.directory}: registry schemaVersion must be 1`);
  }
  validateStringList(plugin.directory, "categories", source.categories, {
    maxItems: 8,
    maxLength: 64,
    pattern: /^[a-z0-9-]+$/,
  });
  validateStringList(plugin.directory, "highlights", source.highlights, {
    maxItems: 8,
    maxLength: 160,
    pattern: /^[^#*`\[\]<>]+$/,
  });
  if (source.documentationUrl && !isHttpsUrl(source.documentationUrl)) {
    findings.push(`${plugin.directory}: documentationUrl must use HTTPS`);
  }
  const contentKeys = Object.keys(source.content ?? {});
  if (contentKeys.length !== 2 || !contentKeys.includes("overview") || !contentKeys.includes("changelog")) {
    findings.push(`${plugin.directory}: content must define overview and changelog only`);
  }
  for (const [kind, relativePath] of Object.entries(source.content ?? {})) {
    if (!isSafeMarkdownPath(relativePath)) {
      findings.push(`${plugin.directory}: unsafe ${kind} Markdown path ${String(relativePath)}`);
      continue;
    }
    try {
      const file = await stat(path.join(packageRoot, relativePath));
      if (!file.isFile()) findings.push(`${plugin.directory}: ${relativePath} is not a file`);
      if (file.size > maxMarkdownBytes) {
        findings.push(`${plugin.directory}: ${relativePath} exceeds ${maxMarkdownBytes} bytes`);
      }
    } catch {
      findings.push(`${plugin.directory}: missing ${relativePath}`);
    }
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${pluginPackages.length} plugin registry metadata sources.`);
}

function validateStringList(directory, label, value, options) {
  if (!Array.isArray(value) || value.length < 1 || value.length > options.maxItems) {
    findings.push(`${directory}: ${label} must contain 1-${options.maxItems} unique values`);
    return;
  }
  if (new Set(value).size !== value.length) {
    findings.push(`${directory}: ${label} values must be unique`);
  }
  for (const item of value) {
    if (
      typeof item !== "string" ||
      !item.trim() ||
      item.length > options.maxLength ||
      !options.pattern.test(item)
    ) {
      findings.push(`${directory}: invalid ${label} value ${String(item)}`);
    }
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeMarkdownPath(value) {
  return (
    typeof value === "string" &&
    value.endsWith(".md") &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..")
  );
}
