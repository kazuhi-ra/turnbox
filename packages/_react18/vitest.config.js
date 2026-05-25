import { createVitestConfig, r } from "../../tests/create-vitest-config.js";

export default createVitestConfig(import.meta.url, [
  { find: /^react-dom\/(.+)$/, replacement: `${r(import.meta.url, "node_modules/react-dom")}/$1` },
  { find: "react-dom",          replacement: r(import.meta.url, "node_modules/react-dom") },
  { find: /^react\/(.+)$/,     replacement: `${r(import.meta.url, "node_modules/react")}/$1` },
  { find: "react",              replacement: r(import.meta.url, "node_modules/react") },
  { find: "@kazuhi-ra/turnbox-dom",   replacement: r(import.meta.url, "../dom/src/index.ts") },
  { find: "@kazuhi-ra/turnbox-react", replacement: r(import.meta.url, "../react/src/index.ts") },
]);
