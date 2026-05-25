import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@kazuhi-ra/turnbox-core/internal", replacement: resolve(__dirname, "../core/src/internal.ts") },
      { find: "@kazuhi-ra/turnbox-core",           replacement: resolve(__dirname, "../core/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-dom",            replacement: resolve(__dirname, "../dom/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-vue",            replacement: resolve(__dirname, "./src/index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(__dirname, "../../tests/setup.ts")],
    include: ["tests/**/*.test.ts"],
  },
});
