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
const faceLabels = ["Face 1", "Face 2", "Face 3", "Face 4"];

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
  background: "rgba(0,0,0,0.45)",
  color: "white",
};

const faceStyle = (i: number): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: faceColors[i],
  color: "white",
  fontSize: 22,
  fontWeight: "bold",
  borderRadius: 8,
  boxSizing: "border-box",
});

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
      <TurnBox.Root {...options}>
        {Array.from({ length: count }, (_, i) => (
          <TurnBox.Face key={faceColors[i]} style={faceStyle(i)}>
            {faceLabels[i]}
            <div style={{ display: "flex", gap: 6 }}>
              {i > 0 && (
                <TurnBox.Button style={btnStyle} direction="prev">
                  ◀ Prev
                </TurnBox.Button>
              )}
              {i < count - 1 && <TurnBox.Button style={btnStyle}>Next ▶</TurnBox.Button>}
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

// TurnBox.Button の to={N} prop を使ったスキップ例
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
        <TurnBox.Root {...options}>
          {[0, 1, 2, 3].map((i) => (
            <TurnBox.Face key={faceColors[i]} style={faceStyle(i)}>
              {faceLabels[i]}
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4]
                  .filter((n) => n !== i + 1)
                  .map((n) => (
                    <TurnBox.Button key={n} style={btnStyle} to={n}>
                      to {n}
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
