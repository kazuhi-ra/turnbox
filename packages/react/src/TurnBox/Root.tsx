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
import { resolveTransition } from "@turnbox/core/internal";
import { TurnBoxContext } from "./context.js";
import { toTransformString } from "./utils.js";
import { Face } from "./Face.js";
import {
  reducer,
  toPhase,
  INITIAL_STATE,
  buildGoInstantAction,
  buildGoPrePositioningAction,
  buildGoAdjustingAction,
  buildGoStepAction,
} from "./reducer.js";
import type { TurnBoxState } from "./reducer.js";

// ─── Module-scope helpers (Root-specific, not generic utils) ──────────────────

const calcContainerDynStyle = (
  state: TurnBoxState,
  opts: NormalizedOptions,
): React.CSSProperties => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return {};
  const isEven = state.displayFace % 2 === 0;
  const isAnimating = state.kind === "animating" || state.kind === "adjust-animating";
  const transition = isAnimating
    ? `${geometry.axis === "X" ? "height" : "left"} ${opts.duration}ms ease ${opts.delay}ms`
    : undefined;
  return geometry.axis === "X"
    ? { height: isEven ? geometry.even : geometry.length, transition }
    : { left: isEven ? (geometry.length - geometry.even) / 2 : 0, transition };
};

const buildIndexedChildren = (children: React.ReactNode): React.ReactNode =>
  React.Children.map(children, (child, i) => {
    if (React.isValidElement(child) && child.type === Face) {
      return React.cloneElement(child as React.ReactElement<{ _faceIndex?: number }>, {
        _faceIndex: i + 1,
      });
    }
    return child;
  });

// ─── Component ────────────────────────────────────────────────────────────────

type RootProps = TurnBoxOptions & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type TurnBoxRootHandle = {
  go(rawTarget: number, animation: boolean): void;
  getCurrentFace(): number;
};

export const Root = React.forwardRef<TurnBoxRootHandle, RootProps>(
  (
    {
      facePcs,
      axis,
      direction,
      type,
      duration,
      delay,
      width,
      height,
      even,
      children,
      className,
      style,
    },
    ref,
  ) => {
    // ── hooks ──────────────────────────────────────────────────────────────────
    const opts = useMemo(
      () =>
        normalizeOptions({ facePcs, axis, direction, type, duration, delay, width, height, even }),
      [facePcs, axis, direction, type, duration, delay, width, height, even],
    );
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
      pendingTimers.current = [...pendingTimers.current, id];
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
            dispatch(buildGoInstantAction(transition.landAt));
            addTimeout(() => {
              isAnimatingRef.current = false;
            }, time);
            return;
          }
          dispatch(
            buildGoPrePositioningAction(transition.via, transition.landAt, state.displayFace, opts),
          );
          return;
        }

        if (transition.kind === "step" && transition.hasAdjust) {
          if (!transition.doAnimate) {
            dispatch(buildGoInstantAction(transition.to));
            addTimeout(() => {
              isAnimatingRef.current = false;
            }, time);
            return;
          }
          dispatch(buildGoAdjustingAction(transition.to, state.displayFace));
          return;
        }

        const { to, doAnimate } = transition;
        if (!doAnimate) {
          dispatch(buildGoInstantAction(to));
          addTimeout(() => {
            isAnimatingRef.current = false;
          }, time);
          return;
        }
        dispatch(buildGoStepAction(to, state.displayFace));
        addTimeout(() => {
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
        }, time);
      },
      [state.displayFace, opts, addTimeout],
    );
    useImperativeHandle(ref, () => ({ go, getCurrentFace: () => state.displayFace }), [
      go,
      state.displayFace,
    ]);
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

    // ── derived values ─────────────────────────────────────────────────────────
    const boxWidth = width ?? 200;
    const boxHeight = height ?? 200;
    const containerDynStyle = calcContainerDynStyle(state, opts);

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
          <TurnBoxContext.Provider value={ctx}>
            {buildIndexedChildren(children)}
          </TurnBoxContext.Provider>
        </div>
      </div>
    );
  },
);

Root.displayName = "TurnBox.Root";
