import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

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

export const variableGeometrySuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — variable geometry face positions (axis:X)", (_, createAdapter) => {
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

  describe.each(adapters)("%s — variable geometry: transform-origin", (_, createAdapter) => {
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

    describe("during variable-geometry animation: transformOrigin uses even-edge pivot (axis:X)", () => {
      it("face2→face3: at transition start, transformOrigin is '50% 120px'", async () => {
        adapter = createAdapter({
          faces: 4,
          axis: "X",
          height: 200,
          even: 120,
          duration: 200,
          delay: 0,
        });
        adapter.goTo(2, false);
        await adapter.advanceTime(250);
        adapter.next();
        await adapter.advanceTime(25);
        for (const faceNum of [1, 2, 3, 4]) {
          expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 120px");
        }
      });

      it("face3→face2: at transition start, transformOrigin is '50% 120px'", async () => {
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
        adapter.prev();
        await adapter.advanceTime(25);
        for (const faceNum of [1, 2, 3, 4]) {
          expect(adapter.getFaceState(faceNum).transformOrigin).toBe("50% 120px");
        }
      });
    });
  });

  // ── variable geometry: face dimensions ───────────────────────────────────────
  // Even-numbered faces (2, 4) must be shorter/narrower than odd faces (1, 3).
  // This ensures faces connect at the correct 3D edge without Z-overflow ghosting.

  describe.each(adapters)("%s — variable geometry: face dimensions", (_, createAdapter) => {
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

  describe.each(adapters)("%s — variable geometry: container", (_, createAdapter) => {
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

  // ── variable geometry: queue-drained hasAdjust ────────────────────────────────
  // When a hasAdjust animation is triggered from the queue drain, it must complete
  // correctly with the destination face visible and the source face hidden.
  // The double-RAF structure ensures CSS transition "before-change style" is
  // established even for queue-drained calls (no startDelay shortcut).

  describe.each(adapters)("%s — variable geometry: queue-drained hasAdjust completion", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter?.destroy();
      vi.useRealTimers();
    });

    it("face2→face3 (hasAdjust) queue-drained: face3 shown, face2 hidden, not animating", async () => {
      // face1→face2 completes → drainQueue fires face2→face3 (hasAdjust pair)
      // Two-phase advance: first phase lets face1→face2 complete and framework effects register
      // the hasAdjust cleanup timer; second phase fires that cleanup timer.
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120, duration: 200, delay: 0 });
      adapter.next(); // face1→face2 (non-hasAdjust)
      await adapter.advanceTime(10);
      adapter.next(); // queue face2→face3 (hasAdjust)
      await adapter.advanceTime(250); // face1→face2 completes; hasAdjust cleanup timer registered
      await adapter.advanceTime(300); // hasAdjust cleanup timer fires
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
      expect(adapter.isAnimating()).toBe(false);
    });

    it("face3→face2 (hasAdjust) queue-drained: face2 shown, face3 hidden, not animating", async () => {
      // face4→face3 completes → drainQueue fires face3→face2 (hasAdjust pair)
      adapter = createAdapter({ faces: 4, axis: "X", height: 200, even: 120, duration: 200, delay: 0 });
      adapter.goTo(4, false);
      await adapter.advanceTime(250); // settle at face4
      adapter.prev(); // face4→face3 (non-hasAdjust)
      await adapter.advanceTime(10);
      adapter.prev(); // queue face3→face2 (hasAdjust)
      await adapter.advanceTime(250); // face4→face3 completes; hasAdjust cleanup timer registered
      await adapter.advanceTime(300); // hasAdjust cleanup timer fires
      expect(adapter.getCurrentFace()).toBe(2);
      expect(adapter.isFaceShown(2)).toBe(true);
      expect(adapter.isFaceShown(3)).toBe(false);
      expect(adapter.isAnimating()).toBe(false);
    });
  });
};
