import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(tsx|ts|js)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
