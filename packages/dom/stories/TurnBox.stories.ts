import type { StoryObj } from "@storybook/html";
import { createTurnBox } from "../src/index.js";

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

const createContainer = (args: TurnBoxArgs): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; flex-direction:column; align-items:center; gap:16px; padding:40px;";

  const scene = document.createElement("div");
  scene.style.cssText = `
    width: ${args.width}px;
    height: ${args.height}px;
    perspective: 1000px;
    position: relative;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    width: ${args.width}px;
    height: ${args.height}px;
    position: relative;
    transform-style: preserve-3d;
  `;

  const count = Math.min(args.facePcs, 4);
  for (let i = 0; i < count; i++) {
    const face = document.createElement("div");
    face.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      background: ${faceColors[i]};
      border-radius: 8px;
      box-sizing: border-box;
    `;
    face.textContent = faceLabels[i];
    box.appendChild(face);
  }

  scene.appendChild(box);
  wrapper.appendChild(scene);

  const style = document.createElement("style");
  style.textContent = `
    .turnBoxFace { backface-visibility: visible; }
    .turnBoxShow { opacity: 1 !important; }
    .turnBoxFace:not(.turnBoxShow) { opacity: 0; pointer-events: none; }
    .turnBoxFace.turnBoxTransition {
      transition: transform ${args.duration}ms ease;
    }
  `;
  document.head.appendChild(style);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; justify-content:center;";

  const btnStyle = `
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    background: #2c3e50;
    color: white;
  `;

  const instance = createTurnBox(box, {
    facePcs: args.facePcs,
    axis: args.axis,
    direction: args.direction,
    type: args.type,
    duration: args.duration,
    width: args.width,
    height: args.height,
    even: args.even,
  });

  const faceIndicator = document.createElement("div");
  faceIndicator.style.cssText = "font-size:14px; color:#666; margin-top:4px;";
  faceIndicator.textContent = `Current face: 1`;

  const refresh = (): void => {
    faceIndicator.textContent = `Current face: ${instance.getCurrentFace()}`;
  };

  const addBtn = (label: string, onClick: () => void): void => {
    const btn = document.createElement("button");
    btn.style.cssText = btnStyle;
    btn.textContent = label;
    btn.addEventListener("click", () => {
      onClick();
      setTimeout(refresh, args.duration + 100);
    });
    controls.appendChild(btn);
  };

  addBtn("◀ Prev", () => instance.prev());
  addBtn("Next ▶", () => instance.next());
  for (let i = 1; i <= count; i++) {
    addBtn(`Go ${i}`, () => instance.goTo(i));
  }

  wrapper.appendChild(controls);
  wrapper.appendChild(faceIndicator);

  return wrapper;
};

export default {
  title: "TurnBox",
  render: (args: TurnBoxArgs) => createContainer(args),
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

export const Default: StoryObj = {
  args: defaultArgs,
};

export const AxisY: StoryObj = {
  args: { ...defaultArgs, axis: "Y" },
};

export const DirectionNegative: StoryObj = {
  args: { ...defaultArgs, direction: "negative" },
};

export const TypeRepeat: StoryObj = {
  args: { ...defaultArgs, type: "repeat" },
};

export const TypeSkip: StoryObj = {
  args: { ...defaultArgs, type: "skip" },
};

export const TwoFace: StoryObj = {
  args: { ...defaultArgs, facePcs: 2 },
};

export const ThreeFace: StoryObj = {
  args: { ...defaultArgs, facePcs: 3 },
};

export const UnevenGeometry: StoryObj = {
  name: "Uneven (even ≠ height)",
  args: { ...defaultArgs, height: 200, even: 120 },
};

export const FastAnimation: StoryObj = {
  args: { ...defaultArgs, duration: 200 },
};
