import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ["examples", "*"],
      },
    },
  },
};

export default preview;
