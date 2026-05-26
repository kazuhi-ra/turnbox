import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

// ── interrupt: calls during animation are NOT no-ops ─────────────────────────
// A new navigation call during an animation should cancel the current animation
// and start a new one from the in-flight face.

export const interruptSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — interrupt", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── next() ────────────────────────────────────────────────────────────────

    it("next() during animation: interrupts and advances to face 3", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // interrupt → face2 → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("next() interrupt: only final face is shown", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // interrupt → face2 → face3
      await adapter.advanceTime(300);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
      expect(adapter.isFaceShown(2)).toBe(false);
    });

    // ── prev() ────────────────────────────────────────────────────────────────

    it("prev() during animation: interrupts and moves back from in-flight face", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.prev(); // interrupt → face2 → face1
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    // ── goTo() ────────────────────────────────────────────────────────────────

    it("goTo() during animation: interrupts and jumps to target", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.goTo(4); // interrupt → face2 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("goTo(face, false) during animation: interrupts even without CSS transition", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.goTo(4, false); // interrupt (no CSS) → face2 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── sequential interrupts ─────────────────────────────────────────────────

    it("two sequential interrupts: each step advances the face", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // interrupt → face2 → face3
      await adapter.advanceTime(50);
      adapter.next(); // interrupt → face3 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── goTo to the same face as the in-flight destination ────────────────────

    it("goTo to in-flight destination: lands cleanly on that face", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50); // mid-animation, currentFace=2
      adapter.goTo(2); // target same as in-flight destination
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
      expect(adapter.isFaceShown(2)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    // ── wrap animation interrupt ───────────────────────────────────────────────

    it("goTo() during face4→face1 wrap animation: interrupts to arbitrary face", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(4, false);
      await adapter.advanceTime(300); // settle at face4
      adapter.next(); // face4 → face1 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap
      adapter.goTo(3); // interrupt → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("goTo() during face1→face4 wrap animation: interrupts to arbitrary face", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.prev(); // face1 → face4 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap
      adapter.goTo(3); // interrupt → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    // ── hasAdjust (variable geometry) interrupt ───────────────────────────────

    it("goTo() during hasAdjust animation: interrupts and jumps to target", async () => {
      // face2→face3 with height≠even triggers turnBoxAdjust
      adapter = createAdapter({ faces: 4, height: 50, even: 30, axis: "X", duration: 200 });
      adapter.goTo(2, false);
      await adapter.advanceTime(300);
      adapter.next(); // face2 → face3 (hasAdjust)
      await adapter.advanceTime(50); // mid adjust-animation
      adapter.goTo(4); // interrupt
      await adapter.advanceTime(400);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── type: "skip" ──────────────────────────────────────────────────────────
    // skip allows multi-face jumps with CSS transition (deff > 1 does not force
    // animation=false). interrupt should work during such animations.

    it("goTo() during type:skip animation: interrupts to target face", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(3); // face1 → face3 (deff=2, animation stays true for skip)
      await adapter.advanceTime(50);
      adapter.goTo(2); // interrupt → face3 → face2
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
    });

    it("goTo() interrupt with multi-face jump (type:skip)", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.goTo(4); // interrupt → face2 → face4 (deff=2, skip keeps animation)
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── delay > 0: interrupt during delay window ──────────────────────────────
    // isAnimating is true from t=0, but CSS transition hasn't started yet during
    // the delay period. interrupt should work in this window too.

    it("goTo() during delay window: interrupts before CSS transition starts", async () => {
      adapter = createAdapter({ faces: 4, duration: 200, delay: 100 });
      adapter.next(); // face1 → face2 (delay=100ms before transition kicks in)
      await adapter.advanceTime(50); // mid-delay, no visual transition yet
      adapter.goTo(4); // interrupt
      await adapter.advanceTime(500);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── type: "repeat" ────────────────────────────────────────────────────────

    it("goTo() during type:repeat animation: interrupts normally", async () => {
      adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.goTo(4); // interrupt
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    // ── interrupt at the very end of animation ────────────────────────────────
    // At t=210ms (duration=200, ADJUST_TIME=20 → total ~220ms) the animation is
    // almost complete. A new call should still interrupt cleanly.

    it("next() just before animation completes: interrupts and advances", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(210); // almost done (completes at ~220ms)
      adapter.next(); // interrupt just before completion → face2 → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    // ── after interrupt, normal navigation resumes ────────────────────────────

    it("after interrupted animation completes, next() works normally", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // interrupt → face2 → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
      adapter.next(); // face3 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });
  });
};
