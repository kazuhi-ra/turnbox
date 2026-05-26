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

const isVirtualWrapFace = (f: number): f is VirtualWrapFace => f === VIRTUAL_PREV_WRAP || f === VIRTUAL_NEXT_WRAP;

const resolveVirtualLanding = (via: VirtualWrapFace): 1 | 4 => (via === VIRTUAL_PREV_WRAP ? 4 : 1);

// Static lookup: (currentFace, targetFace) pairs that require the variable-geometry adjust pre-phase
const ADJUST_PAIRS: Record<Direction, readonly [number, number][]> = {
  positive: [
    [2, 3],
    [3, 2],
  ],
  negative: [
    [1, 2],
    [2, 1],
    [3, 4],
    [4, 3],
  ],
};

const resolveVirtualWrapVia = (from: number, to: number, opts: NormalizedOptions): VirtualWrapFace | null => {
  if (opts.type !== "real" || opts.faces !== MAX_FACE_PCS) return null;
  if (from === 1 && to === opts.faces) return VIRTUAL_PREV_WRAP;
  if (from === opts.faces && to === 1) return VIRTUAL_NEXT_WRAP;
  return null;
};

const needsAdjust = (from: number, to: number, opts: NormalizedOptions): boolean => {
  if (opts.geometry.kind === "fixed" || opts.type !== "real") return false;
  return ADJUST_PAIRS[opts.direction].some(([c, t]) => c === from && t === to);
};

// Resolves rawTarget to a canonical face number and wrap kind.
// Returns { kind: "noop" } when the target is out of range or already current.
type BoundaryResult = { kind: "noop" } | { kind: "resolved"; to: number; isDirectWrap: boolean };

const resolveBoundary = (rawTarget: number, opts: NormalizedOptions): BoundaryResult => {
  if (opts.faces === MAX_FACE_PCS) {
    if (rawTarget === opts.faces + 1) return { kind: "resolved", to: 1, isDirectWrap: true };
    if (rawTarget === 0) return { kind: "resolved", to: opts.faces, isDirectWrap: true };
    if (rawTarget > opts.faces + 1) return { kind: "resolved", to: opts.faces, isDirectWrap: false };
    if (rawTarget < 0) return { kind: "noop" };
    return { kind: "resolved", to: rawTarget, isDirectWrap: false };
  }
  if (rawTarget < 1) return { kind: "noop" };
  return { kind: "resolved", to: Math.min(rawTarget, opts.faces), isDirectWrap: false };
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
    // boundary wraps always animate based on animationFlag — shouldAnimate rejects large diffs
    return { kind: "direct-wrap", to, doAnimate: animationFlag };
  }

  if (isVirtualWrapFace(to)) {
    return {
      kind: "virtual-wrap",
      via: to,
      landAt: resolveVirtualLanding(to),
      doAnimate: shouldAnimate(from, to, opts, animationFlag),
    };
  }

  const virtualVia = resolveVirtualWrapVia(from, to, opts);
  if (virtualVia !== null) {
    return {
      kind: "virtual-wrap",
      via: virtualVia,
      landAt: resolveVirtualLanding(virtualVia),
      doAnimate: shouldAnimate(from, virtualVia, opts, animationFlag),
    };
  }

  return {
    kind: "step",
    to,
    doAnimate: shouldAnimate(from, to, opts, animationFlag),
    hasAdjust: needsAdjust(from, to, opts),
  };
};
