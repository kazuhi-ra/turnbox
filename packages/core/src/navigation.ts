import type { Direction, NormalizedOptions, Transition, VirtualWrapFace } from "./types.js";
import { VIRTUAL_PREV_WRAP, VIRTUAL_NEXT_WRAP } from "./types.js";
import { MAX_FACE_PCS } from "./normalize.js";

// Returns true if the transition should animate
export const shouldAnimate = (
  currentFace: number,
  targetFace: number,
  options: NormalizedOptions,
  animationFlag = true,
): boolean => {
  if (!animationFlag) return false;
  if (currentFace === targetFace) return false;
  const diff = Math.abs(targetFace - currentFace);
  if (options.type !== "skip" && diff > 1) return false;
  return true;
};

const isVirtualWrapFace = (f: number): f is VirtualWrapFace =>
  f === VIRTUAL_PREV_WRAP || f === VIRTUAL_NEXT_WRAP;

const resolveVirtualLanding = (via: VirtualWrapFace): 1 | 4 => (via === VIRTUAL_PREV_WRAP ? 4 : 1);

// Static lookup: (currentFace, targetFace) pairs that require the variable-geometry adjust pre-phase
const ADJUST_PAIRS: Record<Direction, readonly [number, number][]> = {
  positive: [
    [0, 1],
    [1, 0],
    [2, 3],
    [3, 2],
    [4, 5],
    [5, 4],
  ],
  negative: [
    [0, 5],
    [1, 2],
    [2, 1],
    [3, 4],
    [4, 3],
    [5, 0],
  ],
};

const needsAdjust = (from: number, to: number, opts: NormalizedOptions): boolean => {
  if (opts.geometry.kind === "fixed" || opts.type !== "real") return false;
  return ADJUST_PAIRS[opts.direction].some(([c, t]) => c === from && t === to);
};

// Resolves rawTarget to a canonical face number and wrap kind.
// Returns { kind: "noop" } when the target is out of range or already current.
type BoundaryResult = { kind: "noop" } | { kind: "resolved"; to: number; isDirectWrap: boolean };

const resolveBoundary = (rawTarget: number, opts: NormalizedOptions): BoundaryResult => {
  if (opts.facePcs === MAX_FACE_PCS) {
    if (opts.type === "real") {
      if (rawTarget < 0) return { kind: "noop" };
      return {
        kind: "resolved",
        to: rawTarget > 5 ? opts.facePcs : rawTarget,
        isDirectWrap: false,
      };
    }
    if (opts.type === "repeat" || opts.type === "skip") {
      if (rawTarget === opts.facePcs + 1) return { kind: "resolved", to: 1, isDirectWrap: true };
      if (rawTarget === 0) return { kind: "resolved", to: opts.facePcs, isDirectWrap: true };
      if (rawTarget < 1 || rawTarget > opts.facePcs) return { kind: "noop" };
      return { kind: "resolved", to: rawTarget, isDirectWrap: false };
    }
    if (rawTarget < 1 || rawTarget > opts.facePcs) return { kind: "noop" };
    return { kind: "resolved", to: rawTarget, isDirectWrap: false };
  }
  if (rawTarget < 1) return { kind: "noop" };
  return { kind: "resolved", to: Math.min(rawTarget, opts.facePcs), isDirectWrap: false };
};

export const resolveTransition = (
  from: number,
  rawTarget: number,
  opts: NormalizedOptions,
  animationFlag: boolean,
): Transition => {
  const boundary = resolveBoundary(rawTarget, opts);
  if (boundary.kind === "noop" || from === boundary.to) return { kind: "noop" };

  const { to, isDirectWrap } = boundary;

  if (isDirectWrap) {
    // type:repeat wrap: shouldAnimate rejects large diffs, so bypass it
    const doAnimate =
      opts.type === "repeat" ? animationFlag : shouldAnimate(from, to, opts, animationFlag);
    return { kind: "direct-wrap", to, doAnimate };
  }

  if (isVirtualWrapFace(to)) {
    return {
      kind: "virtual-wrap",
      via: to,
      landAt: resolveVirtualLanding(to),
      doAnimate: shouldAnimate(from, to, opts, animationFlag),
    };
  }

  return {
    kind: "step",
    to,
    doAnimate: shouldAnimate(from, to, opts, animationFlag),
    hasAdjust: needsAdjust(from, to, opts),
  };
};
