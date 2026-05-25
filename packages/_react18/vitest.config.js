import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-dom\/(.+)$/, replacement: `${resolve(__dirname, "node_modules/react-dom")}/$1` },
      { find: "react-dom", replacement: resolve(__dirname, "node_modules/react-dom") },
      { find: /^react\/(.+)$/, replacement: `${resolve(__dirname, "node_modules/react")}/$1` },
      { find: "react", replacement: resolve(__dirname, "node_modules/react") },
      { find: "@kazuhi-ra/turnbox-core/internal", replacement: resolve(__dirname, "../core/src/internal.ts") },
      { find: "@kazuhi-ra/turnbox-core",           replacement: resolve(__dirname, "../core/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-dom",            replacement: resolve(__dirname, "../dom/src/index.ts") },
      { find: "@kazuhi-ra/turnbox-react",          replacement: resolve(__dirname, "../react/src/index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(__dirname, "../../tests/setup.ts")],
    include: ["tests/**/*.test.ts"],
  },
});
