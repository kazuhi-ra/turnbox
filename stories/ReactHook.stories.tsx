import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTurnBox, TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxOptions } from "@kazuhi-ra/turnbox-react";

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

const ReactHookDemo = (args: Args) => {
  const [currentFace, setCurrentFace] = useState(1);
  const count = args.faces;
  const options: TurnBoxOptions = {
    faces: count,
    axis: args.axis,
    direction: args.direction,
    type: args.type,
    duration: args.duration,
    width: args.width,
    height: args.height,
    even: args.even,
    onChange: setCurrentFace,
  };

  const { containerRef, goTo, next, prev } = useTurnBox(options);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 40 }}>
      <style>{`
        .turnBoxFace { backface-visibility: hidden; }
        .turnBoxFace:not(.turnBoxShow) { opacity: 0; pointer-events: none; }
        .turnBoxFace.turnBoxTransition { transition: transform ${args.duration}ms ease 50ms; }
      `}</style>
      <div style={{ width: args.width, height: args.height, perspective: 1000, position: "relative" }}>
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          style={{ width: args.width, height: args.height, position: "relative", transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div
              key={faceColors[i]}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: "bold",
                color: "white",
                background: faceColors[i],
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            >
              {faceLabels[i]}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={btnStyle} type="button" onClick={() => prev()}>
          ◀ Prev
        </button>
        <button style={btnStyle} type="button" onClick={() => next()}>
          Next ▶
        </button>
        {Array.from({ length: count }, (_, i) => (
          <button key={i} style={btnStyle} type="button" onClick={() => goTo(i + 1)}>
            Go {i + 1}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#888" }}>face {currentFace}</div>
    </div>
  );
};

const meta: Meta<Args> = {
  title: "packages/react",
  render: (args) => (
    <TurnBox.Provider reduceAnimation="never">
      <ReactHookDemo key={args.faces} {...args} />
    </TurnBox.Provider>
  ),
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
