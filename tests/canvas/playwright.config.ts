import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  outputDir: "../../.release/ci-results/canvas-browser",
  use: {
    baseURL: "http://127.0.0.1:6097",
    browserName: "chromium",
    channel: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6097 --strictPort",
    cwd: "../..",
    url: "http://127.0.0.1:6097",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
