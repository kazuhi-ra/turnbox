import { describe, it, expect } from "vitest";
import { normalizeOptions } from "@kazuhi-ra/turnbox-core";
import {
  INITIAL_STATE,
  reducer,
  buildGoStepAction,
  buildGoInstantAction,
  resolveNavigation,
  buildDrainResult,
} from "@kazuhi-ra/turnbox-core/internal";
import type { TurnBoxState } from "@kazuhi-ra/turnbox-core/internal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const opts = normalizeOptions({ faces: 4 });

const idleAtFace1 = (): TurnBoxState => INITIAL_STATE;

const idleAtFace2 = (): TurnBoxState => {
  // instant nav → "settling" (timer pending); SETTLE completes it to idle
  const settling = reducer(INITIAL_STATE, buildGoInstantAction(2, 1));
  return reducer(settling, { type: "SETTLE" });
};

// animating face1 → face2 (from=1, displayFace=2)
const animating1to2 = (): TurnBoxState => reducer(INITIAL_STATE, buildGoStepAction(2, 1));

// settling at face2 (from=1, displayFace=2)
const settling1to2 = (): TurnBoxState => reducer(INITIAL_STATE, buildGoInstantAction(2, 1));

// ─── resolveNavigation ────────────────────────────────────────────────────────

describe("resolveNavigation — idle state", () => {
  it("returns noop when target equals current face", () => {
    expect(resolveNavigation(idleAtFace1(), 1, opts, true)).toEqual({ kind: "noop" });
  });

  it("returns go with correct from/to/doAnimate for animated nav", () => {
    expect(resolveNavigation(idleAtFace1(), 2, opts, true)).toEqual({
      kind: "go",
      from: 1,
      to: 2,
      doAnimate: true,
    });
  });

  it("returns go with doAnimate:false for instant nav", () => {
    expect(resolveNavigation(idleAtFace2(), 3, opts, false)).toEqual({
      kind: "go",
      from: 2,
      to: 3,
      doAnimate: false,
    });
  });
});

describe("resolveNavigation — animating state", () => {
  it("returns enqueue when target is a new face (not reversing)", () => {
    // animating 1→2; goTo(3) should enqueue
    const result = resolveNavigation(animating1to2(), 3, opts, true);
    expect(result).toEqual({ kind: "enqueue", nav: { face: 3, animation: true } });
  });

  it("returns noop when target equals current displayFace (already going there)", () => {
    // animating 1→2; goTo(2) is a noop
    expect(resolveNavigation(animating1to2(), 2, opts, true)).toEqual({ kind: "noop" });
  });

  it("returns abort when reversing (target === from face)", () => {
    // animating 1→2; goTo(1) is a reverse — isImmediate because to === state.from
    expect(resolveNavigation(animating1to2(), 1, opts, true)).toEqual({ kind: "abort" });
  });

  it("returns abort when animation=false regardless of target", () => {
    // !animation makes isImmediate true unconditionally
    expect(resolveNavigation(animating1to2(), 3, opts, false)).toEqual({ kind: "abort" });
  });
});

describe("resolveNavigation — settling state", () => {
  it("returns enqueue when target is a new face", () => {
    const result = resolveNavigation(settling1to2(), 3, opts, true);
    expect(result).toEqual({ kind: "enqueue", nav: { face: 3, animation: true } });
  });

  it("returns abort when animation=false", () => {
    expect(resolveNavigation(settling1to2(), 3, opts, false)).toEqual({ kind: "abort" });
  });

  it("returns noop when target equals current displayFace", () => {
    expect(resolveNavigation(settling1to2(), 2, opts, true)).toEqual({ kind: "noop" });
  });
});

// ─── buildDrainResult ─────────────────────────────────────────────────────────

describe("buildDrainResult", () => {
  it("returns empty for an empty queue", () => {
    expect(buildDrainResult(1, [], opts)).toEqual({ kind: "empty" });
  });

  it("returns navigate with the first valid item", () => {
    const queue = [{ face: 2, animation: true }];
    expect(buildDrainResult(1, queue, opts)).toEqual({
      kind: "navigate",
      nav: { face: 2, animation: true },
      enqueue: [],
    });
  });

  it("returns remaining items in enqueue", () => {
    const queue = [
      { face: 2, animation: true },
      { face: 3, animation: true },
      { face: 4, animation: false },
    ];
    expect(buildDrainResult(1, queue, opts)).toEqual({
      kind: "navigate",
      nav: { face: 2, animation: true },
      enqueue: [
        { face: 3, animation: true },
        { face: 4, animation: false },
      ],
    });
  });

  it("skips noop items and picks the first valid one", () => {
    // from face 1; goTo(1) is noop, goTo(2) is valid
    const queue = [
      { face: 1, animation: true },
      { face: 2, animation: true },
    ];
    const result = buildDrainResult(1, queue, opts);
    expect(result).toEqual({
      kind: "navigate",
      nav: { face: 2, animation: true },
      enqueue: [],
    });
  });

  it("returns empty when all items are noops", () => {
    const queue = [
      { face: 1, animation: true },
      { face: 1, animation: false },
    ];
    expect(buildDrainResult(1, queue, opts)).toEqual({ kind: "empty" });
  });

  it("does not mutate the input queue", () => {
    const queue = [
      { face: 2, animation: true },
      { face: 3, animation: true },
    ];
    const original = [...queue];
    buildDrainResult(1, queue, opts);
    expect(queue).toEqual(original);
  });
});
