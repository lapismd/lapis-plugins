import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { build } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "@playwright/test";
import { scanBareImports } from "./lib/plugin-runtime-imports.mjs";
import * as renderer from "./lib/runtime-host-modules.mjs";

// A compiled archive must be able to call a host-owned Svelte component. This
// reproduces the Icon boundary in the real installed Bases file view.
test("compiled plugin renders a host component through one Svelte runtime", async () => {
  const localRoot = new URL("../.local/", import.meta.url);
  await mkdir(localRoot, { recursive: true });
  const root = await mkdtemp(new URL("renderer-sharing-", localRoot).pathname);
  let browser;
  let server;
  try {
    const version = renderer.rendererCompilerVersionFromLockfile(
      await readFile(new URL("../pnpm-lock.yaml", import.meta.url), "utf8"),
    );
    const modules = [
      "svelte",
      "svelte/internal/client",
      "svelte/internal/disclose-version",
      "svelte/internal/flags/legacy",
    ];
    await writeFile(
      path.join(root, "HostIcon.svelte"),
      '<script>let {label = "host icon"} = $props();</script>{#if label}<span data-host-icon>{label}</span>{/if}',
    );
    await writeFile(
      path.join(root, "Plugin.svelte"),
      '<script>import { HostIcon } from "@fixture/host";</script><HostIcon/>',
    );
    await writeFile(
      path.join(root, "host.mjs"),
      'export { default as HostIcon } from "./HostIcon.svelte"; export { mount } from "svelte";',
    );
    await writeFile(
      path.join(root, "plugin.mjs"),
      'export { default } from "./Plugin.svelte"; export { mount } from "svelte";',
    );
    const inputs = { host: path.join(root, "host.mjs") };
    const importMap = { "@fixture/host": "/host/host.mjs" };
    for (const [index, specifier] of modules.entries()) {
      const name = `renderer-${index}`;
      const file = path.join(root, `${name}.mjs`);
      await writeFile(file, `export * from ${JSON.stringify(specifier)};`);
      inputs[name] = file;
      const id = renderer.versionedRendererHostSpecifier(specifier, version);
      if (id) importMap[id] = `/host/${name}.mjs`;
    }
    const common = {
      root,
      configFile: false,
      logLevel: "silent",
      resolve: { dedupe: ["svelte"] },
    };
    await build({
      ...common,
      plugins: [svelte()],
      build: {
        outDir: path.join(root, "host"),
        minify: false,
        rollupOptions: {
          input: inputs,
          preserveEntrySignatures: "strict",
          output: {
            entryFileNames: "[name].mjs",
            chunkFileNames: "assets/[name]-[hash].mjs",
          },
        },
      },
    });
    const sharing = renderer.rendererHostExternalizationPlugin(version);
    await build({
      ...common,
      plugins: [sharing, svelte()],
      build: {
        outDir: path.join(root, "plugin"),
        minify: false,
        lib: {
          entry: path.join(root, "plugin.mjs"),
          formats: ["es"],
          fileName: () => "main.mjs",
        },
        rollupOptions: { external: ["@fixture/host"] },
      },
    });
    const emitted = await scanBareImports(
      await readFile(path.join(root, "plugin/main.mjs"), "utf8"),
    );
    assert.ok(
      emitted.includes(
        renderer.versionedRendererHostSpecifier("svelte", version),
      ),
      JSON.stringify(emitted),
    );
    const html = `<!doctype html><div id="root"></div><script type="importmap">${JSON.stringify({ imports: importMap })}</script><script type="module">import Plugin,{mount} from "/plugin/main.mjs";try{mount(Plugin,{target:document.getElementById("root")});window.rendererResult={text:document.getElementById("root").innerText};}catch(error){window.rendererResult={error:error.message};}</script>`;
    server = http.createServer(async (request, response) => {
      try {
        if (request.url === "/") {
          response.setHeader("Content-Type", "text/html");
          response.end(html);
          return;
        }
        const file = path.resolve(root, "." + request.url);
        if (!file.startsWith(root + path.sep)) throw new Error("Unavailable");
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
    await page.waitForFunction(() => window.rendererResult);
    assert.deepEqual(await page.evaluate(() => window.rendererResult), {
      text: "host icon",
    });
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
