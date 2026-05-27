import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { createApp, defineComponent, ref, h } from "vue";
import { TurnBox as VueTurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";

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

const btnCss =
  "padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;background:#2c3e50;color:white;";

const faceStyle = (i: number) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: faceColors[i],
  color: "white",
  fontSize: "22px",
  fontWeight: "bold",
  borderRadius: "8px",
  boxSizing: "border-box" as const,
});

const VueTurnBoxComponentDemo = defineComponent({
  props: {
    faces: { type: Number, default: 4 },
    axis: { type: String, default: "X" },
    direction: { type: String, default: "positive" },
    type: { type: String, default: "real" },
    duration: { type: Number, default: 600 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 200 },
    even: { type: Number },
  },
  setup() {
    const turnboxRef = ref<TurnBoxRootHandle | null>(null);
    const currentFace = ref(1);
    return { turnboxRef, currentFace };
  },
  render() {
    const count = Math.min(this.faces as number, 4);

    return h("div", { style: "display:flex;flex-direction:column;align-items:center;gap:20px;padding:40px;" }, [
      h(
        VueTurnBox.Root,
        {
          ref: "turnboxRef",
          faces: count,
          axis: this.axis,
          direction: this.direction,
          type: this.type,
          duration: this.duration,
          width: this.width,
          height: this.height,
          even: this.even,
          onChange: (face: number) => {
            this.currentFace = face;
          },
        },
        () =>
          Array.from({ length: count }, (_, i) =>
            h(VueTurnBox.Face, { key: faceColors[i], style: faceStyle(i) }, () => faceLabels[i]),
          ),
      ),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;justify-content:center;" }, [
        h(
          "button",
          { style: btnCss, type: "button", onClick: () => (this.$refs.turnboxRef as TurnBoxRootHandle)?.prev() },
          "◀ Prev",
        ),
        h(
          "button",
          { style: btnCss, type: "button", onClick: () => (this.$refs.turnboxRef as TurnBoxRootHandle)?.next() },
          "Next ▶",
        ),
        ...Array.from({ length: count }, (_, i) =>
          h(
            "button",
            {
              key: i,
              style: btnCss,
              type: "button",
              onClick: () => (this.$refs.turnboxRef as TurnBoxRootHandle)?.goTo(i + 1),
            },
            `Go ${i + 1}`,
          ),
        ),
      ]),
      h("div", { style: "font-size:13px;color:#888;" }, `face ${this.currentFace}`),
    ]);
  },
});

const VueComponentWrapper = ({ args }: { args: Args }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const Root = defineComponent({
      render: () =>
        h(VueTurnBox.Provider, { reduceAnimation: "never" }, () => h(VueTurnBoxComponentDemo, args)),
    });
    const app = createApp(Root);
    app.mount(el);
    return () => app.unmount();
  }, []);

  return <div ref={mountRef} />;
};

const meta: Meta<Args> = {
  title: "packages/vue-component",
  render: (args) => <VueComponentWrapper key={JSON.stringify(args)} args={args} />,
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
