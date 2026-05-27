import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { normalizeOptions, DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
import type { TurnBoxOptions, NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import { FOCUSABLE, resolveNavigation, buildDrainResult } from "@kazuhi-ra/turnbox-core/internal";
import { TurnBoxContext } from "./context.js";
import { useTurnBoxConfig } from "./ConfigContext.js";
import { Face } from "./Face.js";
import { reducer, toPhase, INITIAL_STATE, buildGoInstantAction, buildGoStepAction } from "./reducer.js";
import type { TurnBoxState, TurnBoxAction, PendingNav } from "./reducer.js";

const calcContainerDynStyle = (state: TurnBoxState, opts: NormalizedOptions): React.CSSProperties => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return {};
  const isEven = state.displayFace % 2 === 0;
  const isAnimating = state.kind === "animating";
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

    // stateRef mirrors reducer state and is updated both on every render and immediately
    // after every dispatch via dispatchAndSync. This gives stable callbacks (not recreated
    // on every render) access to the latest state without waiting for a render cycle.
    const stateRef = useRef<TurnBoxState>(state);
    stateRef.current = state;

    const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const onChangeRef = useRef(onChange);
    const onAnimationEndRef = useRef(onAnimationEnd);
    onChangeRef.current = onChange;
    onAnimationEndRef.current = onAnimationEnd;

    const boxRef = useRef<HTMLDivElement>(null);

    // Runs the reducer synchronously to update stateRef, then dispatches for React render.
    // Without the synchronous update, multiple goTo calls in the same synchronous block
    // (e.g. inside act()) would all read stale state because React batches renders.
    const dispatchAndSync = useCallback((action: TurnBoxAction): void => {
      stateRef.current = reducer(stateRef.current, action);
      dispatch(action);
    }, []);

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
    // keep kind==="settling" then become "idle" — only displayFace changes for instant.
    // focusRequest bundles the target face + a seq counter into one state so the
    // effect deps are exhaustive — no stale closure on state.displayFace.
    const [prevKind, setPrevKind] = useState<TurnBoxState["kind"]>(state.kind);
    const [prevFace, setPrevFace] = useState(state.displayFace);
    const [focusRequest, setFocusRequest] = useState<{ face: number; seq: number } | null>(null);

    if (state.kind !== prevKind || state.displayFace !== prevFace) {
      setPrevKind(state.kind);
      setPrevFace(state.displayFace);
      // Fire focus when the user has "arrived" at a new face:
      // - Animated: kind transitions animating → idle (COMPLETE fired).
      // - Instant: kind transitions to settling (GO_INSTANT; face is immediately visible,
      //   no CSS transition). Settling → idle (SETTLE) does NOT re-fire — focus already moved.
      if ((state.kind === "idle" && prevKind === "animating") || state.kind === "settling") {
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
        // drainQueue is local to goTo so it can call goTo recursively without a circular
        // useCallback dependency. It receives the queue snapshot captured before COMPLETE/SETTLE.
        const drainQueue = (settledFace: number, queue: PendingNav[]): void => {
          const result = buildDrainResult(settledFace, queue, opts);
          if (result.kind === "empty") return;
          goTo(result.nav.face, result.nav.animation);
          if (stateRef.current.kind !== "idle") {
            for (const item of result.enqueue) dispatchAndSync({ type: "ENQUEUE", nav: item });
          }
        };

        let decision = resolveNavigation(stateRef.current, rawTarget, opts, animation);
        if (decision.kind === "noop") return;
        if (decision.kind === "enqueue") {
          dispatchAndSync({ type: "ENQUEUE", nav: decision.nav });
          return;
        }
        if (decision.kind === "abort") {
          // Do NOT call cancelFaceAnimations() here — the new animation's CSS transition will
          // use the compositor mid-value as before-change style for smooth reversal.
          // anim.cancel() belongs only in the completion cleanup timer.
          for (const id of pendingTimers.current) clearTimeout(id);
          pendingTimers.current = [];
          dispatchAndSync({ type: "ABORT", displayFace: stateRef.current.displayFace });
          decision = resolveNavigation(stateRef.current, rawTarget, opts, animation);
          if (decision.kind !== "go") return;
        }

        const { from: fromFace, to, doAnimate } = decision;
        const time = opts.duration + opts.delay;
        onChangeRef.current?.(to);

        if (!doAnimate) {
          dispatchAndSync(buildGoInstantAction(to, fromFace));
          addTimeout(() => {
            const currentState = stateRef.current;
            const pendingQueue: PendingNav[] = currentState.kind === "settling" ? [...currentState.queue] : [];
            dispatchAndSync({ type: "SETTLE" });
            onAnimationEndRef.current?.(to);
            drainQueue(to, pendingQueue);
          }, time);
          return;
        }
        dispatchAndSync(buildGoStepAction(to, fromFace));
        addTimeout(() => {
          cancelFaceAnimations();
          const currentState = stateRef.current;
          const pendingQueue: PendingNav[] = currentState.kind === "animating" ? [...currentState.queue] : [];
          dispatchAndSync({ type: "COMPLETE", displayFace: to });
          onAnimationEndRef.current?.(to);
          drainQueue(to, pendingQueue);
        }, time);
      },
      [opts, addTimeout, cancelFaceAnimations, dispatchAndSync],
    );

    const next = useCallback(() => goTo(resolveCurrentFace() + 1, true), [goTo, resolveCurrentFace]);
    const prev = useCallback(() => goTo(resolveCurrentFace() - 1, true), [goTo, resolveCurrentFace]);

    useImperativeHandle(
      ref,
      () => ({
        goTo,
        getCurrentFace: () => state.displayFace,
        isAnimating: () => stateRef.current.kind !== "idle",
        next,
        prev,
      }),
      [goTo, next, prev, state.displayFace],
    );

    const ctx = useMemo(
      () => ({
        opts,
        displayFace: state.displayFace,
        phase: toPhase(state),
        shownFaces: state.shownFaces,
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
