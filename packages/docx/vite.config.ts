import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@cw/shared": path.join(
        packageRoot,
        "vendor/wordcanvas/shared/src/index.ts",
      ),
    },
  },
  worker: { format: "es" },
  test: {
    server: { deps: { inline: [/@lapis-notes/, /@lapismd/] } },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
