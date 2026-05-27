import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

export const wrapAroundSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — wrap-around", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // type:real — bidirectional wrap

    describe("type:real — wrap (4-face only)", () => {
      it("next() from face 4 wraps to face 1", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(false);
      });

      it("round trip: prev() 1→4, next() 4→1", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
      });

      it("goTo(4) from face 1 animates (both faces shown mid-animation)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("goTo(1) from face 4 animates (both faces shown mid-animation)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.goTo(1, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
      });
    });

    // type:real — no-animation wrap via goTo

    describe("type:real — no-animation wrap via goTo (4-face only)", () => {
      it("goTo(4, false) from face 1 jumps to face 4 without animation", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4, false);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(false);
      });

      it("goTo(1, false) from face 4 jumps to face 1 without animation", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.goTo(1, false);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(false);
      });
    });

    // type:repeat — bidirectional wrap (4-face only)

    describe("type:repeat — wrap (4-face only)", () => {
      it("next() from face 4 wraps to face 1", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(false);
      });

      it("prev() from face 1 wraps to face 4", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(false);
      });

      it("round trip: next() 4→1, prev() 1→4", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("goTo(5, true) from face 4 wraps to face 1 with animation", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.goTo(5, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
      });

      it("goTo(0, true) from face 1 wraps to face 4 with animation", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(0, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("goTo(4) from face 1 animates (both faces shown mid-animation)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("goTo(1) from face 4 animates (both faces shown mid-animation)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.goTo(1, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
      });
    });

    // type:skip — bidirectional wrap (4-face only)
    // skip wraps bidirectionally: face4 NEXT → face1, face1 PREV → face4.

    describe("type:skip — wrap (4-face only)", () => {
      it("next() from face 4 wraps to face 1", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(false);
      });

      it("prev() from face 1 wraps to face 4", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(false);
      });

      it("goTo(5, true) from face 4 wraps to face 1 with animation", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.goTo(5, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
      });

      it("goTo(0, true) from face 1 wraps to face 4 with animation", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(0, true);
        await adapter.advanceTime(50);
        expect(adapter.isFaceShown(1)).toBe(true);
        expect(adapter.isFaceShown(4)).toBe(true);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("round trip: next() 4→1, prev() 1→4", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });
    });

    // post-wrap state: face transforms restored to resting positions

    describe("post-wrap state: face transforms restored to resting positions", () => {
      // type:real
      it("type:real — prev() 1→4: face4 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
      });

      it("type:real — prev() 1→4: face1 at rotateX(90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(90deg)");
      });

      it("type:real — next() 4→1: face1 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      it("type:real — next() 4→1: face2 at rotateX(90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(2).transform).toContain("rotateX(90deg)");
      });

      it("type:real — 4→1 wrap then next to 2: face2 shown, face1 hidden", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(2);
        expect(adapter.isFaceShown(2)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(false);
      });

      it("type:real — 4→1 wrap then next to 2: face2 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(2).transform).toContain("rotateX(0deg)");
      });

      it("type:real — consecutive wraps 1→4→1: transforms correct after each", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      it("type:real — direction:negative next() 4→1: face1 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", direction: "negative", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      it("type:real — direction:negative prev() 1→4: face4 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "real", direction: "negative", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
      });

      it("type:real — even≠height prev() 1→4: face4 at rotateX(0deg) after adjust cleanup", async () => {
        adapter = createAdapter({
          faces: 4,
          type: "real",
          height: 200,
          even: 150,
          axis: "X",
          duration: 200,
        });
        adapter.prev();
        await adapter.advanceTime(500);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
      });

      it("type:real — even≠height next() 4→1: face1 at rotateX(0deg) after adjust cleanup", async () => {
        adapter = createAdapter({
          faces: 4,
          type: "real",
          height: 200,
          even: 150,
          axis: "X",
          duration: 200,
        });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(500);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      // ── axis:Y wrap — post-animation state ─────────────────────────────────
      // Verifies standard resting positions after axis:Y wrap.

      it("type:real axis:Y — next() 4→1: face1 at rotateY(0deg) after completion", async () => {
        adapter = createAdapter({ faces: 4, type: "real", axis: "Y", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(1);
        expect(adapter.getFaceState(1).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
      });

      it("type:real axis:Y — next() 4→1: face4 at rotateY(-90deg) after completion", async () => {
        adapter = createAdapter({ faces: 4, type: "real", axis: "Y", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        // currentFace=1: face4 is at boundary position (isSkipWrapEdge) → clamped to -90°
        expect(adapter.getFaceState(4).transform).toBe("rotateY(-90deg) translate3d(-100px, 0px, 100px)");
      });

      it("type:real axis:Y — prev() 1→4: face4 at rotateY(0deg) after completion", async () => {
        adapter = createAdapter({ faces: 4, type: "real", axis: "Y", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
        expect(adapter.getFaceState(4).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
      });

      it("type:real axis:Y — prev() 1→4: face1 at rotateY(90deg) after completion", async () => {
        adapter = createAdapter({ faces: 4, type: "real", axis: "Y", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        // currentFace=4: face1 is at boundary position (isSkipWrapEdge) → clamped to +90°
        expect(adapter.getFaceState(1).transform).toBe("rotateY(90deg) translate3d(100px, 0px, 100px)");
      });

      it("type:real axis:Y — consecutive wraps 1→4→1: transforms correct after each", async () => {
        adapter = createAdapter({ faces: 4, type: "real", axis: "Y", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toBe("rotateY(0deg) translate3d(0px, 0px, 0px)");
      });

      // type:repeat
      // prev() 1→4: face4=0°, face1=-90° (even current → odd face: -90°)
      // next() 4→1: face1=0°, face4=90° (odd current → even face: +90°)

      it("type:repeat — prev() 1→4: face4 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
      });

      it("type:repeat — prev() 1→4: face1 at rotateX(-90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(-90deg)");
      });

      it("type:repeat — next() 4→1: face1 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      it("type:repeat — next() 4→1: face4 at rotateX(90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(90deg)");
      });

      // type:skip
      // prev() 1→4: face4=0°, face1=+90° (calcDeg edge case: currentFace=4,faceNum=1 → +90°)
      // next() 4→1: face1=0°, face4=-90° (calcDeg edge case: currentFace=1,faceNum=4 → -90°)

      it("type:skip — prev() 1→4: face4 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(0deg)");
      });

      it("type:skip — prev() 1→4: face1 at rotateX(90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(90deg)");
      });

      it("type:skip — next() 4→1: face1 at rotateX(0deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(1).transform).toContain("rotateX(0deg)");
      });

      it("type:skip — next() 4→1: face4 at rotateX(-90deg)", async () => {
        adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
        adapter.goTo(4);
        await adapter.advanceTime(300);
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getFaceState(4).transform).toContain("rotateX(-90deg)");
      });
    });
  });
};
