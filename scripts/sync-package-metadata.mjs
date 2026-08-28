#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  frameworkPackageVersions,
  pluginPackages,
} from "./package-catalog.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const mode = process.argv[2] ?? "--check";
assert.ok(
  mode === "--check" || mode === "--write",
  "Usage: sync-package-metadata.mjs --check|--write",
);

const descriptions = new Map([
  ["markdown-lint", "Markdown diagnostics for Lapis applications"],
  ["markdown", "Markdown editing, preview, metadata, and panels for Lapis applications"],
  ["source-editor", "Source editing for text, JSON, and YAML files"],
  ["spellcheck", "Harper grammar and spelling diagnostics for open notes"],
  ["wordcount", "Status bar word, character, and reading-time counts"],
]);
const sharedDependencies = new Map([
  [
    "ai",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/agent-skills",
      "@lapis-notes/api/agent-tools",
      "@lapis-notes/api/app-database",
      "@lapis-notes/api/desktop-native",
      "@lapis-notes/api/path",
      "@lapis-notes/api/vault",
      "@lapis-notes/api/workspace-host",
      "@lapis-notes/markdown/embed",
    ],
  ],
  [
    "bases",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/editor",
      "@lapis-notes/api/editor/core",
      "@lapis-notes/api/editor/extensions/class-highlighter",
      "@lapis-notes/api/icon",
      "@lapis-notes/api/metadata-value",
    ],
  ],
  ["bookmarks", ["@lapis-notes/api"]],
  [
    "graph",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/telemetry",
      "@lapis-notes/markdown/embed",
    ],
  ],
  ["history", ["@lapis-notes/api", "@lapis-notes/api/workspace-host"]],
  [
    "markdown",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/agent-tools",
      "@lapis-notes/api/editor",
      "@lapis-notes/api/editor/core",
      "@lapis-notes/api/editor/language-service",
      "@lapis-notes/api/icon",
      "@lapis-notes/api/vault",
      "@lapis-notes/api/workspace-host",
    ],
  ],
  [
    "markdown-lint",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/language-service",
      "@lapis-notes/api/language-service/worker",
      "@lapis-notes/api/workspace-host",
    ],
  ],
  [
    "search",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/agent-skills",
      "@lapis-notes/api/agent-tools",
    ],
  ],
  [
    "source-editor",
    [
      "@lapis-notes/api",
      "@lapis-notes/api/editor",
      "@lapis-notes/api/workspace-host",
    ],
  ],
  ["spellcheck", ["@lapis-notes/api", "@lapis-notes/api/workspace-host"]],
  ["wordcount", ["@lapis-notes/api"]],
]);

const findings = [];
for (const plugin of pluginPackages) {
  const packageRoot = path.join(repositoryRoot, "packages", plugin.directory);
  const packagePath = path.join(packageRoot, "package.json");
  const manifestPath = path.join(packageRoot, "manifest.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  const normalizedManifest = normalizeManifest(
    manifest,
    plugin,
    packageJson.version,
  );
  const normalizedPackage = normalizePackage(
    packageJson,
    normalizedManifest,
    plugin,
  );
  await compareOrWrite(packagePath, packageJson, normalizedPackage);
  await compareOrWrite(manifestPath, manifest, normalizedManifest);
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    mode === "--write"
      ? `Synchronized ${pluginPackages.length} plugin package manifests.`
      : `Verified ${pluginPackages.length} plugin package manifests.`,
  );
}

function normalizeManifest(manifest, plugin, packageVersion) {
  const packageSharedDependencies = sharedDependencies.get(plugin.directory);
  assert.ok(packageSharedDependencies, `Missing host modules for ${plugin.directory}`);
  const lapis = manifest.lapis ?? {};
  return {
    ...manifest,
    id: plugin.pluginId,
    version: packageVersion,
    minAppVersion: "0.1.0",
    lapis: {
      ...lapis,
      manifestVersion: 1,
      source: "official",
      locked: false,
      enabledByDefault: true,
      runtime: {
        ...(lapis.runtime ?? {}),
        entries: {
          ...(lapis.runtime?.entries ?? {}),
          workspace: {
            ...(lapis.runtime?.entries?.workspace ?? {}),
            path: "main.mjs",
            format: "esm",
            sharedDependencies: packageSharedDependencies,
            requiresReloadOnUpdate: false,
          },
        },
      },
    },
  };
}

function normalizePackage(packageJson, manifest, plugin) {
  const normalized = { ...packageJson };
  delete normalized.private;
  normalized.name = plugin.packageName;
  normalized.version = manifest.version;
  normalized.description =
    packageJson.description ??
    descriptions.get(plugin.directory) ??
    manifest.description;
  normalized.license = "AGPL-3.0-or-later";
  normalized.type = "module";
  normalized.repository = {
    type: "git",
    url: "git+https://github.com/lapismd/lapis-plugins.git",
    directory: `packages/${plugin.directory}`,
  };
  normalized.homepage = `https://github.com/lapismd/lapis-plugins/tree/main/packages/${plugin.directory}#readme`;
  normalized.bugs = {
    url: "https://github.com/lapismd/lapis-plugins/issues",
  };
  normalized.publishConfig = { access: "public" };
  normalized.files = [
    "dist",
    "manifest.json",
    "registry.json",
    "styles.css",
    "README.md",
    "CHANGELOG.md",
    "LICENSE.md",
    "!dist/**/*.test.*",
    "!dist/**/*.spec.*",
  ];
  normalized.sideEffects = ["**/*.css"];
  normalized.svelte = "./dist/index.js";
  normalized.types = "./dist/index.d.ts";
  normalized.exports = normalizeExports(normalized.exports);
  normalized.scripts = normalizeScripts(packageJson.scripts ?? {});
  moveHostPackagesToPeers(normalized);
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
    "devDependencies",
  ]) {
    if (normalized[field]) {
      normalized[field] = normalizeDependencies(normalized[field]);
    }
  }
  return normalized;
}

function moveHostPackagesToPeers(packageJson) {
  const peerDependencies = { ...(packageJson.peerDependencies ?? {}) };
  for (const field of ["dependencies", "optionalDependencies"]) {
    const dependencies = { ...(packageJson[field] ?? {}) };
    for (const [name, version] of Object.entries(dependencies)) {
      if (!name.startsWith("@lapis-notes/")) continue;
      peerDependencies[name] = version;
      delete dependencies[name];
    }
    if (Object.keys(dependencies).length > 0) packageJson[field] = dependencies;
    else delete packageJson[field];
  }
  if (Object.keys(peerDependencies).length > 0) {
    packageJson.peerDependencies = peerDependencies;
  }
}

function normalizeExports(exports) {
  const normalized =
    exports && typeof exports === "object" && !Array.isArray(exports)
      ? { ...exports }
      : {};
  normalized["."] = {
    types: "./dist/index.d.ts",
    svelte: "./dist/index.js",
    import: "./dist/index.js",
    default: "./dist/index.js",
  };
  normalized["./manifest.json"] = "./manifest.json";
  normalized["./registry.json"] = "./registry.json";
  normalized["./styles.css"] = "./styles.css";
  return normalized;
}

function normalizeScripts(scripts) {
  const normalized = { ...scripts };
  normalized.build = "pnpm run prepack";
  normalized.prepack = normalized.prepack?.includes("svelte-package")
    ? normalized.prepack
    : "svelte-package --input src --output dist --tsconfig tsconfig.json && publint";
  if (!normalized.prepack.includes("publint")) {
    normalized.prepack = `${normalized.prepack} && publint`;
  }
  normalized.publint = "publint";
  normalized.pack = "pnpm pack --pack-destination ../../.release/npm";
  if (normalized.check?.includes("packages/plugins/")) {
    normalized.check = normalized.check
      .replace(
        /pnpm --dir \.\.\/\.\.\/\.\. check:no-tailwind packages\/plugins\/plugin-[^ ]+\/src && /,
        "",
      );
  }
  return normalized;
}

function normalizeDependencies(dependencies) {
  const normalized = {};
  for (const [name, version] of Object.entries(dependencies).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    normalized[name] = frameworkPackageVersions.get(name) ??
      version;
  }
  return normalized;
}

async function compareOrWrite(filePath, current, normalized) {
  const expected = `${JSON.stringify(normalized, null, 2)}\n`;
  if (mode === "--write") {
    await writeFile(filePath, expected);
    return;
  }
  const actual = `${JSON.stringify(current, null, 2)}\n`;
  if (actual !== expected) {
    findings.push(
      `${path.relative(repositoryRoot, filePath)} is not synchronized; run pnpm packages:sync`,
    );
  }
}
