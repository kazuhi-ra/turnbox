import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h, computed } from "vue";
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

const btnStyle =
  "padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;background:#2c3e50;color:white;";

const TurnBoxDemo = defineComponent({
  props: {
    facePcs: { type: Number, default: 4 },
    axis: { type: String as () => "X" | "Y", default: "X" },
    direction: { type: String as () => "positive" | "negative", default: "positive" },
    type: { type: String as () => "real" | "repeat" | "skip", default: "real" },
    duration: { type: Number, default: 600 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 200 },
    even: { type: Number, default: 200 },
  },
  setup(props) {
    const options = computed<TurnBoxOptions>(() => ({
      facePcs: props.facePcs,
      axis: props.axis,
      direction: props.direction,
      type: props.type,
      duration: props.duration,
      width: props.width,
      height: props.height,
      even: props.even,
    }));

    const { containerRef, currentFace, goTo, next, prev } = useTurnBox(options.value);

    return { containerRef, currentFace, goTo, next, prev };
  },
  render() {
    const count = Math.min(this.facePcs, 4);
    const transitionStyle = `
      .turnBoxFace { backface-visibility: visible; }
      .turnBoxShow { opacity: 1 !important; }
      .turnBoxFace:not(.turnBoxShow) { opacity: 0; pointer-events: none; }
      .turnBoxFace.turnBoxTransition {
        transition: transform ${this.duration}ms ease;
      }
    `;

    return h("div", { style: "display:flex;flex-direction:column;align-items:center;gap:16px;padding:40px;" }, [
      h("style", transitionStyle),
      h(
        "div",
        {
          style: `width:${this.width}px;height:${this.height}px;perspective:1000px;position:relative;`,
        },
        [
          h(
            "div",
            {
              ref: "containerRef",
              style: `width:${this.width}px;height:${this.height}px;position:relative;transform-style:preserve-3d;`,
            },
            Array.from({ length: count }, (_, i) =>
              h("div", {
                key: faceLabels[i],
                style: `position:absolute;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;background:${faceColors[i]};border-radius:8px;box-sizing:border-box;`,
                innerHTML: faceLabels[i],
              }),
            ),
          ),
        ],
      ),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;justify-content:center;" }, [
        h("button", { style: btnStyle, type: "button", onClick: () => this.prev() }, "◀ Prev"),
        h("button", { style: btnStyle, type: "button", onClick: () => this.next() }, "Next ▶"),
        ...Array.from({ length: count }, (_, i) =>
          h(
            "button",
            {
              key: faceLabels[i],
              style: btnStyle,
              type: "button",
              onClick: () => this.goTo(i + 1),
            },
            `Go ${i + 1}`,
          ),
        ),
      ]),
      h("div", { style: "font-size:14px;color:#666;" }, `Current face: ${this.currentFace}`),
    ]);
  },
});

const meta: Meta<TurnBoxArgs> = {
  title: "TurnBox/Vue",
  render: (args) => ({
    components: { TurnBoxDemo },
    setup: () => ({ args }),
    template: `<TurnBoxDemo v-bind="args" />`,
  }),
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
