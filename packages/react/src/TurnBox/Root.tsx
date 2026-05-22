import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { normalizeOptions, calcFaceTransform } from "@turnbox/core";
import type { TurnBoxOptions } from "@turnbox/core";
import { resolveTransition, VIRTUAL_NEXT_WRAP } from "@turnbox/core/internal";
import type { NormalizedOptions } from "@turnbox/core";
import { TurnBoxContext } from "./context.js";
import type { AnimationPhase } from "./context.js";
import { toTransformString } from "./utils.js";
import { Face } from "./Face.js";

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

  const [displayFace, setDisplayFace] = useState(1);
  const [phase, setPhase] = useState<AnimationPhase>({ kind: "idle" });
  const [shownFaces, setShownFaces] = useState<ReadonlySet<number>>(new Set([1]));
  const [faceOverrides, setFaceOverrides] = useState<ReadonlyMap<number, string>>(new Map());

  const currentFaceRef = useRef(1);
  const isAnimatingRef = useRef(false);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(
    () => () => {
      for (const id of pendingTimers.current) clearTimeout(id);
    },
    [],
  );

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    pendingTimers.current.push(id);
  }, []);

  // Handle 2-phase transitions: fires after browser paints the pre-phase
  useEffect(() => {
    if (phase.kind === "pre-positioning") {
      const { via, landAt } = phase;
      const currentOpts = optsRef.current;
      const restingTransform = toTransformString(calcFaceTransform(landAt, landAt, currentOpts));

      // rAF defers the transition start until the next paint, so the pre-position
      // is observable at t=0 (required by tests and correct browser behavior).
      const rafId = requestAnimationFrame(() => {
        setFaceOverrides(new Map([[landAt, restingTransform]]));
        setPhase({ kind: "animating" });
        setDisplayFace(via);
        setShownFaces((s) => new Set([...s, landAt]));
        currentFaceRef.current = via;

        addTimeout(() => {
          setPhase({ kind: "idle" });
          setDisplayFace(landAt);
          setShownFaces(new Set([landAt]));
          setFaceOverrides(new Map());
          currentFaceRef.current = landAt;
          isAnimatingRef.current = false;
        }, currentOpts.duration + currentOpts.delay);
      });

      return () => cancelAnimationFrame(rafId);
    } else if (phase.kind === "adjusting") {
      const { to } = phase;
      const currentOpts = optsRef.current;

      setPhase({ kind: "adjust-animating" });
      setDisplayFace(to);
      currentFaceRef.current = to;

      addTimeout(() => {
        setPhase({ kind: "idle" });
        setShownFaces(new Set([to]));
        isAnimatingRef.current = false;
      }, currentOpts.duration + currentOpts.delay);
    }
  }, [phase, addTimeout]);

  const go = useCallback(
    (rawTarget: number, animationFlag: boolean) => {
      if (isAnimatingRef.current) return;

      const currentOpts = optsRef.current;
      const from = currentFaceRef.current;
      const transition = resolveTransition(from, rawTarget, currentOpts, animationFlag);
      if (transition.kind === "noop") return;

      isAnimatingRef.current = true;
      const time = currentOpts.duration + currentOpts.delay;

      if (transition.kind === "virtual-wrap") {
        if (!transition.doAnimate) {
          setDisplayFace(transition.landAt);
          setShownFaces(new Set([transition.landAt]));
          currentFaceRef.current = transition.landAt;
          addTimeout(() => {
            isAnimatingRef.current = false;
          }, time);
          return;
        }
        const incoming = transition.via === VIRTUAL_NEXT_WRAP ? 1 : 4;
        setFaceOverrides(
          new Map([[incoming, calcPrePositionTransform(transition.via, currentOpts)]]),
        );
        setPhase({ kind: "pre-positioning", via: transition.via, landAt: transition.landAt });
        return;
      }

      if (transition.kind === "step" && transition.hasAdjust) {
        if (!transition.doAnimate) {
          setDisplayFace(transition.to);
          setShownFaces(new Set([transition.to]));
          currentFaceRef.current = transition.to;
          addTimeout(() => {
            isAnimatingRef.current = false;
          }, time);
          return;
        }
        setShownFaces((s) => new Set([...s, transition.to]));
        setPhase({ kind: "adjusting", to: transition.to });
        return;
      }

      const to = transition.to;
      if (transition.doAnimate) {
        setPhase({ kind: "animating" });
        setDisplayFace(to);
        setShownFaces((s) => new Set([...s, to]));
        currentFaceRef.current = to;

        addTimeout(() => {
          setPhase({ kind: "idle" });
          setShownFaces(new Set([to]));
          isAnimatingRef.current = false;
        }, time);
      } else {
        setDisplayFace(to);
        setShownFaces(new Set([to]));
        currentFaceRef.current = to;
        addTimeout(() => {
          isAnimatingRef.current = false;
        }, time);
      }
    },
    [addTimeout],
  );

  useImperativeHandle(ref, () => ({ go, getCurrentFace: () => currentFaceRef.current }), [go]);

  const { geometry } = opts;
  const isDisplayEven = displayFace % 2 === 0;
  const containerDynStyle: React.CSSProperties =
    geometry.kind === "variable"
      ? geometry.axis === "X"
        ? {
            height: isDisplayEven ? geometry.even : geometry.length,
            transition:
              phase.kind === "animating" || phase.kind === "adjust-animating"
                ? `height ${opts.duration}ms ease ${opts.delay}ms`
                : undefined,
          }
        : {
            left: isDisplayEven ? (geometry.length - geometry.even) / 2 : 0,
            transition:
              phase.kind === "animating" || phase.kind === "adjust-animating"
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
    () => ({ opts, displayFace, phase, shownFaces, faceOverrides, go }),
    [opts, displayFace, phase, shownFaces, faceOverrides, go],
  );

  return (
    <div
      className={className}
      style={{ perspective: "1000px", width: boxWidth, height: boxHeight, position: "relative", ...style }}
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
});
