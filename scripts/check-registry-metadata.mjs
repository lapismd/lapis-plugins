#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { pluginPackages } from "./package-catalog.mjs";
import {
  REGISTRY_MEDIA_TONES,
  resolveFocusCrop,
  validateRegistryCardCopy,
} from "./registry-media-compositor.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxMarkdownBytes = 256 * 1024;
const maxLogoBytes = 512 * 1024;
const maxGalleryBytes = 5 * 1024 * 1024;
const registryOverviewPath = "registry-content/overview.md";
const officialAuthorAvatarUrl =
  "https://www.gravatar.com/avatar/1df68d9ff087b0dd72fd8626056fca7f?s=128&d=404";
const packageInstallInstruction =
  /\b(?:pnpm|npm|yarn|bun)\s+(?:add|install)\b|install for static composition/i;
const allowedKeys = new Set([
  "$schema",
  "schemaVersion",
  "categories",
  "highlights",
  "documentationUrl",
  "appearance",
  "media",
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
  "presentation",
  "search",
  "sparkles",
  "spell-check-2",
  "table-2",
  "whole-word",
]);
const findings = [];

for (const plugin of pluginPackages) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const sourcePath = path.join(packageRoot, "registry.json");
  const manifestPath = path.join(packageRoot, "manifest.json");
  let source;
  try {
    source = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch (error) {
    findings.push(
      `${plugin.directory}: registry.json is missing or invalid (${error.message})`
    );
    continue;
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.authorAvatarUrl !== officialAuthorAvatarUrl) {
      findings.push(
        `${plugin.directory}: manifest authorAvatarUrl must use the official Lapis Gravatar`
      );
    }
  } catch (error) {
    findings.push(
      `${plugin.directory}: manifest.json is missing or invalid (${error.message})`
    );
  }
  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key))
      findings.push(`${plugin.directory}: unsupported registry field ${key}`);
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
  const mediaPaths = new Set();
  await validateMedia(plugin.directory, packageRoot, source.media, mediaPaths);
  await validateGallery(
    plugin.directory,
    packageRoot,
    source.gallery,
    mediaPaths
  );
  const contentKeys = Object.keys(source.content ?? {});
  if (
    contentKeys.length !== 2 ||
    !contentKeys.includes("overview") ||
    !contentKeys.includes("changelog")
  ) {
    findings.push(
      `${plugin.directory}: content must define overview and changelog only`
    );
  }
  if (source.content?.overview !== registryOverviewPath) {
    findings.push(
      `${plugin.directory}: overview must use ${registryOverviewPath}`
    );
  }
  for (const [kind, relativePath] of Object.entries(source.content ?? {})) {
    if (!isSafeMarkdownPath(relativePath)) {
      findings.push(
        `${plugin.directory}: unsafe ${kind} Markdown path ${String(
          relativePath
        )}`
      );
      continue;
    }
    try {
      const file = await stat(path.join(packageRoot, relativePath));
      if (!file.isFile())
        findings.push(`${plugin.directory}: ${relativePath} is not a file`);
      if (file.size > maxMarkdownBytes) {
        findings.push(
          `${plugin.directory}: ${relativePath} exceeds ${maxMarkdownBytes} bytes`
        );
      }
      if (kind === "overview") {
        const markdown = await readFile(
          path.join(packageRoot, relativePath),
          "utf8"
        );
        if (packageInstallInstruction.test(markdown)) {
          findings.push(
            `${plugin.directory}: registry overview contains package installation instructions`
          );
        }
      }
    } catch {
      findings.push(`${plugin.directory}: missing ${relativePath}`);
    }
  }
}

async function validateMedia(directory, packageRoot, media, paths) {
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    findings.push(`${directory}: media must define a banner`);
    return;
  }
  const keys = Object.keys(media);
  if (
    !keys.includes("banner") ||
    keys.length > 2 ||
    keys.some((key) => !["banner", "overview"].includes(key))
  ) {
    findings.push(
      `${directory}: media must define a banner and may define one overview`
    );
  }
  const expectedStoryPrefix = `plugins-${storyIdPluginSegment(
    directory
  )}-registry-screenshots--`;
  for (const role of keys) {
    const item = media[role];
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      Object.keys(item).length !== 3 ||
      Object.keys(item).some(
        (key) => !["alt", "images", "capture"].includes(key)
      )
    ) {
      findings.push(
        `${directory}: ${role} media must define alt, images, and capture only`
      );
      continue;
    }
    if (
      typeof item.alt !== "string" ||
      !item.alt.trim() ||
      item.alt.length > 240
    ) {
      findings.push(
        `${directory}: ${role} alt text must contain 1-240 characters`
      );
    }
    await validateImageVariants(
      directory,
      packageRoot,
      item.images,
      `registry-assets/${role}`,
      paths,
      role
    );
    validateCapture(directory, item.capture, expectedStoryPrefix);
  }
  if (
    media.banner?.capture?.storyId &&
    media.overview?.capture?.storyId &&
    media.banner.capture.storyId === media.overview.capture.storyId
  ) {
    findings.push(
      `${directory}: banner and overview must use different Storybook stories`
    );
  }
}

async function validateAppearance(directory, packageRoot, appearance) {
  if (
    !appearance ||
    typeof appearance !== "object" ||
    Array.isArray(appearance)
  ) {
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
  if (
    typeof appearance.accent !== "string" ||
    !/^#[A-Fa-f0-9]{6}$/.test(appearance.accent)
  ) {
    findings.push(
      `${directory}: appearance.accent must be a six-digit hex colour`
    );
  }
  if (appearance.logo !== undefined) {
    if (
      !appearance.logo ||
      typeof appearance.logo !== "object" ||
      Array.isArray(appearance.logo) ||
      Object.keys(appearance.logo).some(
        (key) => !["path", "alt"].includes(key)
      ) ||
      typeof appearance.logo.alt !== "string" ||
      !appearance.logo.alt.trim() ||
      appearance.logo.alt.length > 120
    ) {
      findings.push(
        `${directory}: appearance.logo must contain only a safe path and bounded alt text`
      );
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

async function validateGallery(directory, packageRoot, gallery, paths) {
  if (!Array.isArray(gallery) || gallery.length < 1 || gallery.length > 5) {
    findings.push(`${directory}: gallery must contain 1-5 cards`);
    return;
  }
  const ids = new Set();
  const storyIds = new Set();
  const expectedStoryPrefix = `plugins-${storyIdPluginSegment(
    directory
  )}-registry-screenshots--`;
  for (const item of gallery) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      findings.push(`${directory}: gallery items must be objects`);
      continue;
    }
    const allowedGalleryKeys = new Set([
      "id",
      "alt",
      "images",
      "capture",
      "card",
    ]);
    for (const key of Object.keys(item)) {
      if (!allowedGalleryKeys.has(key)) {
        findings.push(`${directory}: unsupported gallery field ${key}`);
      }
    }
    if (
      typeof item.id !== "string" ||
      !/^[a-z0-9][a-z0-9-]{0,31}$/.test(item.id)
    ) {
      findings.push(`${directory}: invalid gallery id ${String(item.id)}`);
    } else if (ids.has(item.id)) {
      findings.push(`${directory}: duplicate gallery id ${item.id}`);
    } else {
      ids.add(item.id);
    }
    if (
      typeof item.alt !== "string" ||
      !item.alt.trim() ||
      item.alt.length > 240
    ) {
      findings.push(
        `${directory}: gallery alt text must contain 1-240 characters`
      );
    }
    await validateImageVariants(
      directory,
      packageRoot,
      item.images,
      `registry-assets/gallery/${item.id}`,
      paths,
      "gallery"
    );
    validateCapture(directory, item.capture, expectedStoryPrefix, storyIds);
    validateCard(directory, item.card);
  }
}

async function validateImageVariants(
  directory,
  packageRoot,
  images,
  expectedBasePath,
  paths,
  role
) {
  const variants = ["preview", "full", "light", "dark"];
  const imageKeys = Object.keys(images ?? {});
  if (
    imageKeys.length !== variants.length ||
    variants.some((variant) => !imageKeys.includes(variant))
  ) {
    findings.push(
      `${directory}: ${role} images must define preview, full, light, and dark only`
    );
  }
  for (const variant of variants) {
    const dimensions =
      variant === "preview"
        ? { width: 1200, height: 800 }
        : { width: 2400, height: 1600 };
    const reference = images?.[variant];
    if (
      !reference ||
      typeof reference !== "object" ||
      Array.isArray(reference) ||
      Object.keys(reference).length !== 1
    ) {
      findings.push(`${directory}: ${variant} image must contain a path only`);
      continue;
    }
    const expectedPath = `${expectedBasePath}.${variant}.webp`;
    if (reference.path !== expectedPath) {
      findings.push(`${directory}: ${variant} image must use ${expectedPath}`);
    }
    if (paths.has(reference.path)) {
      findings.push(
        `${directory}: duplicate registry media path ${reference.path}`
      );
    }
    paths.add(reference.path);
    await validateImage(directory, packageRoot, reference.path, {
      label: `${variant} ${role} image`,
      maxBytes: maxGalleryBytes,
      allowSvg: false,
      dimensions: ({ width, height }) =>
        width === dimensions.width && height === dimensions.height,
      dimensionsMessage: `must be ${dimensions.width}x${dimensions.height}`,
    });
  }
}

function validateCapture(directory, capture, expectedStoryPrefix, storyIds) {
  if (
    !capture ||
    typeof capture !== "object" ||
    Array.isArray(capture) ||
    Object.keys(capture).some((key) => !["storyId", "focus"].includes(key)) ||
    Object.keys(capture).length !== 2
  ) {
    findings.push(
      `${directory}: gallery capture must define storyId and focus only`
    );
    return;
  }
  if (
    typeof capture.storyId !== "string" ||
    !capture.storyId.startsWith(expectedStoryPrefix)
  ) {
    findings.push(
      `${directory}: gallery storyId must start with ${expectedStoryPrefix}`
    );
  } else if (storyIds?.has(capture.storyId)) {
    findings.push(`${directory}: duplicate gallery storyId ${capture.storyId}`);
  } else if (storyIds) {
    storyIds.add(capture.storyId);
  }
  try {
    resolveFocusCrop(capture.focus);
  } catch (error) {
    findings.push(`${directory}: ${error.message}`);
  }
}

function validateCard(directory, card) {
  if (
    !card ||
    typeof card !== "object" ||
    Array.isArray(card) ||
    Object.keys(card).length !== 2 ||
    Object.keys(card).some((key) => !["headline", "description"].includes(key))
  ) {
    findings.push(
      `${directory}: gallery card must define headline and description only`
    );
    return;
  }
  if (
    !Array.isArray(card.headline) ||
    card.headline.length < 1 ||
    card.headline.length > 4
  ) {
    findings.push(`${directory}: card headline must contain 1-4 segments`);
  } else {
    for (const segment of card.headline) {
      if (
        !segment ||
        typeof segment !== "object" ||
        Array.isArray(segment) ||
        Object.keys(segment).length !== 2 ||
        typeof segment.text !== "string" ||
        !segment.text.trim() ||
        segment.text.length > 60 ||
        /[#*`<>]/.test(segment.text) ||
        !Object.hasOwn(REGISTRY_MEDIA_TONES, segment.tone)
      ) {
        findings.push(`${directory}: card headline segment is invalid`);
      }
    }
  }
  if (
    !Array.isArray(card.description) ||
    card.description.length < 1 ||
    card.description.length > 6
  ) {
    findings.push(`${directory}: card description must contain 1-6 segments`);
  } else {
    let descriptionLength = 0;
    for (const segment of card.description) {
      if (
        !segment ||
        typeof segment !== "object" ||
        Array.isArray(segment) ||
        Object.keys(segment).length !== 2 ||
        typeof segment.text !== "string" ||
        !segment.text.trim() ||
        segment.text.length > 120 ||
        /[#*`<>]/.test(segment.text) ||
        !Object.hasOwn(REGISTRY_MEDIA_TONES, segment.tone)
      ) {
        findings.push(`${directory}: card description segment is invalid`);
      } else {
        descriptionLength += segment.text.length;
      }
    }
    descriptionLength += Math.max(0, card.description.length - 1);
    if (descriptionLength > 180) {
      findings.push(`${directory}: card description exceeds 180 characters`);
    }
  }
  try {
    validateRegistryCardCopy(card);
  } catch (error) {
    findings.push(`${directory}: ${error.message}`);
  }
}

function storyIdPluginSegment(directory) {
  return (
    {
      spellcheck: "spell-check",
      wordcount: "word-count",
    }[directory] ?? directory
  );
}

async function validateImage(directory, packageRoot, relativePath, options) {
  if (!isSafeAssetPath(relativePath)) {
    findings.push(
      `${directory}: unsafe ${options.label} path ${String(relativePath)}`
    );
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
    findings.push(
      `${directory}: ${relativePath} exceeds the ${options.label} size limit`
    );
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
    findings.push(
      `${directory}: cannot decode ${relativePath} (${error.message})`
    );
    return;
  }
  if (metadata.format !== extension) {
    findings.push(
      `${directory}: ${relativePath} extension does not match its image content`
    );
  }
  if (metadata.format === "svg") {
    if (!options.allowSvg) {
      findings.push(`${directory}: SVG is not permitted for ${options.label}`);
    } else {
      const source = await readFile(sourcePath, "utf8");
      if (containsUnsafeSvg(source)) {
        findings.push(
          `${directory}: ${relativePath} contains unsafe SVG content`
        );
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
  console.log(
    `Verified ${pluginPackages.length} plugin registry metadata sources.`
  );
}

function validateStringList(directory, label, value, options) {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > options.maxItems
  ) {
    findings.push(
      `${directory}: ${label} must contain 1-${options.maxItems} unique values`
    );
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
    value
      .split("/")
      .every((segment) => segment && segment !== "." && segment !== "..")
  );
}

function isSafeAssetPath(value) {
  return (
    typeof value === "string" &&
    /^registry-assets\/[A-Za-z0-9._/-]+\.(?:png|webp|svg)$/.test(value) &&
    !value.includes("\\") &&
    value
      .split("/")
      .every((segment) => segment && segment !== "." && segment !== "..")
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
