import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  optimizeDeps: {
    exclude: [
      "@lapis-notes/api",
      "@lapis-notes/language-service",
      "@lapismd/design-core",
    ],
    include: [
      "aria-query",
      "react",
      "react-dom",
      "react-dom/client",
      "@storybook/addon-a11y/preview",
      "@storybook/addon-themes",
      "@storybook/svelte-vite",
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
  ssr: { noExternal: ["aria-query"] },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // Sync is unfinished. Tagged stories stay in the catalog and are skipped.
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            tags: { skip: ["sync-unfinished"] },
          }),
        ],
        optimizeDeps: {
          exclude: [
            "@lapis-notes/api",
            "@lapis-notes/language-service",
            "@lapismd/design-core",
          ],
          include: [
            "aria-query",
            "react",
            "react-dom",
            "react-dom/client",
            "@storybook/addon-a11y/preview",
            "@storybook/addon-themes",
            "@storybook/svelte-vite",
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
        ssr: { noExternal: ["aria-query"] },
        test: {
          name: "storybook",
          setupFiles: ["./.storybook/vitest.setup.ts"],
          testTimeout: 120_000,
          browser: {
            api: { host: "127.0.0.1", port: 63422, strictPort: true },
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions: { channel: "chromium" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
