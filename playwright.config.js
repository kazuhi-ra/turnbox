import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.visual.spec.js",
  use: {
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  snapshotPathTemplate:
    "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
});
