import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { build } from "vite";
import { chromium } from "@playwright/test";
import * as runtime from "./lib/runtime-host-modules.mjs";

test("browser runtime creates a TanStack table without a process global", async () => {
  const local = new URL("../packages/bases/.local/", import.meta.url);
  await mkdir(local, { recursive: true });
  const root = await mkdtemp(new URL("browser-environment-", local).pathname);
  let browser, server;
  try {
    const entry = path.join(root, "entry.mjs");
    await writeFile(
      entry,
      `import {createTable,getCoreRowModel} from "@tanstack/table-core";
export function tableName(){const table=createTable({data:[{name:"Aurora"}],columns:[{accessorKey:"name"}],state:{},getCoreRowModel:getCoreRowModel()});return table.getRowModel().rows[0].original.name;}`,
    );
    await build({
      root,
      configFile: false,
      logLevel: "silent",
      define: runtime.pluginRuntimeBrowserDefines,
      build: {
        outDir: path.join(root, "dist"),
        minify: false,
        lib: { entry, formats: ["es"], fileName: () => "main.mjs" },
      },
    });
    const html = `<!doctype html><script type="module">try{const {tableName}=await import("/main.mjs");window.browserResult={name:tableName(),processType:typeof process};}catch(error){window.browserResult={error:error.message};}</script>`;
    server = http.createServer(async (request, response) => {
      try {
        if (request.url === "/") {
          response.setHeader("Content-Type", "text/html");
          response.end(html);
          return;
        }
        if (request.url !== "/main.mjs") throw new Error("Unavailable");
        response.setHeader("Content-Type", "text/javascript");
        response.end(await readFile(path.join(root, "dist/main.mjs")));
      } catch {
        response.writeHead(404);
        response.end();
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.browserResult);
    assert.deepEqual(await page.evaluate(() => window.browserResult), {
      name: "Aurora",
      processType: "undefined",
    });
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
