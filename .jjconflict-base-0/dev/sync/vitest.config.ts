import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["dev/sync/server-account.test.ts"] },
});
