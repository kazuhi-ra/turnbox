import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

const fullBtnStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const RadioGroup = () => {
  const ref0 = useRef<TurnBoxRootHandle>(null);
  const ref1 = useRef<TurnBoxRootHandle>(null);
  const ref2 = useRef<TurnBoxRootHandle>(null);
  const ref3 = useRef<TurnBoxRootHandle>(null);
  const refs = [ref0, ref1, ref2, ref3];

  useEffect(() => {
    ref0.current?.goTo(2);
  }, []);

  const handleChange = (index: number, face: number) => {
    if (face === 2) {
      refs.forEach((ref, i) => {
        if (i !== index) ref.current?.goTo(1);
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {refs.map((ref, i) => (
        <TurnBox.Root
          key={i}
          faces={2}
          width={150}
          height={52}
          duration={200}
          ref={ref}
          onChange={(face) => handleChange(i, face)}
        >
          <TurnBox.Face style={{ background: "#262626" }}>
            <TurnBox.Button style={{ ...fullBtnStyle, background: "none", color: "rgba(255,255,255,0.5)" }}>
              OFF
            </TurnBox.Button>
          </TurnBox.Face>
          <TurnBox.Face
            style={{
              background: "#0093b1",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ON
          </TurnBox.Face>
        </TurnBox.Root>
      ))}
    </div>
  );
};

const CheckGroup = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <TurnBox.Root key={i} faces={2} width={150} height={52} duration={200}>
          <TurnBox.Face style={{ background: "#262626" }}>
            <TurnBox.Button style={{ ...fullBtnStyle, background: "none", color: "rgba(255,255,255,0.5)" }}>
              OFF
            </TurnBox.Button>
          </TurnBox.Face>
          <TurnBox.Face style={{ background: "#0093b1" }}>
            <TurnBox.Button direction="prev" style={{ ...fullBtnStyle, background: "none", color: "white" }}>
              ON
            </TurnBox.Button>
          </TurnBox.Face>
        </TurnBox.Root>
      ))}
    </div>
  );
};

const RadioCheck = () => (
  <div
    style={{
      display: "flex",
      gap: 60,
      alignItems: "flex-start",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <h2 style={{ color: "white", fontWeight: 300, fontSize: 20, margin: 0 }}>RADIO</h2>
      <RadioGroup />
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <h2 style={{ color: "white", fontWeight: 300, fontSize: 20, margin: 0 }}>CHECK</h2>
      <CheckGroup />
    </div>
  </div>
);

const meta: Meta = {
  title: "examples/radio-check",
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
      <RadioCheck />
    </div>
  ),
};
