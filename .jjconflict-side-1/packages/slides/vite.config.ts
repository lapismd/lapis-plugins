import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
    alias: [
      {
        find: /^@lapis-notes\/markdown\/embed$/,
        replacement: path.resolve(
          packageDir,
          "test/markdown-embed.stub.ts",
        ),
      },
    ],
  },
  test: {
    server: { deps: { inline: [/@lapis-notes/, /@lapismd/] } },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
