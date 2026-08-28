import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    server: { deps: { inline: [/@lapis-notes/, /@lapismd/] } },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
