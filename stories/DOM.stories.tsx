import React, { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";
import type { TurnBoxInstance } from "@kazuhi-ra/turnbox-dom";

type Args = {
  faces: 2 | 3 | 4;
  axis: "X" | "Y";
  direction: "positive" | "negative";
  type: "real" | "repeat" | "skip";
  duration: number;
  width: number;
  height: number;
  even: number;
};

const faceColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];
const faceLabels = ["Face 1", "Face 2", "Face 3", "Face 4"];

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  background: "#2c3e50",
  color: "white",
};

const DomDemo = (args: Args) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<TurnBoxInstance | null>(null);
  const [currentFace, setCurrentFace] = useState(1);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    box.innerHTML = "";
    for (let i = 0; i < args.faces; i++) {
      const face = document.createElement("div");
      Object.assign(face.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        fontWeight: "bold",
        color: "white",
        background: faceColors[i],
        borderRadius: "8px",
        boxSizing: "border-box",
      });
      face.textContent = faceLabels[i];
      box.appendChild(face);
    }

    instanceRef.current = createTurnBox(box, {
      faces: args.faces,
      axis: args.axis,
      direction: args.direction,
      type: args.type,
      duration: args.duration,
      width: args.width,
      height: args.height,
      even: args.even,
      reduceAnimation: "never",
      onChange: setCurrentFace,
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 40 }}>
      <style>{`
        .turnBoxFace { backface-visibility: hidden; }
        .turnBoxFace:not(.turnBoxShow) { opacity: 0; pointer-events: none; }
        .turnBoxFace.turnBoxTransition { transition: transform ${args.duration}ms ease 50ms; }
      `}</style>
      <div style={{ width: args.width, height: args.height, perspective: 1000, position: "relative" }}>
        <div
          ref={boxRef}
          style={{ width: args.width, height: args.height, position: "relative", transformStyle: "preserve-3d" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={btnStyle} type="button" onClick={() => instanceRef.current?.prev()}>
          ◀ Prev
        </button>
        <button style={btnStyle} type="button" onClick={() => instanceRef.current?.next()}>
          Next ▶
        </button>
        {Array.from({ length: args.faces }, (_, i) => (
          <button key={i} style={btnStyle} type="button" onClick={() => instanceRef.current?.goTo(i + 1)}>
            Go {i + 1}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#888" }}>face {currentFace}</div>
    </div>
  );
};

const meta: Meta<Args> = {
  title: "packages/dom",
  render: (args) => <DomDemo key={JSON.stringify(args)} {...args} />,
  argTypes: {
    faces: { control: { type: "select" }, options: [2, 3, 4] },
    axis: { control: { type: "radio" }, options: ["X", "Y"] },
    direction: { control: { type: "radio" }, options: ["positive", "negative"] },
    type: { control: { type: "radio" }, options: ["real", "repeat", "skip"] },
    duration: { control: { type: "range", min: 100, max: 2000, step: 100 } },
    width: { control: { type: "range", min: 100, max: 400, step: 10 } },
    height: { control: { type: "range", min: 100, max: 400, step: 10 } },
    even: { control: { type: "range", min: 50, max: 400, step: 10 } },
  },
};

export default meta;

const defaultArgs: Args = {
  faces: 4,
  axis: "X",
  direction: "positive",
  type: "real",
  duration: 600,
  width: 200,
  height: 200,
  even: 200,
};

export const Default: StoryObj<Args> = { args: defaultArgs };
export const AxisY: StoryObj<Args> = { args: { ...defaultArgs, axis: "Y" } };
export const DirectionNegative: StoryObj<Args> = { args: { ...defaultArgs, direction: "negative" } };
export const TypeRepeat: StoryObj<Args> = { args: { ...defaultArgs, type: "repeat" } };
export const TypeSkip: StoryObj<Args> = { args: { ...defaultArgs, type: "skip" } };
export const TwoFace: StoryObj<Args> = { args: { ...defaultArgs, faces: 2 } };
export const ThreeFace: StoryObj<Args> = { args: { ...defaultArgs, faces: 3 } };
export const UnevenGeometry: StoryObj<Args> = {
  name: "Uneven (even ≠ height)",
  args: { ...defaultArgs, height: 200, even: 120 },
};
export const FastAnimation: StoryObj<Args> = { args: { ...defaultArgs, duration: 200 } };
