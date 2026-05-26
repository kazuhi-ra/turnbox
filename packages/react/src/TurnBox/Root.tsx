import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { normalizeOptions, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
import type { TurnBoxOptions, NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import { resolveTransition, FOCUSABLE } from "@kazuhi-ra/turnbox-core/internal";
import { TurnBoxContext } from "./context.js";
import { useTurnBoxConfig } from "./ConfigContext.js";
import { Face } from "./Face.js";
import {
  reducer,
  toPhase,
  INITIAL_STATE,
  buildGoInstantAction,
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
    const animatingFromFaceRef = useRef<number | null>(null);
    const pendingNavigations = useRef<Array<{ face: number; animation: boolean }>>([]);
    const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const stateRef = useRef(state);
    stateRef.current = state;
    const onChangeRef = useRef(onChange);
    const onAnimationEndRef = useRef(onAnimationEnd);
    onChangeRef.current = onChange;
    onAnimationEndRef.current = onAnimationEnd;

    const boxRef = useRef<HTMLDivElement>(null);

    const cancelFaceAnimations = useCallback((): void => {
      const box = boxRef.current;
      if (!box) return;
      for (const el of box.querySelectorAll<HTMLElement>("[data-face-index]")) {
        for (const anim of el.getAnimations?.() ?? []) anim.cancel();
      }
    }, []);

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

    const resolveCurrentFace = useCallback((): number => stateRef.current.displayFace, []);

    const goTo = useCallback(
      (rawTarget: number, animation = true) => {
        const fromFace = resolveCurrentFace();

        if (isAnimatingRef.current) {
          const transition = resolveTransition(fromFace, rawTarget, opts, animation);
          if (transition.kind === "noop") return;

          const isImmediate = !animation || transition.to === animatingFromFaceRef.current;

          if (!isImmediate) {
            pendingNavigations.current.push({ face: rawTarget, animation });
            return;
          }

          // 即時実行: abort current animation and clear queue
          for (const id of pendingTimers.current) clearTimeout(id);
          pendingTimers.current = [];
          dispatch({ type: "COMPLETE", displayFace: fromFace });
          isAnimatingRef.current = false;
          animatingFromFaceRef.current = null;
          pendingNavigations.current = [];
        }

        const transition = resolveTransition(fromFace, rawTarget, opts, animation);
        if (transition.kind === "noop") return;

        isAnimatingRef.current = true;
        animatingFromFaceRef.current = fromFace;
        const time = opts.duration + opts.delay;
        onChangeRef.current?.(transition.to);

        const drainQueue = () => {
          const pending = pendingNavigations.current.shift();
          if (pending) goTo(pending.face, pending.animation);
        };

        if (transition.kind === "step" && transition.hasAdjust) {
          if (!transition.doAnimate) {
            dispatch(buildGoInstantAction(transition.to));
            addTimeout(() => {
              isAnimatingRef.current = false;
              animatingFromFaceRef.current = null;
              onAnimationEndRef.current?.(transition.to);
              drainQueue();
            }, time);
            return;
          }
          dispatch(buildGoAdjustingAction(transition.to, fromFace));
          return;
        }

        const { to, doAnimate } = transition;
        if (!doAnimate) {
          dispatch(buildGoInstantAction(to));
          addTimeout(() => {
            isAnimatingRef.current = false;
            animatingFromFaceRef.current = null;
            onAnimationEndRef.current?.(to);
            drainQueue();
          }, time);
          return;
        }
        dispatch(buildGoStepAction(to, fromFace));
        addTimeout(() => {
          cancelFaceAnimations();
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
          animatingFromFaceRef.current = null;
          onAnimationEndRef.current?.(to);
          drainQueue();
        }, time);
      },
      [opts, addTimeout, resolveCurrentFace, cancelFaceAnimations],
    );

    useEffect(() => {
      if (state.kind === "adjusting") {
        const { to } = state;
        dispatch({ type: "ENTER_ADJUST_ANIMATING", displayFace: to });
        addTimeout(() => {
          cancelFaceAnimations();
          dispatch({ type: "COMPLETE", displayFace: to });
          isAnimatingRef.current = false;
          animatingFromFaceRef.current = null;
          onAnimationEndRef.current?.(to);
          const pending = pendingNavigations.current.shift();
          if (pending) goTo(pending.face, pending.animation);
        }, opts.duration + opts.delay);
      }
    }, [state, opts, addTimeout, goTo, cancelFaceAnimations]);

    const next = useCallback(() => goTo(resolveCurrentFace() + 1, true), [goTo, resolveCurrentFace]);
    const prev = useCallback(() => goTo(resolveCurrentFace() - 1, true), [goTo, resolveCurrentFace]);

    useImperativeHandle(
      ref,
      () => ({ goTo, getCurrentFace: () => state.displayFace, isAnimating: () => isAnimatingRef.current, next, prev }),
      [goTo, next, prev, state.displayFace],
    );

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
