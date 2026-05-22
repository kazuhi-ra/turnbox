// Public API — intended for users of @turnbox/dom, @turnbox/react, @turnbox/vue,
// and authors building custom renderers on top of @turnbox/core.

// Option types
export type { Axis, Direction, AnimationType, FaceCount, TurnBoxOptions } from "./types.js";

// Normalized types (needed when calling calc functions directly)
export type { NormalizedOptions, Geometry, FaceTransform } from "./types.js";

// Core functions
export { normalizeOptions, DEFAULT_DURATION, DEFAULT_DELAY, DEFAULT_SIZE } from "./normalize.js";
export { calcFaceTransform, calcAdjustFaceTransform } from "./transform.js";
