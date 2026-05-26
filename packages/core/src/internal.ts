// Internal API — for use by @kazuhi-ra/turnbox-* packages. Not part of the public contract.
// Anything exported here may change between minor versions.

export * from "./index.js";

export type {
  Transition,
  RotationDeg,
  FaceVisibility,
  FaceParity,
} from "./types.js";
export { MAX_FACE_PCS } from "./normalize.js";
export { FOCUSABLE } from "./focus.js";
export { calcAdjustFaceTransform, getFaceParity } from "./transform.js";
export { shouldAnimate, resolveTransition } from "./navigation.js";
