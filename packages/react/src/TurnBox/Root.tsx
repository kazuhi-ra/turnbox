import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { normalizeOptions, calcFaceTransform } from "@turnbox/core";
import type { TurnBoxOptions, NormalizedOptions } from "@turnbox/core";
import { resolveTransition, VIRTUAL_NEXT_WRAP } from "@turnbox/core/internal";
import { TurnBoxContext } from "./context.js";
import type { AnimationPhase } from "./context.js";
import { toTransformString } from "./utils.js";
import { Face } from "./Face.js";

// ─── State machine ────────────────────────────────────────────────────────────

type IdleState = {
  kind: "idle";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

type PrePositioningState = {
  kind: "pre-positioning";
  displayFace: number;
  via: 0 | 5;
  landAt: 1 | 4;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

type AnimatingState = {
  kind: "animating";
  displayFace: number;
  landAt: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

type AdjustingState = {
  kind: "adjusting";
  displayFace: number;
  to: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

type AdjustAnimatingState = {
  kind: "adjust-animating";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

type TurnBoxState =
  | IdleState
  | PrePositioningState
  | AnimatingState
  | AdjustingState
  | AdjustAnimatingState;

// ─── Actions ──────────────────────────────────────────────────────────────────

type TurnBoxAction =
  | { type: "GO_STEP"; to: number; shownFaces: ReadonlySet<number> }
  | { type: "GO_INSTANT"; displayFace: number }
  | {
      type: "GO_PRE_POSITIONING";
      displayFace: number;
      via: 0 | 5;
      landAt: 1 | 4;
      faceOverrides: ReadonlyMap<number, string>;
      shownFaces: ReadonlySet<number>;
    }
  | { type: "GO_ADJUSTING"; to: number; shownFaces: ReadonlySet<number> }
  | {
      type: "ENTER_ANIMATING";
      displayFace: number;
      landAt: number;
      shownFaces: ReadonlySet<number>;
      faceOverrides: ReadonlyMap<number, string>;
    }
  | { type: "ENTER_ADJUST_ANIMATING"; displayFace: number }
  | { type: "COMPLETE"; displayFace: number };

// ─── Reducer (pure) ───────────────────────────────────────────────────────────

const EMPTY_MAP: ReadonlyMap<number, string> = new Map();

const reducer = (state: TurnBoxState, action: TurnBoxAction): TurnBoxState => {
  switch (action.type) {
    case "GO_STEP":
      return {
        kind: "animating",
        displayFace: action.to,
        landAt: action.to,
        shownFaces: action.shownFaces,
        faceOverrides: EMPTY_MAP,
      };
    case "GO_INSTANT":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
        faceOverrides: EMPTY_MAP,
      };
    case "GO_PRE_POSITIONING":
      return {
        kind: "pre-positioning",
        displayFace: action.displayFace,
        via: action.via,
        landAt: action.landAt,
        shownFaces: action.shownFaces,
        faceOverrides: action.faceOverrides,
      };
    case "GO_ADJUSTING":
      return {
        kind: "adjusting",
        displayFace: state.displayFace,
        to: action.to,
        shownFaces: action.shownFaces,
        faceOverrides: EMPTY_MAP,
      };
    case "ENTER_ANIMATING":
      return {
        kind: "animating",
        displayFace: action.displayFace,
        landAt: action.landAt,
        shownFaces: action.shownFaces,
        faceOverrides: action.faceOverrides,
      };
    case "ENTER_ADJUST_ANIMATING":
      return {
        kind: "adjust-animating",
        displayFace: action.displayFace,
        shownFaces: state.shownFaces,
        faceOverrides: state.faceOverrides,
      };
    case "COMPLETE":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
        faceOverrides: EMPTY_MAP,
      };
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toPhase = (state: TurnBoxState): AnimationPhase => {
  switch (state.kind) {
    case "idle":
      return { kind: "idle" };
    case "pre-positioning":
      return { kind: "pre-positioning", via: state.via, landAt: state.landAt };
    case "animating":
      return { kind: "animating" };
    case "adjusting":
      return { kind: "adjusting", to: state.to };
    case "adjust-animating":
      return { kind: "adjust-animating" };
  }
};

const calcPrePositionTransform = (via: 0 | 5, opts: NormalizedOptions): string => {
  const { geometry, direction } = opts;
  const dirSign = direction === "negative" ? -1 : 1;
  const shortDeg = (via === VIRTUAL_NEXT_WRAP ? 90 : -90) * dirSign;
  const half = geometry.length / 2;
  const changeHalf = shortDeg < 0 ? -half : half;
  const [x, y, z]: [number, number, number] =
    geometry.axis === "Y" ? [changeHalf, 0, half] : [0, -changeHalf, half];
  return `rotate${geometry.axis}(${shortDeg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
};

// ─── Component ────────────────────────────────────────────────────────────────

type RootProps = {
  options: TurnBoxOptions;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type TurnBoxRootHandle = {
  go(rawTarget: number, animation: boolean): void;
  getCurrentFace(): number;
};

const INITIAL_STATE: TurnBoxState = {
  kind: "idle",
  displayFace: 1,
  shownFaces: new Set([1]),
  faceOverrides: EMPTY_MAP,
};

export const Root = React.forwardRef<TurnBoxRootHandle, RootProps>(
  ({ options, children, className, style }, ref) => {
    const { facePcs, axis, direction, type, duration, delay, width, height, even } = options;
    const opts = useMemo(
      () =>
        normalizeOptions({ facePcs, axis, direction, type, duration, delay, width, height, even }),
      [facePcs, axis, direction, type, duration, delay, width, height, even],
    );

    const boxWidth = options.width ?? 200;
    const boxHeight = options.height ?? 200;

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    const isAnimatingRef = useRef(false);
    const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(
      () => () => {
        for (const id of pendingTimers.current) clearTimeout(id);
      },
      [],
    );

    const addTimeout = useCallback((fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      pendingTimers.current.push(id);
    }, []);

    // Handle 2-phase transitions: fires after browser paints the pre-phase
    useEffect(() => {
      if (state.kind === "pre-positioning") {
        const { via, landAt } = state;
        const restingTransform = toTransformString(calcFaceTransform(landAt, landAt, opts));

        // rAF defers the transition start until the next paint, so the pre-position
        // is observable at t=0 (required by tests and correct browser behavior).
        const rafId = requestAnimationFrame(() => {
          dispatch({
            type: "ENTER_ANIMATING",
            displayFace: via,
            landAt,
            shownFaces: new Set([...state.shownFaces, landAt]),
            faceOverrides: new Map([[landAt, restingTransform]]),
          });
          addTimeout(() => {
            dispatch({ type: "COMPLETE", displayFace: landAt });
            isAnimatingRef.current = false;
          }, opts.duration + opts.delay);
        });

        return () => cancelAnimationFrame(rafId);
      } else if (state.kind === "adjusting") {
        const { to } = state;
        dispatch({ type: "ENTER_ADJUST_ANIMATING", displayFace: to });
        addTimeout(() => {
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
        }, opts.duration + opts.delay);
      }
    }, [state, opts, addTimeout]);

    const go = useCallback(
      (rawTarget: number, animationFlag: boolean) => {
        if (isAnimatingRef.current) return;

        const transition = resolveTransition(state.displayFace, rawTarget, opts, animationFlag);
        if (transition.kind === "noop") return;

        isAnimatingRef.current = true;
        const time = opts.duration + opts.delay;

        if (transition.kind === "virtual-wrap") {
          if (!transition.doAnimate) {
            dispatch({ type: "GO_INSTANT", displayFace: transition.landAt });
            addTimeout(() => {
              isAnimatingRef.current = false;
            }, time);
            return;
          }
          const incoming = transition.via === VIRTUAL_NEXT_WRAP ? 1 : 4;
          dispatch({
            type: "GO_PRE_POSITIONING",
            displayFace: state.displayFace,
            via: transition.via,
            landAt: transition.landAt,
            faceOverrides: new Map([[incoming, calcPrePositionTransform(transition.via, opts)]]),
            shownFaces: new Set([state.displayFace, incoming]),
          });
          return;
        }

        if (transition.kind === "step" && transition.hasAdjust) {
          if (!transition.doAnimate) {
            dispatch({ type: "GO_INSTANT", displayFace: transition.to });
            addTimeout(() => {
              isAnimatingRef.current = false;
            }, time);
            return;
          }
          dispatch({
            type: "GO_ADJUSTING",
            to: transition.to,
            shownFaces: new Set([state.displayFace, transition.to]),
          });
          return;
        }

        const to = transition.to;
        if (transition.doAnimate) {
          dispatch({ type: "GO_STEP", to, shownFaces: new Set([state.displayFace, to]) });
          addTimeout(() => {
            dispatch({ type: "COMPLETE", displayFace: to });
            isAnimatingRef.current = false;
          }, time);
        } else {
          dispatch({ type: "GO_INSTANT", displayFace: to });
          addTimeout(() => {
            isAnimatingRef.current = false;
          }, time);
        }
      },
      [state.displayFace, opts, addTimeout],
    );

    useImperativeHandle(
      ref,
      () => ({ go, getCurrentFace: () => state.displayFace }),
      [go, state.displayFace],
    );

    const { geometry } = opts;
    const isDisplayEven = state.displayFace % 2 === 0;
    const isAnimating = state.kind === "animating" || state.kind === "adjust-animating";
    const containerDynStyle: React.CSSProperties =
      geometry.kind === "variable"
        ? geometry.axis === "X"
          ? {
              height: isDisplayEven ? geometry.even : geometry.length,
              transition: isAnimating
                ? `height ${opts.duration}ms ease ${opts.delay}ms`
                : undefined,
            }
          : {
              left: isDisplayEven ? (geometry.length - geometry.even) / 2 : 0,
              transition: isAnimating
                ? `left ${opts.duration}ms ease ${opts.delay}ms`
                : undefined,
            }
        : {};

    const indexedChildren = React.Children.map(children, (child, i) => {
      if (React.isValidElement(child) && child.type === Face) {
        return React.cloneElement(child as React.ReactElement<{ _faceIndex?: number }>, {
          _faceIndex: i + 1,
        });
      }
      return child;
    });

    const ctx = useMemo(
      () => ({
        opts,
        displayFace: state.displayFace,
        phase: toPhase(state),
        shownFaces: state.shownFaces,
        faceOverrides: state.faceOverrides,
        go,
      }),
      [opts, state, go],
    );

    return (
      <div
        className={className}
        style={{
          perspective: "1000px",
          width: boxWidth,
          height: boxHeight,
          position: "relative",
          ...style,
        }}
      >
        <div
          data-turnbox-box
          style={{
            width: boxWidth,
            position: "absolute",
            top: 0,
            bottom: 0,
            transformStyle: "preserve-3d",
            ...containerDynStyle,
          }}
        >
          <TurnBoxContext.Provider value={ctx}>{indexedChildren}</TurnBoxContext.Provider>
        </div>
      </div>
    );
  },
);
