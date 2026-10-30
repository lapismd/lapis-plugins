import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "sign-in.spec.ts",
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: "line",
  outputDir: "../../.local/sync-sign-in-acceptance",
  use: {
    headless: true,
    serviceWorkers: "block",
    viewport: { width: 1162, height: 988 },
  },
});
