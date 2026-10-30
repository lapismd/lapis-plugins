import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { build } from "vite";
import { chromium } from "@playwright/test";
import {
  pluginRuntimeEntryBuildOptions,
  pluginRuntimeViteBase,
} from "./lib/runtime-host-modules.mjs";

test("module workers resolve dynamic chunks after worker initialization", async () => {
  const local = new URL("../.local/", import.meta.url);
  await mkdir(local, { recursive: true });
  const root = await mkdtemp(new URL("module-worker-", local).pathname);
  let browser, server;
  try {
    const entry = path.join(root, "entry.mjs");
    await writeFile(
      entry,
      `export function runWorker(){return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker.onmessage=event=>{worker.terminate();resolve(event.data);};worker.onerror=event=>{worker.terminate();reject(new Error(event.message));};worker.postMessage('start');});}`,
    );
    await writeFile(
      path.join(root, "worker.js"),
      `globalThis.workerInitialized=true;self.onmessage=async()=>{const runtime=await import('./runtime.js');self.postMessage(runtime.answer);};`,
    );
    await writeFile(
      path.join(root, "runtime.js"),
      `if(globalThis.workerInitialized!==true)throw new Error('Runtime executed before worker initialization');export const answer=42;`,
    );
    const entryOptions = pluginRuntimeEntryBuildOptions(entry);
    const dist = path.join(root, "dist");
    await build({
      root,
      configFile: false,
      logLevel: "silent",
      base: pluginRuntimeViteBase,
      worker: { format: "es" },
      build: {
        ...entryOptions,
        outDir: dist,
        minify: false,
        rollupOptions: {
          ...entryOptions.rollupOptions,
          output: { entryFileNames: "main.mjs" },
        },
      },
    });
    const html = `<!doctype html><script type="module">try{const {runWorker}=await import('/main.mjs');window.workerResult={answer:await runWorker()};}catch(error){window.workerResult={error:error.message};}</script>`;
    server = http.createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (pathname === "/") {
          response.setHeader("Content-Type", "text/html");
          response.end(html);
          return;
        }
        const file = path.resolve(dist, "." + pathname);
        if (!file.startsWith(dist + path.sep)) throw new Error("Unavailable");
        response.setHeader("Content-Type", "text/javascript");
        response.end(await readFile(file));
      } catch {
        response.writeHead(404);
        response.end();
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.workerResult);
    assert.deepEqual(await page.evaluate(() => window.workerResult), {
      answer: 42,
    });
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});

test("packed Markdown language service diagnoses through the archive worker", async () => {
  const local = new URL("../packages/markdown-lint/.local/", import.meta.url);
  await mkdir(local, { recursive: true });
  const root = await mkdtemp(new URL("packed-worker-", local).pathname);
  let browser, server;
  try {
    const entry = path.join(root, "entry.mjs");
    await writeFile(
      entry,
      `import {createMarkdownLanguageServiceProvider} from '@lapis-notes/language-service/markdown';
export async function runWorker(){const provider=createMarkdownLanguageServiceProvider();try{return await provider.provideDiagnostics({document:{uri:'vault:///Review.md',languageId:'markdown',version:1,text:'#Heading\\n'},globals:[]});}finally{provider.dispose();}}`,
    );
    const dist = path.join(root, "dist");
    const entryOptions = pluginRuntimeEntryBuildOptions(entry);
    await build({
      root,
      configFile: false,
      logLevel: "silent",
      base: pluginRuntimeViteBase,
      worker: { format: "es" },
      build: {
        ...entryOptions,
        outDir: dist,
        minify: false,
        rollupOptions: {
          ...entryOptions.rollupOptions,
          external: (specifier) => specifier.startsWith("@lapis-notes/api/"),
          output: { entryFileNames: "main.mjs" },
        },
      },
    });
    const workerClient = await readFile(
      new URL(
        "../node_modules/@lapis-notes/api/dist/language-service/worker-provider.js",
        import.meta.url,
      ),
    );
    const html = `<!doctype html><script type="importmap">{"imports":{"@lapis-notes/api/language-service/worker":"/host-worker.js"}}</script><script type="module">try{const {runWorker}=await import('/main.mjs');const diagnostics=await Promise.race([runWorker(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Worker diagnostics timed out')),5000))]);window.workerResult={diagnostics:diagnostics.map(({source,code})=>({source,code}))};}catch(error){window.workerResult={error:error.message};}</script>`;
    server = http.createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (pathname === "/") {
          response.setHeader("Content-Type", "text/html");
          response.end(html);
          return;
        }
        response.setHeader("Content-Type", "text/javascript");
        if (pathname === "/host-worker.js") {
          response.end(workerClient);
          return;
        }
        const file = path.resolve(dist, "." + pathname);
        if (!file.startsWith(dist + path.sep)) throw new Error("Unavailable");
        response.end(await readFile(file));
      } catch {
        response.writeHead(404);
        response.end();
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.workerResult);
    const result = await page.evaluate(() => window.workerResult);
    assert.ok(
      result.diagnostics?.some(
        (diagnostic) =>
          diagnostic.source === "markdownlint" && diagnostic.code === "MD018",
      ),
      JSON.stringify({ result, errors }),
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
