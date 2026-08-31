import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, searchForWorkspaceRoot } from "vite";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(storybookDir, "..");

const packageAliases = [
  ["@lapis-notes/ai/runtimes", "packages/ai/src/lib/runtime-adapters.ts"],
  ["@lapis-notes/ai/styles.css", "packages/ai/src/lib/styles.css"],
  ["@lapis-notes/ai", "packages/ai/src/lib/index.ts"],
  ["@lapis-notes/bases/styles.css", "packages/bases/src/lib/styles.css"],
  ["@lapis-notes/bases", "packages/bases/src/lib/index.ts"],
  ["@lapis-notes/bookmarks/styles.css", "packages/bookmarks/src/lib/styles.css"],
  ["@lapis-notes/bookmarks", "packages/bookmarks/src/lib/index.ts"],
  ["@lapis-notes/graph/embed", "packages/graph/src/lib/embed.ts"],
  ["@lapis-notes/graph/styles.css", "packages/graph/src/lib/styles.css"],
  ["@lapis-notes/graph", "packages/graph/src/lib/index.ts"],
  ["@lapis-notes/history/styles.css", "packages/history/src/lib/styles.css"],
  ["@lapis-notes/history", "packages/history/src/lib/index.ts"],
  ["@lapis-notes/markdown/agent-tools", "packages/markdown/src/lib/agent-tools.ts"],
  ["@lapis-notes/markdown/embed", "packages/markdown/src/lib/embed.ts"],
  ["@lapis-notes/markdown/styles.css", "packages/markdown/src/lib/styles.css"],
  ["@lapis-notes/markdown", "packages/markdown/src/lib/index.ts"],
  ["@lapis-notes/markdown-lint/styles.css", "packages/markdown-lint/src/styles.css"],
  ["@lapis-notes/markdown-lint", "packages/markdown-lint/src/index.ts"],
  ["@lapis-notes/search/agent-tools", "packages/search/src/lib/agent-tools.ts"],
  ["@lapis-notes/search/styles.css", "packages/search/src/lib/styles.css"],
  ["@lapis-notes/search", "packages/search/src/lib/index.ts"],
  ["@lapis-notes/slides/styles.css", "packages/slides/src/lib/views/slides/slides.css"],
  ["@lapis-notes/slides", "packages/slides/src/lib/index.ts"],
  ["@lapis-notes/source-editor/styles.css", "packages/source-editor/src/styles.css"],
  ["@lapis-notes/source-editor", "packages/source-editor/src/index.ts"],
  ["@lapis-notes/spellcheck/styles.css", "packages/spellcheck/src/styles.css"],
  ["@lapis-notes/spellcheck", "packages/spellcheck/src/index.ts"],
  ["@lapis-notes/wordcount/styles.css", "packages/wordcount/src/styles.css"],
  ["@lapis-notes/wordcount", "packages/wordcount/src/index.ts"],
] as const;

const linkedPackages = [
  "@lapis-notes/api",
  "@lapis-notes/file-explorer",
  "@lapis-notes/language-service",
  "@lapis-notes/ui",
  "@lapis-notes/workspace",
  "@lapismd/design-core",
  "@lapismd/mira",
  "@lapismd/mira-editor",
] as const;
const linkedRoots = linkedPackages.flatMap((packageName) => {
  const candidate = path.join(repoRoot, "node_modules", packageName);
  return existsSync(candidate) ? [realpathSync(candidate)] : [];
});
const linkedWorkspaceRoots = [
  ...new Set(linkedRoots.map((root) => searchForWorkspaceRoot(root))),
];

const config: StorybookConfig = {
  stories: ["../stories/plugins/**/*.stories.@(js|ts|svelte)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
    {
      name: "@lapismd/storybook-addon-visual-delta",
      options: {
        visualDelta: {
          snapshotDir: ".visual-delta/artifacts",
          readOnly: true,
          affectedTests: false,
        },
      },
    },
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => {
    const plugins = (viteConfig.plugins ?? []).flat(Infinity);
    const nonSveltePlugins = plugins.filter(
      (plugin) =>
        !plugin?.name?.startsWith("vite-plugin-svelte") &&
        plugin?.name !== "sveltekit-autoimport-configuration",
    );
    viteConfig.plugins = [
      svelte({
        preprocess: vitePreprocess(),
        emitCss: false,
        compilerOptions: { runes: undefined },
      }),
      tailwindcss(),
      ...nonSveltePlugins,
    ];
    return mergeConfig(viteConfig, {
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
            find: /^harper\.js\/binaryInlined$/,
            replacement: path.join(
              repoRoot,
              "packages/spellcheck/node_modules/harper.js/dist/binaryInlined.js",
            ),
          },
          {
            find: /^harper\.js\/binary$/,
            replacement: path.join(storybookDir, "harper-binary.ts"),
          },
          ...packageAliases.map(([find, replacement]) => ({
            find: new RegExp(`^${find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
            replacement: path.join(repoRoot, replacement),
          })),
          {
            find: /^\$lib(?:\/(.*))?$/,
            replacement: `${path.join(repoRoot, "packages/markdown/src/lib")}/$1`,
          },
        ],
      },
      esbuild: { target: "esnext" },
      worker: {
        format: "es",
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
      optimizeDeps: {
        exclude: [
          "@storybook/svelte",
          "@lapis-notes/api",
          "@lapis-notes/language-service",
          "@lapismd/design-core",
        ],
        esbuildOptions: { target: "esnext" },
        include: [
          "aria-query",
          "react",
          "react-dom",
          "react-dom/client",
          "@storybook/addon-themes",
          "character-entities",
          "@codemirror/lint",
          "@lapis-notes/api > eventemitter3",
          "@lapismd/mira/**",
          "debug",
          "extend",
          "markdownlint",
          "markdownlint/sync",
        ],
      },
      server: {
        fs: {
          allow: [repoRoot, ...linkedRoots, ...linkedWorkspaceRoots],
        },
      },
    });
  },
};

export default config;
