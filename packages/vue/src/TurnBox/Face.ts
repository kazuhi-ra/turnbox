import { defineComponent, h, type PropType, type CSSProperties } from "vue";
import { calcFaceTransform } from "@kazuhi-ra/turnbox-core";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import { useTurnBoxContext } from "./context.js";
import type { AnimationPhase } from "./context.js";
import { toTransformString } from "./utils.js";

const hasTransition = (phase: AnimationPhase): boolean => phase.kind === "animating";

const faceDimStyle = (faceIndex: number, opts: NormalizedOptions): CSSProperties => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return { inset: "0" };
  const isEven = faceIndex % 2 === 0;
  if (geometry.axis === "X") {
    return { width: "100%", height: `${isEven ? geometry.even : geometry.length}px` };
  }
  return { width: `${isEven ? geometry.even : geometry.length}px`, height: "100%" };
};

export type FaceProps = {
  style?: CSSProperties;
  class?: string;
};

export const Face = defineComponent({
  name: "TurnBoxFace",
  inheritAttrs: false,
  props: {
    _faceIndex: { type: Number as PropType<number>, default: 0 },
  },
  setup(props, { slots, attrs }) {
    const { opts, displayFace, phase, shownFaces } = useTurnBoxContext();

    return () => {
      const faceIndex = props._faceIndex;
      const currentPhase = phase.value;
      const currentOpts = opts.value;

      const ft = calcFaceTransform(displayFace.value, faceIndex, currentOpts);
      const transformStr = toTransformString(ft);
      const isShown = shownFaces.value.has(faceIndex);

      const userStyle = (attrs.style ?? {}) as CSSProperties;

      const faceStyle: CSSProperties = {
        ...userStyle,
        position: "absolute",
        ...faceDimStyle(faceIndex, currentOpts),
        transform: transformStr,
        transformOrigin: ft?.transformOrigin ?? "center",
        zIndex: ft?.zIndex ?? 0,
        opacity: isShown ? 1 : 0,
        backfaceVisibility: "hidden",
        transition: hasTransition(currentPhase)
          ? `transform ${currentOpts.duration}ms ${currentOpts.easing} ${currentOpts.delay}ms`
          : undefined,
      };

      return h(
        "div",
        {
          ...attrs,
          "data-face-index": faceIndex,
          style: faceStyle,
          "aria-hidden": isShown ? undefined : true,
          inert: isShown ? undefined : true,
        },
        slots.default?.(),
      );
    };
  },
});
