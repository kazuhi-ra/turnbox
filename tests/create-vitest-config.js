import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const r = (importMetaUrl, ...paths) =>
  resolve(fileURLToPath(new URL(".", importMetaUrl)), ...paths);

export const createVitestConfig = (importMetaUrl, extraAliases = []) =>
  defineConfig({
    resolve: {
      alias: [
        { find: "@kazuhi-ra/turnbox-core/internal", replacement: r(importMetaUrl, "../core/src/internal.ts") },
        { find: "@kazuhi-ra/turnbox-core",           replacement: r(importMetaUrl, "../core/src/index.ts") },
        ...extraAliases,
      ],
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: [r(importMetaUrl, "../../tests/setup.ts")],
      include: ["tests/**/*.test.ts"],
    },
  });
