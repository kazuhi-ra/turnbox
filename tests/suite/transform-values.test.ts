import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { TurnBoxTestAdapter } from "./adapter.js";
import { sharedAdapters, modernAdapters } from "../adapters/index.js";

describe.each(sharedAdapters)("%s — transform values", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── axis:X face positions ────────────────────────────────────────────────────

  describe("axis:X — positions at currentFace1", () => {
    it("face1 is at front: rotateX(0deg) translate3d(0,0,0)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(adapter.getFaceState(1).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 is at top: rotateX(90deg) translate3d(0, -25px, 25px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(adapter.getFaceState(2).transform).toBe("rotateX(90deg) translate3d(0px, -25px, 25px)");
    });

    it("face3 is at back: rotateX(180deg) translate3d(0, 0, 50px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(adapter.getFaceState(3).transform).toBe("rotateX(180deg) translate3d(0px, 0px, 50px)");
    });

    it("face4 is at bottom: rotateX(270deg) translate3d(0, 25px, 25px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(adapter.getFaceState(4).transform).toBe("rotateX(270deg) translate3d(0px, 25px, 25px)");
    });
  });

  describe("axis:X — positions at currentFace2", () => {
    it("face2 is at front; face1 exited to bottom", async () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getFaceState(2).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
      expect(adapter.getFaceState(1).transform).toBe("rotateX(-90deg) translate3d(0px, 25px, 25px)");
    });

    it("face3 is at top when at face2", async () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getFaceState(3).transform).toBe("rotateX(90deg) translate3d(0px, -25px, 25px)");
    });
  });

  // ── axis:Y face positions ────────────────────────────────────────────────────

  describe("axis:Y — positions at currentFace1", () => {
    it("face1 is at front: rotateY(0deg) translate3d(0,0,0)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(adapter.getFaceState(1).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 is at right: rotateY(90deg) translate3d(100px, 0, 100px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(adapter.getFaceState(2).transform).toBe("rotateY(90deg) translate3d(100px, 0px, 100px)");
    });

    it("face3 is at back: rotateY(180deg) translate3d(0, 0, 200px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(adapter.getFaceState(3).transform).toBe("rotateY(180deg) translate3d(0px, 0px, 200px)");
    });

    it("face4 is at left: rotateY(270deg) translate3d(100px, 0, 100px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(adapter.getFaceState(4).transform).toBe("rotateY(270deg) translate3d(100px, 0px, 100px)");
    });
  });

  describe("axis:Y — positions at currentFace2", () => {
    it("face2 is at front; face1 exited to left", async () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getFaceState(2).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
      expect(adapter.getFaceState(1).transform).toBe("rotateY(-90deg) translate3d(-100px, 0px, 100px)");
    });
  });

  // ── direction:negative ───────────────────────────────────────────────────────

  describe("direction:negative — axis:X at currentFace1", () => {
    it("face1 stays at front (0deg unchanged)", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "X",
        direction: "negative",
      });
      expect(adapter.getFaceState(1).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 is at -90deg (opposite rotation from positive)", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "X",
        direction: "negative",
      });
      expect(adapter.getFaceState(2).transform).toBe("rotateX(-90deg) translate3d(0px, 25px, 25px)");
    });

    it("face4 is at -270deg", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "X",
        direction: "negative",
      });
      expect(adapter.getFaceState(4).transform).toBe("rotateX(-270deg) translate3d(0px, -25px, 25px)");
    });
  });

  describe("direction:negative — axis:Y at currentFace1", () => {
    it("face2 is at -90deg with negative x translate (opposite of positive)", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "Y",
        direction: "negative",
      });
      expect(adapter.getFaceState(2).transform).toBe("rotateY(-90deg) translate3d(-100px, 0px, 100px)");
    });

    it("face3 is at -180deg: z-only translate unchanged from positive direction", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "Y",
        direction: "negative",
      });
      expect(adapter.getFaceState(3).transform).toBe("rotateY(-180deg) translate3d(0px, 0px, 200px)");
    });

    it("face4 is at -270deg with negative x translate", () => {
      adapter = createAdapter({
        faces: 4,
        width: 200,
        height: 50,
        axis: "Y",
        direction: "negative",
      });
      expect(adapter.getFaceState(4).transform).toBe("rotateY(-270deg) translate3d(-100px, 0px, 100px)");
    });
  });

  // ── type:repeat — face4 mirrors face2, face3 mirrors face1 ──────────────────

  describe("type:repeat — positions at currentFace1 (axis:X)", () => {
    it("face4 is at 90deg (same as face2, NOT 270deg like type:real)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "repeat" });
      expect(adapter.getFaceState(4).transform).toBe("rotateX(90deg) translate3d(0px, -25px, 25px)");
    });

    it("face2 and face4 share the same position (repeat pattern)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "repeat" });
      expect(adapter.getFaceState(2).transform).toBe(adapter.getFaceState(4).transform);
    });

    it("face1 and face3 positions are unaffected", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "repeat" });
      expect(adapter.getFaceState(1).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
      expect(adapter.getFaceState(3).transform).toBe("rotateX(180deg) translate3d(0px, 0px, 50px)");
    });
  });

  describe("type:repeat — positions at currentFace2 (axis:X)", () => {
    it("face3 is at -90deg (same as face1, NOT 90deg like type:real)", async () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "repeat" });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getFaceState(3).transform).toBe("rotateX(-90deg) translate3d(0px, 25px, 25px)");
    });

    it("face1 and face3 share the same position at currentFace2", async () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "repeat" });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getFaceState(1).transform).toBe(adapter.getFaceState(3).transform);
    });
  });

  // ── type:skip — no face ever at 180°, all hidden faces at ±90° ──────────────

  describe("type:skip — positions at currentFace1 (axis:X)", () => {
    it("face3 is at 90deg (NOT 180deg like type:real)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "skip" });
      expect(adapter.getFaceState(3).transform).toBe("rotateX(90deg) translate3d(0px, -25px, 25px)");
    });

    it("face4 is at -90deg (NOT 270deg like type:real)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "skip" });
      expect(adapter.getFaceState(4).transform).toBe("rotateX(-90deg) translate3d(0px, 25px, 25px)");
    });

    it("no hidden face is at 180deg (skip means no passing through the back)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "skip" });
      for (const faceNum of [2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transform).not.toContain("180deg");
      }
    });

    it("face2 and face3 are at the same position (both top)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, axis: "X", type: "skip" });
      expect(adapter.getFaceState(2).transform).toBe(adapter.getFaceState(3).transform);
    });
  });

  // ── even option (fixed=false) — variable translate3d values ──────────────────

  describe("even option — variable translate3d (axis:X, height=50, even=30)", () => {
    it("face1 at currentFace1 stays at origin", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, even: 30, axis: "X" });
      expect(adapter.getFaceState(1).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 uses even-based translate3d: rotateX(90deg) translate3d(0, 0, 30px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, even: 30, axis: "X" });
      expect(adapter.getFaceState(2).transform).toBe("rotateX(90deg) translate3d(0px, 0px, 30px)");
    });
  });

  describe("even option — variable translate3d (axis:Y, width=200, even=30)", () => {
    it("face1 at currentFace1 stays at origin", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, even: 30, axis: "Y" });
      expect(adapter.getFaceState(1).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 uses even-based translate3d: rotateY(90deg) translate3d(30px, 0, 170px)", () => {
      adapter = createAdapter({ faces: 4, width: 200, height: 50, even: 30, axis: "Y" });
      // axis:Y variable path (face num=2 even, deg=90): x=even, z=-(even-length)=170 — contrast with axis:X where x=0, z=even
      expect(adapter.getFaceState(2).transform).toBe("rotateY(90deg) translate3d(30px, 0px, 170px)");
    });
  });
});

// ── impl: DOM / React / Vue — transformOrigin (variable geometry) ─────────────
// jQuery sets transform-origin via CSS class rules (not inline style),
// so this only applies to impl adapters.

// ──────────────────────────────────────────────────────────────────────────────
// Variable geometry face positions
// Each test verifies the 3D transform that places a face at its waiting position.
// The key invariant: adjacent faces must share an edge in 3D space.
//
// At currentFace=2 (axis:X, height=200, even=120):
//   Face 2 (even, 120px) is at front. Top edge at Y=0, Z=0.
//   Face 3 (odd, 200px) is above (deg=90). Bottom edge (Y=200 in element)
//   must also land at Y=0, Z=0 — verified by the geometry of the transform.
//
// Derivation for face3 at currentFace=2:
//   deg=90, faceOdd → translate3d(0, even-height, even) = (0, -80, 120)
//   With transform-origin "50% 120px", element Y=200 maps to world (0,0,0). ✓
//
// At currentFace=3, face2 (even, deg=-90):
//   translate3d(0, even, -(even-height)) = (0, 120, 80)
//   Element Y=0 (top edge) maps to world (0, 200, 0) = face3 bottom. ✓
// ──────────────────────────────────────────────────────────────────────────────

describe.each(modernAdapters)("%s — variable geometry face positions (axis:X)", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter?.destroy();
    vi.useRealTimers();
  });

  describe("currentFace=1: face2 waiting at top", () => {
    it("face1 is at front: rotateX(0deg) translate3d(0,0,0)", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getFaceState(1).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 (even) at top: rotateX(90deg) translate3d(0, 0, 120)", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getFaceState(2).transform).toBe("rotateX(90deg) translate3d(0px, 0px, 120px)");
    });
  });

  describe("currentFace=2: face3 waiting at top — edge alignment", () => {
    it("face2 (even) at front: rotateX(0deg) translate3d(0,0,0)", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      expect(adapter.getFaceState(2).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face3 (odd) at top: rotateX(90deg) translate3d(0, -80, 120) — bottom edge at Y=0,Z=0", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      expect(adapter.getFaceState(3).transform).toBe("rotateX(90deg) translate3d(0px, -80px, 120px)");
    });
  });

  describe("currentFace=3: face2 folded to bottom — edge alignment", () => {
    it("face3 (odd) at front: rotateX(0deg) translate3d(0,0,0)", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(3, false);
      await adapter.advanceTime(25);
      expect(adapter.getFaceState(3).transform).toBe("rotateX(0deg) translate3d(0px, 0px, 0px)");
    });

    it("face2 (even) folded below: rotateX(-90deg) translate3d(0, 120, 80) — top edge at Y=200,Z=0", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(3, false);
      await adapter.advanceTime(25);
      expect(adapter.getFaceState(2).transform).toBe("rotateX(-90deg) translate3d(0px, 120px, 80px)");
    });
  });
});

// ── variable geometry: transform-origin ──────────────────────────────────────
// Verifies that transformOrigin is computed correctly from the even value,
// and remains locked to the pivot edge during hasAdjust transitions.

describe.each(modernAdapters)("%s — variable geometry: transform-origin", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter?.destroy();
    vi.useRealTimers();
  });

  describe("axis:X, even=120, height=200 (variable geometry)", () => {
    it("all faces have transformOrigin '50% 120px' at init", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      for (const faceNum of [1, 2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 120px");
      }
    });

    it("transformOrigin is still '50% 120px' after navigation", async () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      adapter.next();
      await adapter.advanceTime(300);
      for (const faceNum of [1, 2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 120px");
      }
    });
  });

  describe("axis:Y, even=120, width=200 (variable geometry)", () => {
    it("all faces have transformOrigin '120px 50%' at init", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      for (const faceNum of [1, 2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transformOrigin).toBe("120px 50%");
      }
    });
  });

  describe("fixed geometry (even === height)", () => {
    it("transformOrigin is '50% 50%' when even equals height (axis:X)", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 200 });
      expect(adapter.getFaceState(1).transformOrigin).toBe("50% 50%");
    });

    it("transformOrigin is '50% 50%' when even equals width (axis:Y)", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 200 });
      expect(adapter.getFaceState(1).transformOrigin).toBe("50% 50%");
    });
  });

  // When hasAdjust=true, the transition animates adjust(from) → adjust(target),
  // both computed with '50% 0px' origin. Regular transforms are applied only in
  // the cleanup after animation ends.

  describe("during variable-geometry animation: transformOrigin is pivot-edge-locked (axis:X)", () => {
    it("face2→face3: at transition start, transformOrigin is '50% 0px'", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      // Navigate to face 2 first; wait for isAnimating to clear (ADJUST_TIME + time = 20 + 200)
      adapter.goTo(2, false);
      await adapter.advanceTime(250);
      // face 2 → face 3: hasAdjust=true
      adapter.next();
      await adapter.advanceTime(25); // just past ADJUST_TIME=20ms
      for (const faceNum of [1, 2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 0px");
      }
    });

    it("face3→face2: at transition start, transformOrigin is '50% 0px'", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(3, false);
      await adapter.advanceTime(250);
      // face 3 → face 2: hasAdjust=true
      adapter.prev();
      await adapter.advanceTime(25);
      for (const faceNum of [1, 2, 3, 4]) {
        expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 0px");
      }
    });
  });
});

// ── variable geometry: face dimensions ───────────────────────────────────────
// Even-numbered faces (2, 4) must be shorter/narrower than odd faces (1, 3).
// This ensures faces connect at the correct 3D edge without Z-overflow ghosting.

describe.each(modernAdapters)("%s — variable geometry: face dimensions", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter?.destroy();
    vi.useRealTimers();
  });

  describe("axis:X variable geometry — face heights", () => {
    it("even face 2 has height = even px", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getFaceState(2).inlineHeight).toBe("120px");
    });

    it("even face 4 has height = even px", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getFaceState(4).inlineHeight).toBe("120px");
    });

    it("odd faces (1, 3) have height = height px in variable geometry", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getFaceState(1).inlineHeight).toBe("200px");
      expect(adapter.getFaceState(3).inlineHeight).toBe("200px");
    });

    it("fixed geometry (even===height): library does not set face height", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 200 });
      expect(adapter.getFaceState(2).inlineHeight).toBe("");
    });
  });

  describe("axis:Y variable geometry — face widths", () => {
    it("even face 2 has width = even px", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      expect(adapter.getFaceState(2).inlineWidth).toBe("120px");
    });

    it("even face 4 has width = even px", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      expect(adapter.getFaceState(4).inlineWidth).toBe("120px");
    });

    it("odd faces (1, 3) have width = width px in variable geometry", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      expect(adapter.getFaceState(1).inlineWidth).toBe("200px");
      expect(adapter.getFaceState(3).inlineWidth).toBe("200px");
    });
  });
});

// ── variable geometry: container ──────────────────────────────────────────────
// The container height (axis:X) or left (axis:Y) changes based on the current
// face to keep the perspective origin aligned with the visible face.
// This change is animated via a CSS transition alongside face rotations.

describe.each(modernAdapters)("%s — variable geometry: container", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter?.destroy();
    vi.useRealTimers();
  });

  describe("axis:X — container transition during animation", () => {
    it("container has height transition while animating (doAnimate=true)", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(2, true);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineTransition).toContain("height");
    });

    it("container transition is cleared after animation completes", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(2, true);
      await adapter.advanceTime(300);
      expect(adapter.getContainerState().inlineTransition).toBe("");
    });

    it("container does NOT get transition when doAnimate=false", async () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineTransition).toBe("");
    });

    it("fixed geometry: container does not get transition", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 200,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(2, true);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineTransition).toBe("");
    });
  });

  describe("axis:Y — container transition during animation", () => {
    it("container has left transition while animating (doAnimate=true)", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "Y",
        width: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(2, true);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineTransition).toContain("left");
    });

    it("container transition is cleared after animation completes", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "Y",
        width: 200,
        even: 120,
        duration: 200,
        delay: 0,
      });
      adapter.goTo(2, true);
      await adapter.advanceTime(300);
      expect(adapter.getContainerState().inlineTransition).toBe("");
    });
  });

  describe("axis:X — container height", () => {
    it("init (face 1, odd): container height = height px", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      expect(adapter.getContainerState().inlineHeight).toBe("200px");
    });

    it("after goTo(2): container height = even px", async () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineHeight).toBe("120px");
    });

    it("after goTo(2) then goTo(3): container height restores to height px", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "X",
        height: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      adapter.goTo(3, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineHeight).toBe("200px");
    });

    it("after goTo(4): container height = even px", async () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120 });
      adapter.goTo(4, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineHeight).toBe("120px");
    });

    it("fixed geometry: container height is not set by library", () => {
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 200 });
      expect(adapter.getContainerState().inlineHeight).toBe("");
    });
  });

  describe("axis:Y — container left", () => {
    it("init (face 1, odd): container left = 0px", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      expect(adapter.getContainerState().inlineLeft).toBe("0px");
    });

    it("after goTo(2): container left = (width - even)/2 px", async () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 120 });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineLeft).toBe("40px");
    });

    it("after goTo(2) then goTo(3): container left restores to 0px", async () => {
      adapter = createAdapter({
        faces: 4,
        axis: "Y",
        width: 200,
        even: 120,
        duration: 0,
        delay: 0,
      });
      adapter.goTo(2, false);
      await adapter.advanceTime(25);
      adapter.goTo(3, false);
      await adapter.advanceTime(25);
      expect(adapter.getContainerState().inlineLeft).toBe("0px");
    });

    it("fixed geometry: container left is not set by library", () => {
      adapter = createAdapter({ faces: 4, axis: "Y", width: 200, even: 200 });
      expect(adapter.getContainerState().inlineLeft).toBe("");
    });
  });
});
