#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];
for (const file of await sourceFiles(path.join(root, "packages"))) {
  const source = await readFile(file, "utf8");
  for (const classValue of classValues(source)) {
    for (const token of classValue.split(/\s+/).filter(Boolean)) {
      if (isTailwindUtility(token)) {
        findings.push(
          `${path.relative(root, file)} contains Tailwind utility ${token}`,
        );
      }
    }
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verified plugin sources do not use Tailwind utility classes.");
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["dist", "node_modules", ".svelte-kit"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(target)));
    else if (/\.(?:svelte|tsx?|jsx?)$/.test(entry.name)) files.push(target);
  }
  return files;
}

function classValues(source) {
  const values = [];
  for (const match of source.matchAll(
    /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    values.push(match[1] ?? match[2] ?? "");
  }
  for (const match of source.matchAll(/\bclass\s*=\s*\{([\s\S]{0,1500}?)\}/g)) {
    for (const literal of (match[1] ?? "").matchAll(/(["'])(?:\\.|(?!\1)[^\\])*\1/g)) {
      values.push(literal[0].slice(1, -1));
    }
  }
  return values;
}

function isTailwindUtility(token) {
  if (/^cn-[a-z0-9-]+$/i.test(token)) return false;
  const candidate = token.replace(/^!/, "").split(":").at(-1);
  if (!candidate || candidate === "sr-only" || candidate === "not-sr-only") {
    return false;
  }
  if (
    /^(?:flex|inline-flex|grid|block|inline-block|inline|hidden|contents|table|table-row|table-cell|group|peer|container)$/.test(
      candidate,
    )
  ) {
    return true;
  }
  return /^(?:flex|grid|col|row|order|grow|shrink|basis|items|justify|content|self|place|gap|space|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|ms|me|w|h|min-w|max-w|min-h|max-h|size|bg|text|border|rounded|shadow|ring|outline|font|leading|tracking|whitespace|break|truncate|overflow|object|aspect|opacity|cursor|pointer-events|select|transition|duration|delay|ease|animate|absolute|relative|fixed|sticky|static|inset|top|right|bottom|left|start|end|z|visible|invisible|columns|divide|underline|decoration|uppercase|lowercase|capitalize|italic|not-italic|list|align|peer-|group-)-/.test(
    candidate,
  );
}
