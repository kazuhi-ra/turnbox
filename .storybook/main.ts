import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const r = (p: string) => resolve(process.cwd(), p);

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  framework: { name: "@storybook/react-vite", options: {} },
  async viteFinal(config) {
    const aliases = [
      { find: "@turnbox/core/internal", replacement: r("packages/core/src/internal.ts") },
      { find: "@turnbox/core", replacement: r("packages/core/src/index.ts") },
      { find: "@turnbox/dom", replacement: r("packages/dom/src/index.ts") },
      { find: "@turnbox/react", replacement: r("packages/react/src/index.ts") },
      { find: "@turnbox/vue", replacement: r("packages/vue/src/index.ts") },
    ];
    config.resolve ??= {};
    config.resolve.alias = [
      ...aliases,
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
    ];
    return config;
  },
};

export default config;
