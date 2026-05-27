import { describe, it, expect } from "vitest";
import {
  reducer,
  toPhase,
  INITIAL_STATE,
  buildGoStepAction,
  buildGoInstantAction,
} from "@kazuhi-ra/turnbox-core/internal";
import type { TurnBoxState } from "@kazuhi-ra/turnbox-core/internal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const atFace2 = (): TurnBoxState => reducer(INITIAL_STATE, buildGoInstantAction(2, 1));

const settlingState = (): TurnBoxState => atFace2(); // kind:"settling"

const animatingState = (): TurnBoxState => reducer(INITIAL_STATE, buildGoStepAction(3, 2));

const idleAtFace2 = (): TurnBoxState => reducer(settlingState(), { type: "SETTLE" });

// ─── GO_STEP / "animating" state ─────────────────────────────────────────────

describe("GO_STEP / animating state", () => {
  it("kind is 'animating'", () => {
    expect(animatingState().kind).toBe("animating");
  });

  it("displayFace is the target face", () => {
    expect(animatingState().displayFace).toBe(3);
  });

  it("from is the origin face", () => {
    const s = animatingState();
    expect(s.kind === "animating" && s.from).toBe(2);
  });

  it("shownFaces includes both from and target faces", () => {
    expect(animatingState().shownFaces.has(2)).toBe(true);
    expect(animatingState().shownFaces.has(3)).toBe(true);
  });

  it("shownFaces has exactly two faces", () => {
    expect(animatingState().shownFaces.size).toBe(2);
  });

  it("queue starts empty", () => {
    const s = animatingState();
    expect(s.kind === "animating" && s.queue.length).toBe(0);
  });
});

// ─── GO_INSTANT / "settling" state ───────────────────────────────────────────

describe("GO_INSTANT / settling state", () => {
  it("kind is 'settling'", () => {
    expect(settlingState().kind).toBe("settling");
  });

  it("displayFace is the target face", () => {
    expect(settlingState().displayFace).toBe(2);
  });

  it("from is the origin face", () => {
    const s = settlingState();
    expect(s.kind === "settling" && s.from).toBe(1);
  });

  it("shownFaces contains only the target face", () => {
    expect(settlingState().shownFaces.has(2)).toBe(true);
    expect(settlingState().shownFaces.size).toBe(1);
  });

  it("queue starts empty", () => {
    const s = settlingState();
    expect(s.kind === "settling" && s.queue.length).toBe(0);
  });
});

// ─── SETTLE ───────────────────────────────────────────────────────────────────

describe("SETTLE", () => {
  it("transitions settling → idle", () => {
    const s = reducer(settlingState(), { type: "SETTLE" });
    expect(s.kind).toBe("idle");
    expect(s.displayFace).toBe(2);
    expect(s.shownFaces.size).toBe(1);
    expect(s.shownFaces.has(2)).toBe(true);
  });

  it("is a no-op when not settling", () => {
    const s = reducer(INITIAL_STATE, { type: "SETTLE" });
    expect(s).toBe(INITIAL_STATE);
  });
});

// ─── ENQUEUE ──────────────────────────────────────────────────────────────────

describe("ENQUEUE", () => {
  it("appends a pending nav to animating queue", () => {
    const s = reducer(animatingState(), { type: "ENQUEUE", nav: { face: 4, animation: true } });
    expect(s.kind === "animating" && s.queue).toEqual([{ face: 4, animation: true }]);
  });

  it("appends a pending nav to settling queue", () => {
    const s = reducer(settlingState(), { type: "ENQUEUE", nav: { face: 3, animation: false } });
    expect(s.kind === "settling" && s.queue).toEqual([{ face: 3, animation: false }]);
  });

  it("is a no-op when idle", () => {
    const s = reducer(INITIAL_STATE, { type: "ENQUEUE", nav: { face: 2, animation: true } });
    expect(s).toBe(INITIAL_STATE);
  });
});

// ─── ABORT ────────────────────────────────────────────────────────────────────

describe("ABORT", () => {
  it("transitions animating → idle and sets displayFace", () => {
    const s = reducer(animatingState(), { type: "ABORT", displayFace: 2 });
    expect(s.kind).toBe("idle");
    expect(s.displayFace).toBe(2);
    expect(s.shownFaces.size).toBe(1);
    expect(s.shownFaces.has(2)).toBe(true);
  });

  it("transitions settling → idle", () => {
    const s = reducer(settlingState(), { type: "ABORT", displayFace: 1 });
    expect(s.kind).toBe("idle");
    expect(s.displayFace).toBe(1);
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
  it("animated: target face visible during animating, isolated after complete", () => {
    const s0 = idleAtFace2(); // idle, shownFaces: {2}

    const s1 = reducer(s0, buildGoStepAction(3, 2));
    expect(s1.shownFaces.has(3)).toBe(true); // target visible
    expect(s1.shownFaces.has(2)).toBe(true); // from face also visible during transition

    const s2 = reducer(s1, { type: "COMPLETE", displayFace: 3 });
    expect(s2.shownFaces.size).toBe(1);
    expect(s2.shownFaces.has(3)).toBe(true);
    expect(s2.shownFaces.has(2)).toBe(false);
  });

  it("instant: only target face shown during settling, same after settle", () => {
    const s0 = idleAtFace2();

    const s1 = reducer(s0, buildGoInstantAction(4, 2));
    expect(s1.kind).toBe("settling");
    expect(s1.shownFaces.size).toBe(1); // only target face shown
    expect(s1.shownFaces.has(4)).toBe(true);
    expect(s1.shownFaces.has(2)).toBe(false);

    const s2 = reducer(s1, { type: "SETTLE" });
    expect(s2.kind).toBe("idle");
    expect(s2.shownFaces.size).toBe(1);
    expect(s2.shownFaces.has(4)).toBe(true);
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

  it("settling → { kind: 'idle' } (no CSS transition for instant)", () => {
    expect(toPhase(settlingState())).toEqual({ kind: "idle" });
  });

  it("animating → { kind: 'animating' }", () => {
    expect(toPhase(animatingState())).toEqual({ kind: "animating" });
  });
});
