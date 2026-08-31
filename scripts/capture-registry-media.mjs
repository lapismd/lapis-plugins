#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureSubjectWithBrowser } from "@lapismd/storybook-addon-visual-delta/node";

import { pluginPackageBySelector, pluginPackages } from "./package-catalog.mjs";
import {
  composeRegistryMedia,
  composeRegistryProductMedia,
  defaultRegistryMediaFontPath,
  REGISTRY_MEDIA_DIMENSIONS,
} from "./registry-media-compositor.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseOptions(process.argv.slice(2));
const selectedPlugin = options.plugin
  ? pluginPackageBySelector(options.plugin)
  : undefined;
if (options.plugin && !selectedPlugin) {
  throw new Error(`Unknown plugin selector ${options.plugin}.`);
}
const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "lapis-registry-media-")
);
const storybookDirectory =
  options.storybookDirectory ?? path.join(temporaryRoot, "storybook");

try {
  if (!options.storybookDirectory) {
    await run("pnpm", [
      "exec",
      "storybook",
      "build",
      "--output-dir",
      storybookDirectory,
      "--quiet",
    ]);
  }
  const server = await serveStatic(storybookDirectory);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Storybook server did not bind a TCP port.");
  }
  try {
    await captureAll(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function captureAll(baseUrl) {
  const catalogResponse = await fetch(`${baseUrl}/index.json`, {
    cache: "no-store",
  });
  if (!catalogResponse.ok) {
    throw new Error(`Storybook index returned HTTP ${catalogResponse.status}.`);
  }
  const catalog = await catalogResponse.json();
  const captures = await readCaptures();
  const mismatches = [];
  const storyThemeCaptures = new Map();
  const fontPath = defaultRegistryMediaFontPath(root);
  await stat(fontPath);

  for (const capture of captures) {
    validateCatalogEntry(catalog, capture);
    const lightSource = await captureStoryTheme(
      capture,
      "light",
      baseUrl,
      storyThemeCaptures
    );
    const darkSource = await captureStoryTheme(
      capture,
      "dark",
      baseUrl,
      storyThemeCaptures
    );
    if (lightSource.equals(darkSource)) {
      throw new Error(
        `${capture.pluginId}: ${capture.storyId} produced identical light and dark captures.`
      );
    }
    const composed =
      capture.role === "gallery"
        ? await composeRegistryMedia({
            lightSource,
            darkSource,
            focus: capture.focus,
            card: capture.card,
            fontPath,
          })
        : await composeRegistryProductMedia({ lightSource, darkSource });
    for (const variant of ["preview", "full", "light", "dark"]) {
      const output = capture.images[variant];
      const bytes = composed[variant];
      if (options.check) {
        const current = await readFile(output.outputPath).catch(() => null);
        if (!current || !current.equals(bytes))
          mismatches.push(output.relativePath);
      } else {
        await mkdir(path.dirname(output.outputPath), { recursive: true });
        await writeFile(output.outputPath, bytes);
        process.stdout.write(`Generated ${output.relativePath}\n`);
      }
    }
  }

  if (mismatches.length) {
    throw new Error(
      `Registry media is stale or missing:\n${mismatches
        .map((value) => `- ${value}`)
        .join("\n")}\nRun pnpm registry:media:capture${
        options.plugin ? ` -- --plugin ${options.plugin}` : ""
      }.`
    );
  }
  if (options.check) {
    process.stdout.write(
      `Verified ${captures.length} deterministic registry media items.\n`
    );
  }
}

async function captureStoryTheme(capture, theme, baseUrl, cache) {
  const cacheKey = `${capture.storyId}:${theme}`;
  if (!cache.has(cacheKey)) {
    cache.set(
      cacheKey,
      (async () => {
        let phase = "launching";
        const result = await captureSubjectWithBrowser(
          {
            origin: baseUrl,
            storyId: capture.storyId,
            viewport: { width: 1200, height: 800 },
            deviceScaleFactor: 2,
            cropToViewport: true,
            globals: `colorMode:${theme};theme:lapis`,
            browser: "chromium",
          },
          (progress) => {
            if (progress.phase !== phase) {
              phase = progress.phase;
              process.stdout.write(
                `${options.check ? "Checking" : "Capturing"} ${
                  capture.storyId
                } (${theme}): ${progress.label}\n`
              );
            }
          }
        );
        if (!result.ok) {
          throw new Error(`${capture.pluginId}: ${result.error}`);
        }
        if (
          result.width !== REGISTRY_MEDIA_DIMENSIONS.capture.width ||
          result.height !== REGISTRY_MEDIA_DIMENSIONS.capture.height
        ) {
          throw new Error(
            `${capture.pluginId}: captured ${result.width}x${result.height}; expected 2400x1600.`
          );
        }
        return Buffer.from(result.pngBase64, "base64");
      })()
    );
  }
  return cache.get(cacheKey);
}

async function readCaptures() {
  const captures = [];
  const selected = selectedPlugin ? [selectedPlugin] : pluginPackages;
  for (const plugin of selected) {
    const packageRoot = path.resolve(root, "packages", plugin.directory);
    const registryPath = path.join(packageRoot, "registry.json");
    const source = JSON.parse(await readFile(registryPath, "utf8"));
    for (const role of ["banner", "overview"]) {
      const item = source.media?.[role];
      if (!item?.capture?.storyId) {
        throw new Error(
          `${plugin.directory}: ${role} media has no Storybook capture.`
        );
      }
      captures.push(
        registryCapture({
          plugin,
          packageRoot,
          role,
          item,
        })
      );
    }
    for (const item of source.gallery ?? []) {
      if (!item.capture?.storyId) {
        throw new Error(
          `${plugin.directory}: gallery item ${item.id} has no Storybook capture.`
        );
      }
      captures.push(
        registryCapture({
          plugin,
          packageRoot,
          role: "gallery",
          item,
        })
      );
    }
  }
  return captures;
}

function registryCapture({ plugin, packageRoot, role, item }) {
  const basePath =
    role === "gallery"
      ? `registry-assets/gallery/${item.id}`
      : `registry-assets/${role}`;
  return {
    role,
    pluginId: plugin.pluginId,
    pluginDirectory: plugin.directory,
    expectedTitle: registryStoryTitle(plugin.directory),
    storyId: item.capture.storyId,
    focus: item.capture.focus,
    card: item.card,
    images: Object.fromEntries(
      ["preview", "full", "light", "dark"].map((variant) => [
        variant,
        resolveOutput(
          packageRoot,
          item.images?.[variant]?.path,
          plugin.directory,
          `${basePath}.${variant}.webp`
        ),
      ])
    ),
  };
}

function resolveOutput(packageRoot, relativePath, directory, expectedPath) {
  if (
    typeof relativePath !== "string" ||
    relativePath !== expectedPath ||
    !/^registry-assets\/(?:gallery\/[a-z0-9][a-z0-9-]*\.|(?:banner|overview)\.)(?:preview|full|light|dark)\.webp$/.test(
      relativePath
    )
  ) {
    throw new Error(
      `${directory}: unsafe registry media output ${relativePath}.`
    );
  }
  const outputPath = path.resolve(packageRoot, relativePath);
  if (!outputPath.startsWith(`${packageRoot}${path.sep}`)) {
    throw new Error(
      `${directory}: unsafe registry media output ${relativePath}.`
    );
  }
  return {
    outputPath,
    relativePath: path.relative(root, outputPath),
  };
}

function validateCatalogEntry(catalog, capture) {
  const story = catalog.entries?.[capture.storyId];
  if (!story || story.type !== "story") {
    throw new Error(
      `${capture.pluginDirectory}: Storybook story ${capture.storyId} is missing.`
    );
  }
  if (story.title !== capture.expectedTitle) {
    throw new Error(
      `${capture.pluginDirectory}: ${capture.storyId} belongs to ${story.title}, expected ${capture.expectedTitle}.`
    );
  }
  for (const tag of ["registry-media", "visual-pending"]) {
    if (!story.tags?.includes(tag)) {
      throw new Error(
        `${capture.pluginDirectory}: ${capture.storyId} requires tag ${tag}.`
      );
    }
  }
}

function registryStoryTitle(directory) {
  const labels = {
    ai: "AI",
    bases: "Bases",
    bookmarks: "Bookmarks",
    graph: "Graph",
    history: "History",
    markdown: "Markdown",
    "markdown-lint": "Markdown Lint",
    search: "Search",
    "source-editor": "Source Editor",
    spellcheck: "Spell Check",
    wordcount: "Word Count",
  };
  return `Plugins/${labels[directory]}/Registry Screenshots`;
}

async function serveStatic(directory) {
  const absoluteDirectory = path.resolve(directory);
  await stat(path.join(absoluteDirectory, "index.html"));
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const relative =
        decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") ||
        "index.html";
      let target = path.resolve(absoluteDirectory, relative);
      if (
        !target.startsWith(`${absoluteDirectory}${path.sep}`) &&
        target !== absoluteDirectory
      ) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const targetStat = await stat(target);
      if (targetStat.isDirectory()) target = path.join(target, "index.html");
      const bytes = await readFile(target);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentType(target),
      });
      response.end(bytes);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

function contentType(filePath) {
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".woff2": "font/woff2",
    }[path.extname(filePath)] ?? "application/octet-stream"
  );
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, TZ: "UTC" },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} exited with ${code}.`))
    );
  });
}

function parseOptions(args) {
  const parsed = {
    check: false,
    plugin: undefined,
    storybookDirectory: undefined,
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--") continue;
    if (value === "--check") parsed.check = true;
    else if (value === "--plugin") {
      parsed.plugin = args[++index];
      if (!parsed.plugin) throw new Error("--plugin requires a selector.");
    } else if (value === "--storybook-dir") {
      const directory = args[++index];
      if (!directory) throw new Error("--storybook-dir requires a path.");
      parsed.storybookDirectory = path.resolve(directory);
    } else {
      throw new Error(`Unknown registry media option: ${value}.`);
    }
  }
  return parsed;
}
