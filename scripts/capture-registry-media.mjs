#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import sharp from "sharp";

import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseOptions(process.argv.slice(2));
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "lapis-registry-media-"));
const storybookDirectory = options.storybookDirectory ?? path.join(temporaryRoot, "storybook");

try {
  if (!options.storybookDirectory) {
    await run("pnpm", ["exec", "storybook", "build", "--output-dir", storybookDirectory, "--quiet"]);
  }
  const server = await serveStatic(storybookDirectory);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Storybook server did not bind a TCP port.");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await captureAll(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function captureAll(baseUrl) {
  const catalogResponse = await fetch(`${baseUrl}/index.json`, { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error(`Storybook index returned HTTP ${catalogResponse.status}.`);
  const catalog = await catalogResponse.json();
  const captures = await readCaptures();
  const browser = await chromium.launch({ headless: true });
  const mismatches = [];
  try {
    for (const capture of captures) {
      const story = catalog.entries?.[capture.storyId];
      if (!story || story.type !== "story") {
        throw new Error(`${capture.pluginId}: Storybook story ${capture.storyId} is missing.`);
      }
      if (!story.tags?.includes("visual-pending")) {
        throw new Error(`${capture.pluginId}: ${capture.storyId} must remain visual-pending.`);
      }
      const viewport =
        capture.surface === "desktop"
          ? { width: 1200, height: 800 }
          : { width: 900, height: 1600 };
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        colorScheme: "dark",
        reducedMotion: "reduce",
        locale: "en-GB",
        timezoneId: "UTC",
      });
      const page = await context.newPage();
      try {
        await page.goto(
          `${baseUrl}/iframe.html?id=${encodeURIComponent(capture.storyId)}&viewMode=story`,
          { waitUntil: "networkidle" },
        );
        await page.locator(
          `[data-registry-showcase][data-plugin-id="${capture.pluginId}"]`,
        ).waitFor({ state: "visible" });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await page.addStyleTag({
          content:
            "*,*::before,*::after{animation:none!important;caret-color:transparent!important;transition:none!important}",
        });
        const bytes = await page.screenshot({
          type: "png",
          fullPage: false,
          animations: "disabled",
          caret: "hide",
        });
        const metadata = await sharp(bytes).metadata();
        if (metadata.width !== viewport.width || metadata.height !== viewport.height) {
          throw new Error(
            `${capture.pluginId}: captured ${metadata.width}x${metadata.height}, expected ${viewport.width}x${viewport.height}.`,
          );
        }
        if (options.check) {
          const current = await readFile(capture.outputPath).catch(() => null);
          if (!current || !current.equals(bytes)) mismatches.push(capture.relativePath);
        } else {
          await mkdir(path.dirname(capture.outputPath), { recursive: true });
          await writeFile(capture.outputPath, bytes);
          console.log(`Captured ${capture.storyId} -> ${capture.relativePath}`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (mismatches.length) {
    throw new Error(
      `Registry media is stale or missing:\n${mismatches.map((value) => `- ${value}`).join("\n")}\nRun pnpm registry:media:capture.`,
    );
  }
  if (options.check) {
    console.log(`Verified ${captures.length} deterministic registry media captures.`);
  }
}

async function readCaptures() {
  const captures = [];
  for (const plugin of pluginPackages) {
    const registryPath = path.join(root, "packages", plugin.directory, "registry.json");
    const source = JSON.parse(await readFile(registryPath, "utf8"));
    for (const item of source.gallery ?? []) {
      if (!item.capture?.storyId) {
        throw new Error(`${plugin.directory}: gallery item ${item.id} has no Storybook capture.`);
      }
      const outputPath = path.resolve(root, "packages", plugin.directory, item.path);
      const packageRoot = path.resolve(root, "packages", plugin.directory);
      if (!outputPath.startsWith(`${packageRoot}${path.sep}`)) {
        throw new Error(`${plugin.directory}: unsafe gallery output ${item.path}.`);
      }
      captures.push({
        pluginId: plugin.pluginId,
        storyId: item.capture.storyId,
        surface: item.surface,
        outputPath,
        relativePath: path.relative(root, outputPath),
      });
    }
  }
  return captures;
}

async function serveStatic(directory) {
  const absoluteDirectory = path.resolve(directory);
  await stat(path.join(absoluteDirectory, "index.html"));
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || "index.html";
      let target = path.resolve(absoluteDirectory, relative);
      if (!target.startsWith(`${absoluteDirectory}${path.sep}`) && target !== absoluteDirectory) {
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
        : reject(new Error(`${command} ${args.join(" ")} exited with ${code}.`)),
    );
  });
}

function parseOptions(args) {
  const parsed = { check: false, storybookDirectory: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--check") parsed.check = true;
    else if (value === "--storybook-dir") {
      const directory = args[++index];
      if (!directory) throw new Error("--storybook-dir requires a path.");
      parsed.storybookDirectory = path.resolve(directory);
    } else {
      throw new Error(`Unknown registry media option: ${value}.`);
    }
  }
  return parsed;
}
