import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";

const faceStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  fontSize: 22,
  fontWeight: "bold",
  color: "white",
  borderRadius: 12,
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 20px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  background: "rgba(255,255,255,0.25)",
  color: "white",
  fontWeight: "bold",
};

const FlipCard = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <TurnBox.Root faces={2} duration={400} width={200} height={200}>
      <TurnBox.Face style={{ ...faceStyle, background: "#3498db" }}>
        Front
        <TurnBox.Button style={btnStyle}>Flip</TurnBox.Button>
      </TurnBox.Face>
      <TurnBox.Face style={{ ...faceStyle, background: "#e74c3c" }}>
        Back
        <TurnBox.Button direction="prev" style={btnStyle}>Flip back</TurnBox.Button>
      </TurnBox.Face>
    </TurnBox.Root>
  </div>
);

const meta: Meta = {
  title: "README example / Flip Card",
  render: () => <FlipCard />,
};

export default meta;

export const Default: StoryObj = {};
