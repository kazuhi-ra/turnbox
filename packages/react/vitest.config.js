import { createVitestConfig, r } from "../../tests/create-vitest-config.js";

export default createVitestConfig(import.meta.url, [
  { find: "@kazuhi-ra/turnbox-dom",   replacement: r(import.meta.url, "../dom/src/index.ts") },
  { find: "@kazuhi-ra/turnbox-react", replacement: r(import.meta.url, "./src/index.ts") },
]);
