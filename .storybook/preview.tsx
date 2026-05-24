import React from "react";
import type { Preview } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";

const preview: Preview = {
  decorators: [
    (Story) => (
      <TurnBox.Provider reduceAnimation="never">
        <div style={{ background: "#3a3a3a", minHeight: "100vh" }}>
          <Story />
        </div>
      </TurnBox.Provider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    options: {
      storySort: {
        order: ["examples", "packages", "*"],
      },
    },
  },
};

export default preview;
