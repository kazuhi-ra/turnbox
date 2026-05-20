import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@turnbox/core": resolve("./packages/core/src/index.ts"),
      "@turnbox/dom": resolve("./packages/dom/src/index.ts"),
      "@turnbox/react": resolve("./packages/react/src/index.ts"),
      "@turnbox/vue": resolve("./packages/vue/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
