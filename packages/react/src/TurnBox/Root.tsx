import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { normalizeOptions, calcFaceTransform, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
import type { TurnBoxOptions, NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import { resolveTransition, FOCUSABLE } from "@kazuhi-ra/turnbox-core/internal";
import { TurnBoxContext } from "./context.js";
import { useTurnBoxConfig } from "./ConfigContext.js";
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

type RootProps = TurnBoxOptions &
  React.AriaAttributes & {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  };

export type TurnBoxRootHandle = {
  goTo(face: number, animation?: boolean): void;
  getCurrentFace(): number;
  isAnimating(): boolean;
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
      "aria-label": ariaLabel,
      ...ariaRest
    },
    ref,
  ) => {
    // ── hooks ──────────────────────────────────────────────────────────────────
    const config = useTurnBoxConfig();
    const effectiveReduceAnimation = config.reduceAnimation;

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const isAnimatingRef = useRef(false);
    const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const onChangeRef = useRef(onChange);
    const onAnimationEndRef = useRef(onAnimationEnd);
    onChangeRef.current = onChange;
    onAnimationEndRef.current = onAnimationEnd;

    const boxRef = useRef<HTMLDivElement>(null);

    const opts = useMemo(() => {
      const base = normalizeOptions({
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
      });
      const prefersReducedMotion =
        effectiveReduceAnimation !== "never" &&
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return { ...base, duration: 0, delay: 0 };
      }
      return base;
    }, [
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
      effectiveReduceAnimation,
    ]);

    const addTimeout = useCallback((fn: () => void, ms: number) => {
      pendingTimers.current.push(setTimeout(fn, ms));
    }, []);

    useEffect(
      () => () => {
        for (const id of pendingTimers.current) clearTimeout(id);
      },
      [],
    );

    // ── Focus management ───────────────────────────────────────────────────────
    // Detect navigation completion during render (pattern: store prev with useState).
    // We track both kind and displayFace because instant transitions (GO_INSTANT)
    // keep kind==="idle" throughout — only displayFace changes.
    // focusRequest bundles the target face + a seq counter into one state so the
    // effect deps are exhaustive — no stale closure on state.displayFace.
    const [prevKind, setPrevKind] = useState(state.kind);
    const [prevFace, setPrevFace] = useState(state.displayFace);
    const [focusRequest, setFocusRequest] = useState<{ face: number; seq: number } | null>(null);

    if (state.kind !== prevKind || state.displayFace !== prevFace) {
      setPrevKind(state.kind);
      setPrevFace(state.displayFace);
      // Fire when landing on idle: either kind just became idle (animated) or
      // face changed while kind stayed idle (instant).
      if (state.kind === "idle" && (prevKind !== "idle" || state.displayFace !== prevFace)) {
        setFocusRequest((prev) => ({ face: state.displayFace, seq: (prev?.seq ?? 0) + 1 }));
      }
    }

    useEffect(() => {
      if (!focusRequest) return;
      boxRef.current
        ?.querySelector<HTMLElement>(`[data-face-index="${focusRequest.face}"]`)
        ?.querySelector<HTMLElement>(FOCUSABLE)
        ?.focus({ preventScroll: true });
    }, [focusRequest]);

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

    useImperativeHandle(ref, () => ({ goTo, getCurrentFace: () => state.displayFace, isAnimating: () => isAnimatingRef.current, next, prev }), [
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
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role="region" is set conditionally alongside aria-label; Biome cannot track the dynamic pairing
      <div
        {...ariaRest}
        // role="region" makes TurnBox a landmark for screen reader navigation (e.g. "R" key jump).
        // Only set when aria-label is provided — an unlabelled landmark is worse than no landmark.
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
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
          ref={boxRef}
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
