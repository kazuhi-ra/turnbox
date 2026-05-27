import type { NormalizedOptions, Transition } from "./types.js";
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

// Resolves rawTarget to a canonical face number and wrap kind.
// Returns { kind: "noop" } when the target is out of range or already current.
// isDirectWrap is true for out-of-bounds rawTargets (goTo(0), goTo(faces+1)) AND for
// in-range boundary pairs (face1↔face4 in type:real/repeat) — both are wrap transitions.
type BoundaryResult = { kind: "noop" } | { kind: "resolved"; to: number; isDirectWrap: boolean };

const resolveBoundary = (rawTarget: number, from: number, opts: NormalizedOptions): BoundaryResult => {
  if (opts.faces === MAX_FACE_PCS) {
    if (rawTarget === opts.faces + 1) return { kind: "resolved", to: 1, isDirectWrap: true };
    if (rawTarget === 0) return { kind: "resolved", to: opts.faces, isDirectWrap: true };
    if (rawTarget > opts.faces + 1) return { kind: "resolved", to: opts.faces, isDirectWrap: false };
    if (rawTarget < 0) return { kind: "noop" };
    // face1↔face4 in type:real/repeat is always a wrap transition, even when rawTarget is
    // in-range. This covers both direct calls (goTo(1) from face4) and the queue drain
    // case where next()@face4 stores resolved {face:1} — without this, drain re-evaluates
    // as diff=3>1 → doAnimate:false → snap instead of animated wrap. type:skip is exempt
    // because shouldAnimate already allows non-adjacent jumps.
    const isBoundaryPair =
      (opts.type === "real" || opts.type === "repeat") &&
      ((from === 1 && rawTarget === opts.faces) || (from === opts.faces && rawTarget === 1));
    return { kind: "resolved", to: rawTarget, isDirectWrap: isBoundaryPair };
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
  const boundary = resolveBoundary(rawTarget, from, opts);
  if (boundary.kind === "noop" || from === boundary.to) return { kind: "noop" };

  const { to, isDirectWrap } = boundary;

  if (isDirectWrap) {
    // boundary wraps always animate based on animationFlag — shouldAnimate rejects large diffs
    return { kind: "direct-wrap", to, doAnimate: animationFlag };
  }

  return {
    kind: "step",
    to,
    doAnimate: shouldAnimate(from, to, opts, animationFlag),
  };
};
