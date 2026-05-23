import type { Meta, StoryObj } from "@storybook/react";
import React, { useRef } from "react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

const faceColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];
const faceLabels = ["Face 1", "Face 2", "Face 3", "Face 4"];

const Simple = () => {
  const ref = useRef<TurnBoxRootHandle>(null);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <div style={{ cursor: "pointer" }} onClick={() => ref.current?.next()}>
        <TurnBox.Root faces={4} axis="Y" width={200} height={200} duration={600} ref={ref}>
          {faceColors.map((color, i) => (
            <TurnBox.Face
              key={color}
              style={{
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: "bold",
                color: "white",
                borderRadius: 8,
              }}
            >
              {faceLabels[i]}
            </TurnBox.Face>
          ))}
        </TurnBox.Root>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: "packages/simple",
  parameters: { controls: { disable: true } },
};

export default meta;

export const Default: StoryObj = {
  render: () => <Simple />,
};
