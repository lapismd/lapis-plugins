#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxMarkdownBytes = 256 * 1024;
const maxLogoBytes = 512 * 1024;
const maxGalleryBytes = 5 * 1024 * 1024;
const registryOverviewPath = "registry-content/overview.md";
const packageInstallInstruction =
  /\b(?:pnpm|npm|yarn|bun)\s+(?:add|install)\b|install for static composition/i;
const allowedKeys = new Set([
  "$schema",
  "schemaVersion",
  "categories",
  "highlights",
  "documentationUrl",
  "appearance",
  "gallery",
  "content",
]);
const allowedIcons = new Set([
  "bookmark",
  "file-code-2",
  "file-text",
  "history",
  "list-checks",
  "network",
  "package",
  "search",
  "sparkles",
  "spell-check-2",
  "table-2",
  "whole-word",
]);
const expectedRegistryStories = new Map([
  ["ai", "plugins-ai-registry--overview"],
  ["bases", "plugins-bases-registry--overview"],
  ["bookmarks", "plugins-bookmarks-registry--overview"],
  ["graph", "plugins-graph-registry--overview"],
  ["history", "plugins-history-registry--overview"],
  ["markdown", "plugins-markdown-registry--overview"],
  ["markdown-lint", "plugins-markdown-lint-registry--overview"],
  ["search", "plugins-search-registry--overview"],
  ["source-editor", "plugins-source-editor-registry--overview"],
  ["spellcheck", "plugins-spellcheck-registry--overview"],
  ["wordcount", "plugins-word-count-registry--overview"],
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
  await validateAppearance(plugin.directory, packageRoot, source.appearance);
  await validateGallery(plugin.directory, packageRoot, source.gallery);
  const contentKeys = Object.keys(source.content ?? {});
  if (contentKeys.length !== 2 || !contentKeys.includes("overview") || !contentKeys.includes("changelog")) {
    findings.push(`${plugin.directory}: content must define overview and changelog only`);
  }
  if (source.content?.overview !== registryOverviewPath) {
    findings.push(`${plugin.directory}: overview must use ${registryOverviewPath}`);
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
      if (kind === "overview") {
        const markdown = await readFile(path.join(packageRoot, relativePath), "utf8");
        if (packageInstallInstruction.test(markdown)) {
          findings.push(`${plugin.directory}: registry overview contains package installation instructions`);
        }
      }
    } catch {
      findings.push(`${plugin.directory}: missing ${relativePath}`);
    }
  }
}

async function validateAppearance(directory, packageRoot, appearance) {
  if (!appearance || typeof appearance !== "object" || Array.isArray(appearance)) {
    findings.push(`${directory}: appearance is required`);
    return;
  }
  const allowedAppearanceKeys = new Set(["icon", "accent", "logo"]);
  for (const key of Object.keys(appearance)) {
    if (!allowedAppearanceKeys.has(key)) {
      findings.push(`${directory}: unsupported appearance field ${key}`);
    }
  }
  if (!allowedIcons.has(appearance.icon)) {
    findings.push(`${directory}: appearance.icon is not allowlisted`);
  }
  if (typeof appearance.accent !== "string" || !/^#[A-Fa-f0-9]{6}$/.test(appearance.accent)) {
    findings.push(`${directory}: appearance.accent must be a six-digit hex colour`);
  }
  if (appearance.logo !== undefined) {
    if (
      !appearance.logo ||
      typeof appearance.logo !== "object" ||
      Array.isArray(appearance.logo) ||
      Object.keys(appearance.logo).some((key) => !["path", "alt"].includes(key)) ||
      typeof appearance.logo.alt !== "string" ||
      !appearance.logo.alt.trim() ||
      appearance.logo.alt.length > 120
    ) {
      findings.push(`${directory}: appearance.logo must contain only a safe path and bounded alt text`);
      return;
    }
    await validateImage(directory, packageRoot, appearance.logo.path, {
      label: "logo",
      maxBytes: maxLogoBytes,
      allowSvg: true,
      dimensions: ({ width, height }) =>
        width === height && width >= 64 && width <= 1024,
      dimensionsMessage: "must be square and between 64 and 1024 pixels",
    });
  }
}

async function validateGallery(directory, packageRoot, gallery) {
  if (!Array.isArray(gallery) || gallery.length < 1 || gallery.length > 10) {
    findings.push(`${directory}: gallery must contain 1-10 images`);
    return;
  }
  const ids = new Set();
  const paths = new Set();
  const surfaceCounts = { desktop: 0, mobile: 0 };
  const expectedStoryId = expectedRegistryStories.get(directory);
  for (const item of gallery) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      findings.push(`${directory}: gallery items must be objects`);
      continue;
    }
    const allowedGalleryKeys = new Set([
      "id",
      "path",
      "surface",
      "alt",
      "caption",
      "capture",
    ]);
    for (const key of Object.keys(item)) {
      if (!allowedGalleryKeys.has(key)) {
        findings.push(`${directory}: unsupported gallery field ${key}`);
      }
    }
    if (typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(item.id)) {
      findings.push(`${directory}: invalid gallery id ${String(item.id)}`);
    } else if (ids.has(item.id)) {
      findings.push(`${directory}: duplicate gallery id ${item.id}`);
    } else {
      ids.add(item.id);
    }
    if (typeof item.path === "string" && paths.has(item.path)) {
      findings.push(`${directory}: duplicate gallery path ${item.path}`);
    }
    paths.add(item.path);
    if (item.surface !== "desktop" && item.surface !== "mobile") {
      findings.push(`${directory}: gallery surface must be desktop or mobile`);
      continue;
    }
    surfaceCounts[item.surface] += 1;
    if (surfaceCounts[item.surface] > 5) {
      findings.push(`${directory}: gallery permits at most five ${item.surface} images`);
    }
    if (typeof item.alt !== "string" || !item.alt.trim() || item.alt.length > 240) {
      findings.push(`${directory}: gallery alt text must contain 1-240 characters`);
    }
    if (item.caption !== undefined && (typeof item.caption !== "string" || !item.caption.trim() || item.caption.length > 240)) {
      findings.push(`${directory}: gallery caption must contain 1-240 characters`);
    }
    if (
      !item.capture ||
      typeof item.capture !== "object" ||
      Object.keys(item.capture).length !== 1 ||
      item.capture.storyId !== expectedStoryId
    ) {
      findings.push(`${directory}: gallery capture must reference ${expectedStoryId}`);
    }
    await validateImage(directory, packageRoot, item.path, {
      label: `${item.surface} gallery image`,
      maxBytes: maxGalleryBytes,
      allowSvg: false,
      dimensions: ({ width, height }) =>
        item.surface === "desktop"
          ? width === 1200 && height === 800
          : width === 900 && height === 1600,
      dimensionsMessage:
        item.surface === "desktop" ? "must be 1200x800" : "must be 900x1600",
    });
  }
  if (surfaceCounts.desktop === 0) {
    findings.push(`${directory}: gallery requires a desktop image`);
  }
  try {
    const storySource = await readFile(
      path.join(root, "stories", "plugins", directory, "RegistryOverview.stories.ts"),
      "utf8",
    );
    if (!storySource.includes('tags: ["visual-pending"]') || !storySource.includes("export const Overview")) {
      findings.push(`${directory}: registry story must export Overview and remain visual-pending`);
    }
  } catch {
    findings.push(`${directory}: registry Storybook story is missing`);
  }
}

async function validateImage(directory, packageRoot, relativePath, options) {
  if (!isSafeAssetPath(relativePath)) {
    findings.push(`${directory}: unsafe ${options.label} path ${String(relativePath)}`);
    return;
  }
  const sourcePath = path.join(packageRoot, relativePath);
  let file;
  try {
    file = await stat(sourcePath);
    if (!file.isFile()) throw new Error("not a file");
  } catch {
    findings.push(`${directory}: missing ${relativePath}`);
    return;
  }
  if (file.size < 1 || file.size > options.maxBytes) {
    findings.push(`${directory}: ${relativePath} exceeds the ${options.label} size limit`);
    return;
  }
  const extension = path.extname(relativePath).slice(1).toLowerCase();
  let metadata;
  try {
    metadata = await sharp(sourcePath, {
      failOn: "warning",
      limitInputPixels: 20_000_000,
    }).metadata();
  } catch (error) {
    findings.push(`${directory}: cannot decode ${relativePath} (${error.message})`);
    return;
  }
  if (metadata.format !== extension) {
    findings.push(`${directory}: ${relativePath} extension does not match its image content`);
  }
  if (metadata.format === "svg") {
    if (!options.allowSvg) {
      findings.push(`${directory}: SVG is not permitted for ${options.label}`);
    } else {
      const source = await readFile(sourcePath, "utf8");
      if (containsUnsafeSvg(source)) {
        findings.push(`${directory}: ${relativePath} contains unsafe SVG content`);
      }
    }
  }
  if (!options.dimensions({ width: metadata.width, height: metadata.height })) {
    findings.push(`${directory}: ${relativePath} ${options.dimensionsMessage}`);
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

function isSafeAssetPath(value) {
  return (
    typeof value === "string" &&
    /^registry-assets\/[A-Za-z0-9._/-]+\.(?:png|webp|svg)$/.test(value) &&
    !value.includes("\\") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..")
  );
}

function containsUnsafeSvg(source) {
  return (
    !/<svg\b/i.test(source) ||
    [
      /<script\b/i,
      /<foreignObject\b/i,
      /<!DOCTYPE\b/i,
      /<!ENTITY\b/i,
      /\bon[a-z]+\s*=/i,
      /(?:href|xlink:href)\s*=\s*["'](?!#)/i,
      /url\s*\(\s*["']?(?!#)/i,
      /@import\b/i,
      /\bdata:/i,
    ].some((pattern) => pattern.test(source))
  );
}
