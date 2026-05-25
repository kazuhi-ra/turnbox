import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: [
      // subpath must come before the base package entry
      { find: "@kazuhi-ra/turnbox-core/internal", replacement: resolve("./packages/core/src/internal.ts") },
      { find: "@kazuhi-ra/turnbox-core", replacement: resolve("./packages/core/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-dom", replacement: resolve("./packages/dom/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-react", replacement: resolve("./packages/react/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-vue", replacement: resolve("./packages/vue/src/index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["packages/**/*.test.ts"],
    exclude: ["packages/_react18/**"],
  },
});
