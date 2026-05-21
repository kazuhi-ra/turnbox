import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: [
      // subpath must come before the base package entry
      { find: "@turnbox/core/internal", replacement: resolve("./packages/core/src/internal.ts") },
      { find: "@turnbox/core", replacement: resolve("./packages/core/src/index.ts") },
      { find: "@turnbox/dom", replacement: resolve("./packages/dom/src/index.ts") },
      { find: "@turnbox/react", replacement: resolve("./packages/react/src/index.ts") },
      { find: "@turnbox/vue", replacement: resolve("./packages/vue/src/index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
