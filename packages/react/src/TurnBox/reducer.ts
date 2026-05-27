import type { AnimationPhase } from "./context.js";

// ─── State types ──────────────────────────────────────────────────────────────

export type PendingNav = { face: number; animation: boolean };

export type IdleState = {
  kind: "idle";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
};

// Instant transition in-flight — doAnimate:false, waiting for settle timer.
// Visually already at displayFace; timer fires to release isAnimating.
export type SettlingState = {
  kind: "settling";
  displayFace: number;
  from: number;
  shownFaces: ReadonlySet<number>;
  queue: PendingNav[];
};

export type AnimatingState = {
  kind: "animating";
  displayFace: number;
  from: number;
  shownFaces: ReadonlySet<number>;
  queue: PendingNav[];
};

export type TurnBoxState = IdleState | SettlingState | AnimatingState;

// ─── Action types ─────────────────────────────────────────────────────────────

export type TurnBoxAction =
  | { type: "GO_STEP"; to: number; from: number; shownFaces: ReadonlySet<number> }
  | { type: "GO_INSTANT"; displayFace: number; from: number }
  | { type: "COMPLETE"; displayFace: number }
  | { type: "SETTLE" }
  | { type: "ENQUEUE"; nav: PendingNav }
  | { type: "ABORT"; displayFace: number };

// ─── Reducer ──────────────────────────────────────────────────────────────────

export const INITIAL_STATE: TurnBoxState = {
  kind: "idle",
  displayFace: 1,
  shownFaces: new Set([1]),
};

export const reducer = (state: TurnBoxState, action: TurnBoxAction): TurnBoxState => {
  switch (action.type) {
    case "GO_STEP":
      return {
        kind: "animating",
        displayFace: action.to,
        from: action.from,
        shownFaces: action.shownFaces,
        // Preserve queue if transitioning from a non-idle state (e.g. abort → immediate re-go).
        // In the abort path, ABORT resets to idle first, so queue is always [] here.
        queue: state.kind !== "idle" ? [...state.queue] : [],
      };
    case "GO_INSTANT":
      return {
        kind: "settling",
        displayFace: action.displayFace,
        from: action.from,
        shownFaces: new Set([action.displayFace]),
        queue: [],
      };
    case "SETTLE":
      if (state.kind !== "settling") return state;
      return {
        kind: "idle",
        displayFace: state.displayFace,
        shownFaces: state.shownFaces,
      };
    case "COMPLETE":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
      };
    case "ENQUEUE":
      if (state.kind === "idle") return state;
      return { ...state, queue: [...state.queue, action.nav] };
    case "ABORT":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
      };
  }
};

// ─── Action builders ──────────────────────────────────────────────────────────

export const buildGoInstantAction = (displayFace: number, from: number): TurnBoxAction => ({
  type: "GO_INSTANT",
  displayFace,
  from,
});

export const buildGoStepAction = (to: number, from: number): TurnBoxAction => ({
  type: "GO_STEP",
  to,
  from,
  shownFaces: new Set([from, to]),
});

// ─── Derive AnimationPhase from state ─────────────────────────────────────────

export const toPhase = (state: TurnBoxState): AnimationPhase => {
  switch (state.kind) {
    case "idle":
    case "settling":
      return { kind: "idle" };
    case "animating":
      return { kind: "animating" };
  }
};
