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
  if (options.type !== "skip" && diff > 1) {
    // face1↔faceMax is a single-step boundary wrap in type:real/repeat — always animates.
    // This applies to both direct calls (goTo(1) from face4) and queue drain re-resolution
    // (next()@face4 stores resolved {face:1}; drain calls resolveTransition(4,1,opts)).
    // Without this, drain would see diff=3>1 → doAnimate:false → snap instead of animation.
    const isBoundaryWrap =
      options.faces === MAX_FACE_PCS &&
      (options.type === "real" || options.type === "repeat") &&
      ((currentFace === 1 && targetFace === options.faces) || (currentFace === options.faces && targetFace === 1));
    if (!isBoundaryWrap) return false;
  }
  return true;
};

// Resolves rawTarget to a canonical face number and wrap kind.
// Returns { kind: "noop" } when the target is out of range or already current.
// isDirectWrap is true only for out-of-bounds rawTargets (goTo(0), goTo(faces+1)).
// In-range boundary pairs (face1↔face4 in type:real/repeat) are handled by shouldAnimate.
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
    // Out-of-bounds rawTarget (goTo(0) / goTo(faces+1)) bypasses shouldAnimate — animate based
    // solely on animationFlag. shouldAnimate would reject diff>1, but these are valid single-step
    // wraps that just happened to arrive via an out-of-bounds shorthand.
    return { kind: "direct-wrap", to, doAnimate: animationFlag };
  }

  return {
    kind: "step",
    to,
    doAnimate: shouldAnimate(from, to, opts, animationFlag),
  };
};
