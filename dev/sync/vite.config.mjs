import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { tursoBundleBuildPlugin } from "@lapis-notes/api/build/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const destination = new URL(
  process.env.VITE_SYNC_REVIEW_SERVER_URL ?? "http://localhost:8797",
);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(destination.hostname) ||
  destination.username ||
  destination.password ||
  destination.pathname !== "/" ||
  destination.search ||
  destination.hash
)
  throw new Error(
    "The private review proxy requires a literal loopback server origin.",
  );
const proxyTarget = new URL(destination);
if (proxyTarget.hostname === "localhost") proxyTarget.hostname = "127.0.0.1";
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: path.join(root, ".local/sync-review-vite"),
  plugins: [
    tursoBundleBuildPlugin(),
    svelte({ preprocess: vitePreprocess(), emitCss: false }),
    tailwindcss(),
  ],
  resolve: {
    dedupe: [
      "svelte",
      "@lapis-notes/api",
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/language",
      "@lezer/common",
    ],
    alias: [
      {
        find: /^@lapis-notes\/lapis-plugin-sync\/styles\.css$/,
        replacement: path.join(root, "packages/sync/dist/styles.css"),
      },
      ...[
        ["lapis-plugin-sync", "sync"],
        ["source-editor", "source-editor"],
        ["markdown", "markdown"],
      ].flatMap(([name, folder]) => [
        {
          find: new RegExp(`^@lapis-notes/${name}$`),
          replacement: path.join(root, `packages/${folder}/dist/index.js`),
        },
        {
          find: new RegExp(`^@lapis-notes/${name}/manifest\\.json$`),
          replacement: path.join(root, `packages/${folder}/manifest.json`),
        },
      ]),
    ],
  },
  optimizeDeps: {
    exclude: [
      "@lapis-notes/api",
      "@lapismd/design-core",
      "@lapis-notes/lapis-plugin-sync",
      "@lapis-notes/source-editor",
      "@lapis-notes/markdown",
    ],
    include: [
      "aria-query",
      "@lapis-notes/api > eventemitter3",
      "@lapismd/mira/**",
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/lang-json",
      "@codemirror/lang-yaml",
      "@lezer/common",
      "debug",
      "extend",
      "character-entities",
      "markdownlint",
      "markdownlint/sync",
    ],
    esbuildOptions: { target: "esnext" },
  },
  worker: { plugins: () => [tursoBundleBuildPlugin()], format: "es" },
  server: {
    host: "localhost",
    port: 6080,
    strictPort: true,
    fs: { allow: [root] },
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    proxy: { "/api": { target: proxyTarget.origin } },
  },
});
