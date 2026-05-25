import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { allSuites } from "./runner.js";

const toSuiteName = (filename: string): string => {
  const base = filename.replace(/\.suite\.[jt]s$/, "");
  const camel = base.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return `${camel}Suite`;
};

describe("allSuites completeness", () => {
  const dir = resolve(import.meta.dirname, "suite");
  const suiteFiles = readdirSync(dir)
    .filter((f) => f.endsWith(".suite.ts") || f.endsWith(".suite.js"))
    .map(toSuiteName)
    .sort();

  const registered = Object.keys(allSuites).sort();

  it("every *.suite.ts file is registered in allSuites", () => {
    for (const name of suiteFiles) {
      expect(registered, `${name} is missing from allSuites`).toContain(name);
    }
  });

  it("allSuites has no entries without a corresponding *.suite.ts file", () => {
    for (const name of registered) {
      expect(suiteFiles, `${name} is in allSuites but has no *.suite.ts file`).toContain(name);
    }
  });
});
