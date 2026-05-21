// Public API — intended for users of @turnbox/dom, @turnbox/react, @turnbox/vue,
// and authors building custom renderers on top of @turnbox/core.

// Option types
export type { Axis, Direction, AnimationType, TurnBoxOptions } from "./types.js";

// Normalized types (needed when calling calc functions directly)
export type { NormalizedOptions, Geometry, FaceTransform } from "./types.js";

// Core functions
export { normalizeOptions } from "./normalize.js";
export { calcFaceTransform, calcAdjustFaceTransform } from "./transform.js";
