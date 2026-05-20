import type { NormalizedOptions } from "./types.js";

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
