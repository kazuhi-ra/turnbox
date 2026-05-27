import type { AnimationPhase } from "./context.js";

// ─── State types ──────────────────────────────────────────────────────────────

export type IdleState = {
  kind: "idle";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
};

export type AnimatingState = {
  kind: "animating";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
};

export type TurnBoxState = IdleState | AnimatingState;

// ─── Action types ─────────────────────────────────────────────────────────────

export type TurnBoxAction =
  | { type: "GO_STEP"; to: number; shownFaces: ReadonlySet<number> }
  | { type: "GO_INSTANT"; displayFace: number }
  | { type: "COMPLETE"; displayFace: number };

// ─── Reducer ──────────────────────────────────────────────────────────────────

export const INITIAL_STATE: TurnBoxState = {
  kind: "idle",
  displayFace: 1,
  shownFaces: new Set([1]),
};

export const reducer = (_state: TurnBoxState, action: TurnBoxAction): TurnBoxState => {
  switch (action.type) {
    case "GO_STEP":
      return {
        kind: "animating",
        displayFace: action.to,
        shownFaces: action.shownFaces,
      };
    case "GO_INSTANT":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
      };
    case "COMPLETE":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
      };
  }
};

// ─── Action builders ──────────────────────────────────────────────────────────

export const buildGoInstantAction = (displayFace: number): TurnBoxAction => ({
  type: "GO_INSTANT",
  displayFace,
});

export const buildGoStepAction = (to: number, currentFace: number): TurnBoxAction => ({
  type: "GO_STEP",
  to,
  shownFaces: new Set([currentFace, to]),
});

// ─── Derive AnimationPhase from state ─────────────────────────────────────────

export const toPhase = (state: TurnBoxState): AnimationPhase => {
  switch (state.kind) {
    case "idle":
      return { kind: "idle" };
    case "animating":
      return { kind: "animating" };
  }
};
