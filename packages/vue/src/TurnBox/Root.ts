import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  watch,
  provide,
  h,
  onUnmounted,
  cloneVNode,
  Fragment,
  type VNode,
  type PropType,
} from "vue";
import { normalizeOptions, calcFaceTransform, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@turnbox/core";
import type { NormalizedOptions } from "@turnbox/core";
import { calcPrePositionTransform, resolveTransition, VIRTUAL_NEXT_WRAP } from "@turnbox/core/internal";
import { TurnBoxContextKey } from "./context.js";
import { toTransformString } from "./utils.js";
import type { AnimationPhase } from "./context.js";
import { Face } from "./Face.js";

const EMPTY_MAP: ReadonlyMap<number, string> = new Map();

const flattenVNodes = (nodes: VNode[]): VNode[] =>
  nodes.flatMap((node) =>
    node.type === Fragment && Array.isArray(node.children) ? flattenVNodes(node.children as VNode[]) : [node],
  );

const calcContainerDynStyle = (
  displayFace: number,
  phaseKind: AnimationPhase["kind"],
  opts: NormalizedOptions,
): Record<string, string | undefined> => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return {};
  const isEven = displayFace % 2 === 0;
  const isAnimating = phaseKind === "animating" || phaseKind === "adjust-animating";
  const transition = isAnimating
    ? `${geometry.axis === "X" ? "height" : "left"} ${opts.duration}ms ${opts.easing} ${opts.delay}ms`
    : undefined;
  return geometry.axis === "X"
    ? { height: `${isEven ? geometry.even : geometry.length}px`, transition }
    : { left: `${isEven ? (geometry.length - geometry.even) / 2 : 0}px`, transition };
};

export type TurnBoxRootHandle = {
  goTo(rawTarget: number, animation?: boolean): void;
  getCurrentFace(): number;
  next(): void;
  prev(): void;
};

export const Root = defineComponent({
  name: "TurnBoxRoot",
  props: {
    faces: { type: Number as PropType<2 | 3 | 4>, required: true as const },
    axis: { type: String as PropType<"X" | "Y"> },
    direction: { type: String as PropType<"positive" | "negative"> },
    type: { type: String as PropType<"real" | "repeat" | "skip"> },
    duration: { type: Number },
    delay: { type: Number },
    easing: { type: String },
    perspective: { type: Number },
    width: { type: Number },
    height: { type: Number },
    even: { type: Number },
    onChange: { type: Function as PropType<(face: number) => void> },
    onAnimationEnd: { type: Function as PropType<(face: number) => void> },
  },
  setup(props, { slots, expose }) {
    const displayFace = ref(1);
    const phase = shallowRef<AnimationPhase>({ kind: "idle" });
    const shownFaces = shallowRef<ReadonlySet<number>>(new Set([1]));
    const faceOverrides = shallowRef<ReadonlyMap<number, string>>(EMPTY_MAP);
    const isAnimatingFlag = ref(false);
    const pendingTimers: ReturnType<typeof setTimeout>[] = [];
    let pendingRaf: number | null = null;

    const opts = computed(() =>
      normalizeOptions({
        faces: props.faces,
        axis: props.axis,
        direction: props.direction,
        type: props.type,
        duration: props.duration,
        delay: props.delay,
        easing: props.easing,
        perspective: props.perspective,
        width: props.width,
        height: props.height,
        even: props.even,
      }),
    );

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      pendingTimers.push(id);
    };

    const scheduleRaf =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : (fn: FrameRequestCallback) => setTimeout(fn, 0) as unknown as number;
    const cancelRaf = typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : clearTimeout;

    onUnmounted(() => {
      for (const id of pendingTimers) clearTimeout(id);
      if (pendingRaf !== null) cancelRaf(pendingRaf);
    });

    watch(
      phase,
      (newPhase) => {
        if (newPhase.kind === "pre-positioning") {
          const { via, landAt } = newPhase;
          const restingTransform = toTransformString(calcFaceTransform(landAt, landAt, opts.value));

          pendingRaf = scheduleRaf(() => {
            pendingRaf = null;
            displayFace.value = via;
            phase.value = { kind: "animating" };
            shownFaces.value = new Set([...shownFaces.value, landAt]);
            faceOverrides.value = new Map([[landAt, restingTransform]]);

            addTimeout(() => {
              phase.value = { kind: "idle" };
              displayFace.value = landAt;
              shownFaces.value = new Set([landAt]);
              faceOverrides.value = EMPTY_MAP;
              isAnimatingFlag.value = false;
              props.onAnimationEnd?.(landAt);
            }, opts.value.duration + opts.value.delay);
          });
        } else if (newPhase.kind === "adjusting") {
          const { to } = newPhase;
          phase.value = { kind: "adjust-animating" }; // Frame 1: transition CSS を付与

          pendingRaf = scheduleRaf(() => {
            // Frame 2: transform を変更
            pendingRaf = null;
            displayFace.value = to;

            addTimeout(() => {
              phase.value = { kind: "idle" };
              shownFaces.value = new Set([to]);
              faceOverrides.value = EMPTY_MAP;
              isAnimatingFlag.value = false;
              props.onAnimationEnd?.(to);
            }, opts.value.duration + opts.value.delay);
          });
        }
      },
      { flush: "post" },
    );

    const goTo = (rawTarget: number, animation = true) => {
      if (isAnimatingFlag.value) return;

      const transition = resolveTransition(displayFace.value, rawTarget, opts.value, animation);
      if (transition.kind === "noop") return;

      isAnimatingFlag.value = true;
      const time = opts.value.duration + opts.value.delay;
      const targetFace = transition.kind === "virtual-wrap" ? transition.landAt : transition.to;
      props.onChange?.(targetFace);

      if (transition.kind === "virtual-wrap") {
        if (!transition.doAnimate) {
          displayFace.value = transition.landAt;
          phase.value = { kind: "idle" };
          shownFaces.value = new Set([transition.landAt]);
          faceOverrides.value = EMPTY_MAP;
          addTimeout(() => {
            isAnimatingFlag.value = false;
            props.onAnimationEnd?.(transition.landAt);
          }, time);
          return;
        }

        const incoming = transition.via === VIRTUAL_NEXT_WRAP ? 1 : 4;
        const currentFace = displayFace.value;
        shownFaces.value = new Set([currentFace, incoming]);
        faceOverrides.value = new Map([[incoming, calcPrePositionTransform(transition.via, opts.value)]]);
        phase.value = { kind: "pre-positioning", via: transition.via, landAt: transition.landAt };
        return;
      }

      if (transition.kind === "step" && transition.hasAdjust) {
        if (!transition.doAnimate) {
          displayFace.value = transition.to;
          phase.value = { kind: "idle" };
          shownFaces.value = new Set([transition.to]);
          faceOverrides.value = EMPTY_MAP;
          addTimeout(() => {
            isAnimatingFlag.value = false;
            props.onAnimationEnd?.(transition.to);
          }, time);
          return;
        }

        const currentFace = displayFace.value;
        shownFaces.value = new Set([currentFace, transition.to]);
        faceOverrides.value = EMPTY_MAP;
        phase.value = { kind: "adjusting", to: transition.to };
        return;
      }

      const { to, doAnimate } = transition;

      if (!doAnimate) {
        displayFace.value = to;
        phase.value = { kind: "idle" };
        shownFaces.value = new Set([to]);
        faceOverrides.value = EMPTY_MAP;
        addTimeout(() => {
          isAnimatingFlag.value = false;
          props.onAnimationEnd?.(to);
        }, time);
        return;
      }

      const currentFace = displayFace.value;
      shownFaces.value = new Set([currentFace, to]);
      faceOverrides.value = EMPTY_MAP;
      phase.value = { kind: "animating" }; // Frame 1: transition CSS を付与

      pendingRaf = scheduleRaf(() => {
        // Frame 2: transform を変更
        pendingRaf = null;
        displayFace.value = to;

        addTimeout(() => {
          phase.value = { kind: "idle" };
          shownFaces.value = new Set([to]);
          isAnimatingFlag.value = false;
          props.onAnimationEnd?.(to);
        }, time);
      });
    };

    const next = () => goTo(displayFace.value + 1, true);
    const prev = () => goTo(displayFace.value - 1, true);

    provide(TurnBoxContextKey, {
      opts,
      displayFace,
      phase,
      shownFaces,
      faceOverrides,
      goTo,
      next,
      prev,
    });

    expose({ goTo, getCurrentFace: () => displayFace.value, next, prev } satisfies TurnBoxRootHandle);

    return () => {
      const boxWidth = props.width ?? DEFAULT_SIZE;
      const boxHeight = props.height ?? DEFAULT_HEIGHT;

      const children = flattenVNodes(slots.default?.() ?? []);
      let faceCount = 0;
      const indexedChildren = children.flatMap((child) => {
        if (child.type === Face) {
          faceCount++;
          if (faceCount > opts.value.faces) return [];
          return [cloneVNode(child, { _faceIndex: faceCount })];
        }
        return [child];
      });

      const containerDynStyle = calcContainerDynStyle(displayFace.value, phase.value.kind, opts.value);

      return h(
        "div",
        {
          style: {
            perspective: `${opts.value.perspective}px`,
            width: `${boxWidth}px`,
            height: `${boxHeight}px`,
            position: "relative",
          },
        },
        [
          h(
            "div",
            {
              "data-turnbox-box": "",
              style: {
                width: `${boxWidth}px`,
                position: "absolute",
                top: 0,
                bottom: 0,
                transformStyle: "preserve-3d",
                ...containerDynStyle,
              },
            },
            indexedChildren,
          ),
        ],
      );
    };
  },
});
