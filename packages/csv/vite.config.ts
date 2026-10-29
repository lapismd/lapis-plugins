import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    dedupe: [
      "@codemirror/language",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/common",
      "@lezer/highlight",
    ],
  },
  test: {
    setupFiles: ["./test-setup.ts"],
    server: {
      deps: {
        inline: [/@lapis-notes/, /@lapismd/],
        // Keep one CodeMirror instance with the editor shell. Inlining these
        // copies their facets and drops the CSV language classes.
        external: [/^@codemirror\//, /^@lezer\//],
      },
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
