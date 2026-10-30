import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Sync is unfinished. The retained suite is reported skipped, not deleted.
    setupFiles: ["./src/sync-unfinished.setup.ts"],
  },
});
