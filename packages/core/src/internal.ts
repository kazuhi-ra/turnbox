// Internal API — for use by @turnbox/dom only. Not part of the public contract.
// Anything exported here may change between minor versions.

export * from "./index.js";

export type {
  VirtualWrapFace,
  Transition,
  RotationDeg,
  FaceVisibility,
  FaceParity,
} from "./types.js";
export { VIRTUAL_PREV_WRAP, VIRTUAL_NEXT_WRAP } from "./types.js";
export { MAX_FACE_PCS } from "./normalize.js";
export { getFaceParity } from "./transform.js";
export { shouldAnimate, resolveTransition } from "./navigation.js";
