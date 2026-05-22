import type { Meta, StoryObj } from "@storybook/react";
import { TurnBox } from "../src/index.js";
import type { TurnBoxOptions } from "../src/index.js";

type TurnBoxArgs = {
  facePcs: 2 | 3 | 4;
  axis: "X" | "Y";
  direction: "positive" | "negative";
  type: "real" | "repeat" | "skip";
  duration: number;
  width: number;
  height: number;
  even: number;
};

const faceColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
  background: "rgba(0,0,0,0.55)",
  color: "white",
};

const TurnBoxComponentDemo = (args: TurnBoxArgs) => {
  const count = Math.min(args.facePcs, 4) as 2 | 3 | 4;
  const options: TurnBoxOptions = {
    facePcs: count,
    axis: args.axis,
    direction: args.direction,
    type: args.type,
    duration: args.duration,
    width: args.width,
    height: args.height,
    even: args.even,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: 40,
      }}
    >
      <TurnBox.Root options={options}>
        {Array.from({ length: count }, (_, i) => (
          <TurnBox.Face
            key={faceColors[i]}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: faceColors[i],
              borderRadius: 8,
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              boxSizing: "border-box",
            }}
          >
            Face {i + 1}
            <div style={{ display: "flex", gap: 6 }}>
              {i > 0 && (
                <TurnBox.Button style={btnStyle} direction="prev">
                  ◀
                </TurnBox.Button>
              )}
              {i < count - 1 && <TurnBox.Button style={btnStyle}>▶</TurnBox.Button>}
            </div>
          </TurnBox.Face>
        ))}
      </TurnBox.Root>
    </div>
  );
};

const meta: Meta<TurnBoxArgs> = {
  title: "TurnBox/React Component",
  render: (args) => <TurnBoxComponentDemo {...args} />,
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

// Shows the "to" prop — skip to arbitrary face
export const SkipButtons: StoryObj<TurnBoxArgs> = {
  name: "Skip Buttons (to=N)",
  args: { ...defaultArgs, type: "skip" },
  render: (args) => {
    const options: TurnBoxOptions = {
      facePcs: 4,
      axis: args.axis,
      direction: args.direction,
      type: "skip",
      duration: args.duration,
      width: args.width,
      height: args.height,
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
        <TurnBox.Root options={options}>
          {[0, 1, 2, 3].map((i) => (
            <TurnBox.Face
              key={faceColors[i]}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: faceColors[i],
                borderRadius: 8,
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                boxSizing: "border-box",
              }}
            >
              Face {i + 1}
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4]
                  .filter((n) => n !== i + 1)
                  .map((n) => (
                    <TurnBox.Button key={n} style={btnStyle} to={n}>
                      {n}
                    </TurnBox.Button>
                  ))}
              </div>
            </TurnBox.Face>
          ))}
        </TurnBox.Root>
      </div>
    );
  },
};
