import config from "../../vite.config";

export default {
  ...config,
  test: {
    ...config.test,
    include: ["test/compatibility/*.test.ts"],
    setupFiles: ["test/compatibility/setup.ts"],
  },
};
