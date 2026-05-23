import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@turnbox/react";

const Toggle = () => {
  const [current, setCurrent] = useState(1);

  const fullBtnStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <TurnBox.Root faces={2} width={340} height={87} onChange={setCurrent}>
      <TurnBox.Face
        style={{
          background: current === 1 ? "#2a2a2a" : "#101010",
          color: "white",
        }}
      >
        <TurnBox.Button style={{ ...fullBtnStyle, background: "none", color: "white" }}>
          OFF
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: current === 2 ? "#00adea" : "#0087b7",
          color: "white",
        }}
      >
        <TurnBox.Button direction="prev" style={{ ...fullBtnStyle, background: "none", color: "white" }}>
          ON
        </TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  );
};

const meta: Meta = {
  title: "examples/toggle",
  parameters: { controls: { disable: true } },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#3a3a3a",
      }}
    >
      <Toggle />
    </div>
  ),
};
