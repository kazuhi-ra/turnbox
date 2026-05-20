import type { Meta, StoryObj } from "@storybook/react";
import { useTurnBox } from "../src/index.js";
import type { TurnBoxOptions } from "../src/index.js";

type TurnBoxArgs = {
  facePcs: number;
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
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  background: "#2c3e50",
  color: "white",
};

const TurnBoxDemo = (args: TurnBoxArgs) => {
  const count = Math.min(args.facePcs, 4);
  const options: TurnBoxOptions = {
    facePcs: args.facePcs,
    axis: args.axis,
    direction: args.direction,
    type: args.type,
    duration: args.duration,
    width: args.width,
    height: args.height,
    even: args.even,
  };

  const { containerRef, currentFace, goTo, next, prev } = useTurnBox(options);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: 40,
      }}
    >
      <style>{`
        .turnBoxFace { backface-visibility: visible; }
        .turnBoxShow { opacity: 1 !important; }
        .turnBoxFace:not(.turnBoxShow) { opacity: 0; pointer-events: none; }
        .turnBoxFace.turnBoxTransition {
          transition: transform ${args.duration}ms ease;
        }
      `}</style>

      <div
        style={{ width: args.width, height: args.height, perspective: 1000, position: "relative" }}
      >
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          style={{
            width: args.width,
            height: args.height,
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div
              key={faceLabels[i]}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
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
          <button key={faceLabels[i]} style={btnStyle} type="button" onClick={() => goTo(i + 1)}>
            Go {i + 1}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 14, color: "#666" }}>Current face: {currentFace}</div>
    </div>
  );
};

const meta: Meta<TurnBoxArgs> = {
  title: "TurnBox/React",
  render: (args) => <TurnBoxDemo {...args} />,
  argTypes: {
    facePcs: { control: { type: "select" }, options: [2, 3, 4] },
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

const defaultArgs: TurnBoxArgs = {
  facePcs: 4,
  axis: "X",
  direction: "positive",
  type: "real",
  duration: 600,
  width: 200,
  height: 200,
  even: 200,
};

export const Default: StoryObj<TurnBoxArgs> = { args: defaultArgs };
export const AxisY: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, axis: "Y" } };
export const DirectionNegative: StoryObj<TurnBoxArgs> = {
  args: { ...defaultArgs, direction: "negative" },
};
export const TypeRepeat: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, type: "repeat" } };
export const TypeSkip: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, type: "skip" } };
export const TwoFace: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, facePcs: 2 } };
export const ThreeFace: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, facePcs: 3 } };
export const UnevenGeometry: StoryObj<TurnBoxArgs> = {
  name: "Uneven (even ≠ height)",
  args: { ...defaultArgs, height: 200, even: 120 },
};
export const FastAnimation: StoryObj<TurnBoxArgs> = { args: { ...defaultArgs, duration: 200 } };
