#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const invalidProtocol = /^(?:workspace|link|file):/;
const findings = [];

function packageNameFromImport(importPath) {
  return importPath.startsWith("@")
    ? importPath.split("/").slice(0, 2).join("/")
    : importPath.split("/")[0];
}

for (const plugin of pluginPackages) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const packageJson = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  );
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "manifest.json"), "utf8"),
  );

  if (packageJson.private) findings.push(`${plugin.directory}: package is private`);
  if (packageJson.name !== plugin.packageName) {
    findings.push(`${plugin.directory}: package name mismatch`);
  }
  if (packageJson.version !== manifest.version) {
    findings.push(`${plugin.directory}: package and manifest versions differ`);
  }
  if (manifest.id !== plugin.pluginId) {
    findings.push(`${plugin.directory}: runtime plugin ID changed`);
  }
  if (typeof manifest.isDesktopOnly !== "boolean") {
    findings.push(`${plugin.directory}: isDesktopOnly must be an explicit boolean`);
  }
  if (packageJson.publishConfig?.access !== "public") {
    findings.push(`${plugin.directory}: package is not configured public`);
  }
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
    "devDependencies",
  ]) {
    for (const [name, range] of Object.entries(packageJson[field] ?? {})) {
      if (invalidProtocol.test(String(range))) {
        findings.push(`${plugin.directory}: ${field}.${name} uses ${range}`);
      }
      if (
        (field === "dependencies" || field === "optionalDependencies") &&
        name.startsWith("@lapis-notes/")
      ) {
        findings.push(
          `${plugin.directory}: ${field}.${name} must be a peer dependency supplied by the host`,
        );
      }
    }
  }
  for (const sharedDependency of
    manifest.lapis?.runtime?.entries?.workspace?.sharedDependencies ?? []) {
    if (!sharedDependency.startsWith("@lapis-notes/")) continue;
    const hostPackage = packageNameFromImport(sharedDependency);
    if (!packageJson.peerDependencies?.[hostPackage]) {
      findings.push(
        `${plugin.directory}: runtime host module ${sharedDependency} requires peerDependencies.${hostPackage}`,
      );
    }
  }
  for (const exportPath of [
    ".",
    "./manifest.json",
    "./registry.json",
    "./styles.css",
  ]) {
    if (!packageJson.exports?.[exportPath]) {
      findings.push(`${plugin.directory}: missing ${exportPath} export`);
    }
  }
  const runtimeEntry = manifest.lapis?.runtime?.entries?.workspace;
  if (runtimeEntry?.path !== "main.mjs" || runtimeEntry?.format !== "esm") {
    findings.push(`${plugin.directory}: missing official ESM workspace runtime`);
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${pluginPackages.length} public plugin package boundaries.`);
}
