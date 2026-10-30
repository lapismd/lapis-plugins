import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  test: {
    server: { deps: { inline: [/@lapis-notes/, /@lapismd/] } },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
