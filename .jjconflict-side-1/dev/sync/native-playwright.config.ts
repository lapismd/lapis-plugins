import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: "native-sign-in.spec.ts",
  outputDir: "../../.local/sync-native-account-acceptance",
  timeout: 180_000,
});
