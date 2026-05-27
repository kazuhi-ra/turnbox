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
export { getFaceParity } from "./transform.js";
export { shouldAnimate, resolveTransition } from "./navigation.js";
export type {
  AnimationPhase,
  PendingNav,
  IdleState,
  SettlingState,
  AnimatingState,
  TurnBoxState,
  TurnBoxAction,
} from "./state-machine.js";
export { INITIAL_STATE, reducer, toPhase, buildGoStepAction, buildGoInstantAction } from "./state-machine.js";
export type { NavigationDecision, DrainResult } from "./orchestration.js";
export { resolveNavigation, buildDrainResult } from "./orchestration.js";
