import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";

const Alert = () => {
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

  const actionBtnStyle: React.CSSProperties = {
    width: 306,
    height: 50,
    border: "none",
    cursor: "pointer",
    fontSize: 17,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <TurnBox.Root
      faces={3}
      width={340}
      height={87}
      even={400}
      duration={450}
      type="repeat"
      onChange={setCurrent}
    >
      <TurnBox.Face
        style={{
          background: current === 1 ? "#315f95" : "#1e3a5b",
          color: "white",
        }}
      >
        <TurnBox.Button style={{ ...fullBtnStyle, background: "none", color: "white" }}>
          ALERT
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: current === 2 ? "#3566a0" : "#224167",
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
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          ⚠
        </div>
        <p
          style={{
            lineHeight: 1.6,
            textAlign: "left",
            padding: "10px 40px 0",
            fontSize: 17,
            wordBreak: "break-all",
            margin: 0,
            color: "white",
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua.
        </p>
        <TurnBox.Button style={{ ...actionBtnStyle, background: "#0583e0", color: "white", marginTop: 35 }}>
          OK
        </TurnBox.Button>
        <TurnBox.Button
          direction="prev"
          style={{ ...actionBtnStyle, background: "#23446a", color: "white", marginTop: 10 }}
        >
          CANCEL
        </TurnBox.Button>
      </TurnBox.Face>

      <TurnBox.Face
        style={{
          background: current === 3 ? "#315f95" : "#1e3a5b",
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
  title: "examples/alert",
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
      <Alert />
    </div>
  ),
};
