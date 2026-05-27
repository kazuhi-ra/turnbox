// Re-exports from @kazuhi-ra/turnbox-core/internal — state machine now lives in core.
export type {
  AnimationPhase,
  PendingNav,
  IdleState,
  SettlingState,
  AnimatingState,
  TurnBoxState,
  TurnBoxAction,
} from "@kazuhi-ra/turnbox-core/internal";
export {
  INITIAL_STATE,
  reducer,
  toPhase,
  buildGoStepAction,
  buildGoInstantAction,
} from "@kazuhi-ra/turnbox-core/internal";
