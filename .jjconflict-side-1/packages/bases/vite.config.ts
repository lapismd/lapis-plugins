import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      {
        find: /^lucide-static\/tags\.json$/,
        replacement: path.resolve(packageDir, "test/lucide-tags.stub.ts"),
      },
    ],
  },
  test: {
    server: { deps: { inline: [/@lapis-notes/, /@lapismd/] } },
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
  },
});
