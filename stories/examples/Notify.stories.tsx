import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@turnbox/react";

const Notify = () => {
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

  const okBtnStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: 75,
    left: 0,
    bottom: 0,
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    background: "#ea5f00",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <TurnBox.Root
      faces={3}
      width={340}
      height={87}
      even={320}
      duration={450}
      type="repeat"
      onChange={setCurrent}
    >
      <TurnBox.Face
        style={{
          background: current === 1 ? "#d6bc00" : "#897800",
          color: "white",
        }}
      >
        <TurnBox.Button style={{ ...fullBtnStyle, background: "none", color: "white" }}>
          NOTIFY
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: current === 2 ? "#e5c900" : "#998600",
          color: "white",
          position: "relative",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          ℹ
        </div>
        <p
          style={{
            lineHeight: 1.8,
            textAlign: "left",
            padding: "10px 40px 0",
            fontSize: 14,
            wordBreak: "break-all",
            margin: 0,
            color: "white",
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua.
        </p>
        <TurnBox.Button style={{ ...okBtnStyle }}>OK</TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: current === 3 ? "#d6bc00" : "#897800",
          color: "white",
        }}
      >
        <TurnBox.Button direction="prev" style={{ ...fullBtnStyle, background: "none", color: "white" }}>
          CONFIRMED
        </TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  );
};

const meta: Meta = {
  title: "examples/notify",
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
      <Notify />
    </div>
  ),
};
