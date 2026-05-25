import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "./adapter.js";

export const transformValuesSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — transform values", (_, createAdapter) => {
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
};
