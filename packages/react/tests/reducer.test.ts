import { describe, it, expect } from "vitest";
import { reducer, toPhase, INITIAL_STATE, buildGoStepAction, buildGoInstantAction } from "../src/TurnBox/reducer.js";
import type { TurnBoxState } from "../src/TurnBox/reducer.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const atFace2 = (): TurnBoxState => reducer(INITIAL_STATE, buildGoInstantAction(2));

const animatingState = (): TurnBoxState => reducer(atFace2(), buildGoStepAction(3, 2));

// ─── GO_STEP / "animating" state ─────────────────────────────────────────────

describe("GO_STEP / animating state", () => {
  it("kind is 'animating'", () => {
    expect(animatingState().kind).toBe("animating");
  });

  it("displayFace is the target face", () => {
    expect(animatingState().displayFace).toBe(3);
  });

  it("shownFaces includes both from and target faces", () => {
    expect(animatingState().shownFaces.has(2)).toBe(true);
    expect(animatingState().shownFaces.has(3)).toBe(true);
  });

  it("shownFaces has exactly two faces", () => {
    expect(animatingState().shownFaces.size).toBe(2);
  });
});

// ─── GO_INSTANT / idle state ──────────────────────────────────────────────────

describe("GO_INSTANT / idle state", () => {
  it("kind is 'idle'", () => {
    const state = reducer(INITIAL_STATE, buildGoInstantAction(3));
    expect(state.kind).toBe("idle");
  });

  it("shownFaces contains only the target face", () => {
    const state = reducer(INITIAL_STATE, buildGoInstantAction(3));
    expect(state.shownFaces.has(3)).toBe(true);
    expect(state.shownFaces.size).toBe(1);
  });

  it("does not leak faces from a prior animating state", () => {
    // animating has shownFaces = {2, 3}; GO_INSTANT must clear that
    const state = reducer(animatingState(), buildGoInstantAction(4));
    expect(state.shownFaces.size).toBe(1);
    expect(state.shownFaces.has(4)).toBe(true);
  });
});

// ─── COMPLETE / idle state ────────────────────────────────────────────────────

describe("COMPLETE reducer", () => {
  it("kind is 'idle'", () => {
    const state = reducer(animatingState(), { type: "COMPLETE", displayFace: 3 });
    expect(state.kind).toBe("idle");
  });

  it("shownFaces contains only the completed face", () => {
    const state = reducer(animatingState(), { type: "COMPLETE", displayFace: 3 });
    expect(state.shownFaces.has(3)).toBe(true);
    expect(state.shownFaces.size).toBe(1);
  });

  it("does not leak the from-face after completion", () => {
    // animating state has shownFaces = {2, 3}; COMPLETE must drop face 2
    const animating = animatingState();
    expect(animating.shownFaces.has(2)).toBe(true); // precondition
    const state = reducer(animating, { type: "COMPLETE", displayFace: 3 });
    expect(state.shownFaces.has(2)).toBe(false);
  });
});

// ─── Full animate cycle ───────────────────────────────────────────────────────

describe("full animate cycle: shownFaces visibility invariants", () => {
  it("target face is visible during animating and isolated after complete", () => {
    const s0 = atFace2(); // idle, shownFaces: {2}

    const s1 = reducer(s0, buildGoStepAction(3, 2));
    expect(s1.shownFaces.has(3)).toBe(true); // target visible (transition started)
    expect(s1.shownFaces.has(2)).toBe(true); // from face also visible during transition

    const s2 = reducer(s1, { type: "COMPLETE", displayFace: 3 });
    expect(s2.shownFaces.size).toBe(1); // only target remains
    expect(s2.shownFaces.has(3)).toBe(true);
    expect(s2.shownFaces.has(2)).toBe(false); // from face cleaned up
  });
});

// ─── INITIAL_STATE ────────────────────────────────────────────────────────────

describe("INITIAL_STATE", () => {
  it("starts idle at face 1", () => {
    expect(INITIAL_STATE.kind).toBe("idle");
    expect(INITIAL_STATE.displayFace).toBe(1);
  });

  it("shownFaces contains only face 1", () => {
    expect(INITIAL_STATE.shownFaces.has(1)).toBe(true);
    expect(INITIAL_STATE.shownFaces.size).toBe(1);
  });
});

// ─── toPhase ──────────────────────────────────────────────────────────────────

describe("toPhase", () => {
  it("idle → { kind: 'idle' }", () => {
    expect(toPhase(INITIAL_STATE)).toEqual({ kind: "idle" });
  });

  it("animating → { kind: 'animating' }", () => {
    expect(toPhase(animatingState())).toEqual({ kind: "animating" });
  });
});
