import type { NormalizedOptions } from "@turnbox/core";
import { VIRTUAL_NEXT_WRAP } from "@turnbox/core/internal";
import type { AnimationPhase } from "./context.js";

// ─── State types ──────────────────────────────────────────────────────────────

export type IdleState = {
  kind: "idle";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

export type PrePositioningState = {
  kind: "pre-positioning";
  displayFace: number;
  via: 0 | 5;
  landAt: 1 | 4;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

export type AnimatingState = {
  kind: "animating";
  displayFace: number;
  landAt: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

export type AdjustingState = {
  kind: "adjusting";
  displayFace: number;
  to: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

export type AdjustAnimatingState = {
  kind: "adjust-animating";
  displayFace: number;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
};

export type TurnBoxState = IdleState | PrePositioningState | AnimatingState | AdjustingState | AdjustAnimatingState;

// ─── Action types ─────────────────────────────────────────────────────────────

export type TurnBoxAction =
  | { type: "GO_STEP"; to: number; shownFaces: ReadonlySet<number> }
  | { type: "GO_INSTANT"; displayFace: number }
  | {
      type: "GO_PRE_POSITIONING";
      displayFace: number;
      via: 0 | 5;
      landAt: 1 | 4;
      faceOverrides: ReadonlyMap<number, string>;
      shownFaces: ReadonlySet<number>;
    }
  | { type: "GO_ADJUSTING"; to: number; shownFaces: ReadonlySet<number> }
  | {
      type: "ENTER_ANIMATING";
      displayFace: number;
      landAt: number;
      shownFaces: ReadonlySet<number>;
      faceOverrides: ReadonlyMap<number, string>;
    }
  | { type: "ENTER_ADJUST_ANIMATING"; displayFace: number }
  | { type: "COMPLETE"; displayFace: number };

// ─── Reducer ──────────────────────────────────────────────────────────────────

export const EMPTY_MAP: ReadonlyMap<number, string> = new Map();

export const INITIAL_STATE: TurnBoxState = {
  kind: "idle",
  displayFace: 1,
  shownFaces: new Set([1]),
  faceOverrides: EMPTY_MAP,
};

export const reducer = (state: TurnBoxState, action: TurnBoxAction): TurnBoxState => {
  switch (action.type) {
    case "GO_STEP":
      return {
        kind: "animating",
        displayFace: action.to,
        landAt: action.to,
        shownFaces: action.shownFaces,
        faceOverrides: EMPTY_MAP,
      };
    case "GO_INSTANT":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
        faceOverrides: EMPTY_MAP,
      };
    case "GO_PRE_POSITIONING":
      return {
        kind: "pre-positioning",
        displayFace: action.displayFace,
        via: action.via,
        landAt: action.landAt,
        shownFaces: action.shownFaces,
        faceOverrides: action.faceOverrides,
      };
    case "GO_ADJUSTING":
      return {
        kind: "adjusting",
        displayFace: state.displayFace,
        to: action.to,
        shownFaces: action.shownFaces,
        faceOverrides: EMPTY_MAP,
      };
    case "ENTER_ANIMATING":
      return {
        kind: "animating",
        displayFace: action.displayFace,
        landAt: action.landAt,
        shownFaces: action.shownFaces,
        faceOverrides: action.faceOverrides,
      };
    case "ENTER_ADJUST_ANIMATING":
      return {
        kind: "adjust-animating",
        displayFace: action.displayFace,
        shownFaces: state.shownFaces,
        faceOverrides: state.faceOverrides,
      };
    case "COMPLETE":
      return {
        kind: "idle",
        displayFace: action.displayFace,
        shownFaces: new Set([action.displayFace]),
        faceOverrides: EMPTY_MAP,
      };
  }
};

// ─── Pre-position geometry ────────────────────────────────────────────────────

export const calcPrePositionTransform = (via: 0 | 5, opts: NormalizedOptions): string => {
  const { geometry, direction } = opts;
  const dirSign = direction === "negative" ? -1 : 1;
  const shortDeg = (via === VIRTUAL_NEXT_WRAP ? 90 : -90) * dirSign;
  const half = geometry.length / 2;
  const changeHalf = shortDeg < 0 ? -half : half;
  const [x, y, z]: [number, number, number] = geometry.axis === "Y" ? [changeHalf, 0, half] : [0, -changeHalf, half];
  return `rotate${geometry.axis}(${shortDeg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
};

// ─── Action builders ──────────────────────────────────────────────────────────

export const buildGoInstantAction = (displayFace: number): TurnBoxAction => ({
  type: "GO_INSTANT",
  displayFace,
});

export const buildGoPrePositioningAction = (
  via: 0 | 5,
  landAt: 1 | 4,
  currentFace: number,
  opts: NormalizedOptions,
): TurnBoxAction => {
  const incoming = via === VIRTUAL_NEXT_WRAP ? 1 : 4;
  return {
    type: "GO_PRE_POSITIONING",
    displayFace: currentFace,
    via,
    landAt,
    faceOverrides: new Map([[incoming, calcPrePositionTransform(via, opts)]]),
    shownFaces: new Set([currentFace, incoming]),
  };
};

export const buildGoAdjustingAction = (to: number, currentFace: number): TurnBoxAction => ({
  type: "GO_ADJUSTING",
  to,
  shownFaces: new Set([currentFace, to]),
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
    case "pre-positioning":
      return { kind: "pre-positioning", via: state.via, landAt: state.landAt };
    case "animating":
      return { kind: "animating" };
    case "adjusting":
      return { kind: "adjusting", to: state.to };
    case "adjust-animating":
      return { kind: "adjust-animating" };
  }
};
