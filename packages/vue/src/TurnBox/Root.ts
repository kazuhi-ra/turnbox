import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  provide,
  h,
  onUnmounted,
  cloneVNode,
  nextTick,
  Fragment,
  type VNode,
  type PropType,
} from "vue";
import { normalizeOptions, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import {
  resolveTransition,
  FOCUSABLE,
  INITIAL_STATE,
  reducer,
  toPhase,
  buildGoStepAction,
  buildGoInstantAction,
} from "@kazuhi-ra/turnbox-core/internal";
import type { TurnBoxState, TurnBoxAction, PendingNav } from "@kazuhi-ra/turnbox-core/internal";
import { TurnBoxContextKey } from "./context.js";
import { Face } from "./Face.js";
import { injectTurnBoxConfig } from "./configContext.js";

const flattenVNodes = (nodes: VNode[]): VNode[] =>
  nodes.flatMap((node) =>
    node.type === Fragment && Array.isArray(node.children) ? flattenVNodes(node.children as VNode[]) : [node],
  );

const calcContainerDynStyle = (
  displayFace: number,
  phaseKind: "idle" | "animating",
  opts: NormalizedOptions,
): Record<string, string | undefined> => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return {};
  const isEven = displayFace % 2 === 0;
  const isAnimating = phaseKind === "animating";
  const transition = isAnimating
    ? `${geometry.axis === "X" ? "height" : "left"} ${opts.duration}ms ${opts.easing} ${opts.delay}ms`
    : undefined;
  return geometry.axis === "X"
    ? { height: `${isEven ? geometry.even : geometry.length}px`, transition }
    : { left: `${isEven ? (geometry.length - geometry.even) / 2 : 0}px`, transition };
};

export type TurnBoxRootHandle = {
  goTo(face: number, animation?: boolean): void;
  getCurrentFace(): number;
  isAnimating(): boolean;
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
    ariaLabel: { type: String },
  },
  setup(props, { slots, expose }) {
    const config = injectTurnBoxConfig();

    // ── State machine ─────────────────────────────────────────────────────────
    const machineState = shallowRef<TurnBoxState>(INITIAL_STATE);

    // Frame-1 display override for the 2-frame animation strategy.
    // When non-null, computed displayFace returns this value instead of machineState.displayFace.
    // Holds the "from" face during the single RAF gap so CSS transitions are applied before
    // the transform changes.
    const rafPendingFrom = shallowRef<number | null>(null);

    const dispatch = (action: TurnBoxAction): void => {
      machineState.value = reducer(machineState.value, action);
    };

    // Derived reactive values for context
    const displayFace = computed(() => rafPendingFrom.value ?? machineState.value.displayFace);
    const phase = computed(() => toPhase(machineState.value));
    const shownFaces = computed(() => machineState.value.shownFaces);

    const pendingTimers: ReturnType<typeof setTimeout>[] = [];
    let pendingRaf: number | null = null;

    const boxRef = ref<HTMLElement | null>(null);

    const cancelFaceAnimations = (): void => {
      const box = boxRef.value;
      if (!box) return;
      for (const el of box.querySelectorAll<HTMLElement>("[data-face-index]")) {
        for (const anim of el.getAnimations?.() ?? []) anim.cancel();
      }
    };

    const focusFace = (faceIndex: number): void => {
      const box = boxRef.value;
      if (!box) return;
      box
        .querySelector<HTMLElement>(`[data-face-index="${faceIndex}"]`)
        ?.querySelector<HTMLElement>(FOCUSABLE)
        ?.focus({ preventScroll: true });
    };

    const opts = computed(() => {
      const base = normalizeOptions({
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
      });
      const prefersReducedMotion =
        config.reduceAnimation !== "never" &&
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return { ...base, duration: 0, delay: 0 };
      }
      return base;
    });

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

    const abortAnimation = (): void => {
      for (const id of pendingTimers) clearTimeout(id);
      pendingTimers.length = 0;
      if (pendingRaf !== null) {
        cancelRaf(pendingRaf);
        pendingRaf = null;
      }
      // Do NOT cancel WAAPI here — the new animation's CSS transition uses the compositor
      // mid-value as before-change style for smooth reversal. Cancel only in completion timer.
      rafPendingFrom.value = null;
      const settleFace = machineState.value.displayFace;
      dispatch({ type: "ABORT", displayFace: settleFace });
    };

    const goTo = (rawTarget: number, animation = true, fromQueue = false) => {
      if (machineState.value.kind !== "idle") {
        const from = machineState.value.displayFace;
        const checkTransition = resolveTransition(from, rawTarget, opts.value, animation);
        if (checkTransition.kind === "noop") return;

        const isImmediate = !animation || checkTransition.to === machineState.value.from;

        if (!isImmediate) {
          dispatch({ type: "ENQUEUE", nav: { face: checkTransition.to, animation } });
          return;
        }

        abortAnimation();
        // abortAnimation resets state to idle; fall through to start new navigation
      }

      const from = machineState.value.displayFace;
      const transition = resolveTransition(from, rawTarget, opts.value, animation);
      if (transition.kind === "noop") return;

      const time = opts.value.duration + opts.value.delay;
      props.onChange?.(transition.to);

      const { to, doAnimate } = transition;

      const drainQueue = (settledFace: number, queue: PendingNav[]): void => {
        while (queue.length > 0) {
          // biome-ignore lint/style/noNonNullAssertion: shift() is safe inside while(length>0)
          const pending = queue.shift()!;
          const t = resolveTransition(settledFace, pending.face, opts.value, pending.animation);
          if (t.kind !== "noop") {
            goTo(pending.face, pending.animation, true);
            if (machineState.value.kind !== "idle" && queue.length > 0) {
              for (const item of queue) dispatch({ type: "ENQUEUE", nav: item });
              queue.length = 0;
            }
            return;
          }
        }
      };

      if (!doAnimate) {
        dispatch(buildGoInstantAction(to, from)); // → settling, shownFaces = {to}
        addTimeout(() => {
          const pendingQueue: PendingNav[] =
            machineState.value.kind === "settling" ? [...machineState.value.queue] : [];
          dispatch({ type: "SETTLE" });
          props.onAnimationEnd?.(to);
          focusFace(to);
          drainQueue(to, pendingQueue);
        }, time);
        return;
      }

      dispatch(buildGoStepAction(to, from)); // → animating, shownFaces = {from, to}
      // phase = "animating" is now derived from machineState → CSS transitions applied

      if (fromQueue) {
        // Queue-drained: "from" transforms are already painted. displayFace = to immediately.
        // rafPendingFrom NOT set → computed displayFace returns machineState.displayFace = to
        addTimeout(() => {
          cancelFaceAnimations();
          const pendingQueue: PendingNav[] =
            machineState.value.kind === "animating" ? [...machineState.value.queue] : [];
          dispatch({ type: "COMPLETE", displayFace: to });
          props.onAnimationEnd?.(to);
          nextTick(() => focusFace(to));
          drainQueue(to, pendingQueue);
        }, time);
        return;
      }

      // Frame 1: machineState.displayFace = to, but hold "from" transforms until rAF
      rafPendingFrom.value = from;

      pendingRaf = scheduleRaf(() => {
        pendingRaf = null;
        rafPendingFrom.value = null; // Frame 2: displayFace → to, CSS transition fires

        addTimeout(() => {
          cancelFaceAnimations();
          const pendingQueue: PendingNav[] =
            machineState.value.kind === "animating" ? [...machineState.value.queue] : [];
          dispatch({ type: "COMPLETE", displayFace: to });
          props.onAnimationEnd?.(to);
          nextTick(() => focusFace(to));
          drainQueue(to, pendingQueue);
        }, time);
      });
    };

    const resolveCurrentFace = (): number => machineState.value.displayFace;

    const next = () => goTo(resolveCurrentFace() + 1, true);
    const prev = () => goTo(resolveCurrentFace() - 1, true);

    provide(TurnBoxContextKey, {
      opts,
      displayFace,
      phase,
      shownFaces,
      goTo,
      next,
      prev,
    });

    expose({
      goTo,
      getCurrentFace: () => displayFace.value,
      isAnimating: () => machineState.value.kind !== "idle",
      next,
      prev,
    } satisfies TurnBoxRootHandle);

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
          // role="region" makes TurnBox a landmark for screen reader navigation (e.g. "R" key jump).
          // Only set when aria-label is provided — an unlabelled landmark is worse than no landmark.
          role: props.ariaLabel ? "region" : undefined,
          "aria-label": props.ariaLabel,
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
              ref: boxRef,
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
