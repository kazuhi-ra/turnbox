import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ["examples", "packages", "*"],
      },
    },
  },
};

export default preview;
