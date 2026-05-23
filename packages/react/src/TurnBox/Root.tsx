import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef } from "react";
import { normalizeOptions, calcFaceTransform, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
import type { TurnBoxOptions, NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import { resolveTransition } from "@kazuhi-ra/turnbox-core/internal";
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

const calcContainerDynStyle = (state: TurnBoxState, opts: NormalizedOptions): React.CSSProperties => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return {};
  const isEven = state.displayFace % 2 === 0;
  const isAnimating = state.kind === "animating" || state.kind === "adjust-animating";
  const transition = isAnimating
    ? `${geometry.axis === "X" ? "height" : "left"} ${opts.duration}ms ${opts.easing} ${opts.delay}ms`
    : undefined;
  return geometry.axis === "X"
    ? { height: isEven ? geometry.even : geometry.length, transition }
    : { left: isEven ? (geometry.length - geometry.even) / 2 : 0, transition };
};

const buildIndexedChildren = (children: React.ReactNode, maxFaces: number): React.ReactNode => {
  let faceCount = 0;
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Face) {
      faceCount++;
      if (faceCount > maxFaces) return null;
      return React.cloneElement(child as React.ReactElement<{ _faceIndex?: number }>, {
        _faceIndex: faceCount,
      });
    }
    return child;
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

type RootProps = TurnBoxOptions & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type TurnBoxRootHandle = {
  goTo(face: number, animation?: boolean): void;
  getCurrentFace(): number;
  next(): void;
  prev(): void;
};

export const Root = React.forwardRef<TurnBoxRootHandle, RootProps>(
  (
    {
      faces,
      axis,
      direction,
      type,
      duration,
      delay,
      easing,
      perspective,
      width,
      height,
      even,
      onChange,
      onAnimationEnd,
      children,
      className,
      style,
    },
    ref,
  ) => {
    // ── hooks ──────────────────────────────────────────────────────────────────
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const isAnimatingRef = useRef(false);
    const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const onChangeRef = useRef(onChange);
    const onAnimationEndRef = useRef(onAnimationEnd);
    onChangeRef.current = onChange;
    onAnimationEndRef.current = onAnimationEnd;

    const opts = useMemo(
      () =>
        normalizeOptions({
          faces,
          axis,
          direction,
          type,
          duration,
          delay,
          easing,
          perspective,
          width,
          height,
          even,
        }),
      [faces, axis, direction, type, duration, delay, easing, perspective, width, height, even],
    );

    const addTimeout = useCallback((fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      pendingTimers.current = [...pendingTimers.current, id];
    }, []);

    useEffect(
      () => () => {
        for (const id of pendingTimers.current) clearTimeout(id);
      },
      [],
    );

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
            onAnimationEndRef.current?.(landAt);
          }, opts.duration + opts.delay);
        });

        return () => cancelAnimationFrame(rafId);
      } else if (state.kind === "adjusting") {
        const { to } = state;
        dispatch({ type: "ENTER_ADJUST_ANIMATING", displayFace: to });
        addTimeout(() => {
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
          onAnimationEndRef.current?.(to);
        }, opts.duration + opts.delay);
      }
    }, [state, opts, addTimeout]);

    const goTo = useCallback(
      (rawTarget: number, animation = true) => {
        if (isAnimatingRef.current) return;

        const transition = resolveTransition(state.displayFace, rawTarget, opts, animation);
        if (transition.kind === "noop") return;

        isAnimatingRef.current = true;
        const time = opts.duration + opts.delay;
        const targetFace = transition.kind === "virtual-wrap" ? transition.landAt : transition.to;
        onChangeRef.current?.(targetFace);

        if (transition.kind === "virtual-wrap") {
          if (!transition.doAnimate) {
            dispatch(buildGoInstantAction(transition.landAt));
            addTimeout(() => {
              isAnimatingRef.current = false;
              onAnimationEndRef.current?.(transition.landAt);
            }, time);
            return;
          }
          dispatch(buildGoPrePositioningAction(transition.via, transition.landAt, state.displayFace, opts));
          return;
        }

        if (transition.kind === "step" && transition.hasAdjust) {
          if (!transition.doAnimate) {
            dispatch(buildGoInstantAction(transition.to));
            addTimeout(() => {
              isAnimatingRef.current = false;
              onAnimationEndRef.current?.(transition.to);
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
            onAnimationEndRef.current?.(to);
          }, time);
          return;
        }
        dispatch(buildGoStepAction(to, state.displayFace));
        addTimeout(() => {
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
          onAnimationEndRef.current?.(to);
        }, time);
      },
      [state.displayFace, opts, addTimeout],
    );

    const next = useCallback(() => goTo(state.displayFace + 1, true), [goTo, state.displayFace]);
    const prev = useCallback(() => goTo(state.displayFace - 1, true), [goTo, state.displayFace]);

    useImperativeHandle(ref, () => ({ goTo, getCurrentFace: () => state.displayFace, next, prev }), [
      goTo,
      next,
      prev,
      state.displayFace,
    ]);

    const ctx = useMemo(
      () => ({
        opts,
        displayFace: state.displayFace,
        phase: toPhase(state),
        shownFaces: state.shownFaces,
        faceOverrides: state.faceOverrides,
        goTo,
        next,
        prev,
      }),
      [opts, state, goTo, next, prev],
    );

    // ── derived values ─────────────────────────────────────────────────────────
    const boxWidth = width ?? DEFAULT_SIZE;
    const boxHeight = height ?? DEFAULT_HEIGHT;
    const containerDynStyle = calcContainerDynStyle(state, opts);

    return (
      <div
        className={className}
        style={{
          perspective: `${opts.perspective}px`,
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
          <TurnBoxContext.Provider value={ctx}>{buildIndexedChildren(children, opts.faces)}</TurnBoxContext.Provider>
        </div>
      </div>
    );
  },
);

Root.displayName = "TurnBox.Root";
