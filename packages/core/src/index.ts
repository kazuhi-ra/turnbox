// Public API — intended for users of @kazuhi-ra/turnbox-dom, @kazuhi-ra/turnbox-react, @kazuhi-ra/turnbox-vue,
// and authors building custom renderers on top of @kazuhi-ra/turnbox-core.

// Option types
export type { Axis, Direction, AnimationType, FaceCount, TurnBoxOptions, ReduceAnimation } from "./types.js";

// Normalized types (needed when calling calc functions directly)
export type { NormalizedOptions, Geometry, FaceTransform } from "./types.js";

// Core functions
export {
  normalizeOptions,
  DEFAULT_DURATION,
  DEFAULT_DELAY,
  DEFAULT_EASING,
  DEFAULT_PERSPECTIVE,
  DEFAULT_SIZE,
  DEFAULT_HEIGHT,
} from "./normalize.js";
export { calcFaceTransform } from "./transform.js";
