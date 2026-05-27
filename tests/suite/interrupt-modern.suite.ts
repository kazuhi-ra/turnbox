import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

// ── interrupt behavior that differs from jQuery ───────────────────────────────
// jQuery does not cancel in-flight timers on interrupt, so overlapping timer
// side-effects produce unpredictable results for these cases.
// Modern adapters (DOM/React/Vue) cancel timers via abortAnimation(),
// yielding consistent behavior.

export const interruptModernSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — interrupt (modern)", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── wrap animation interrupt ───────────────────────────────────────────────
    // During a boundary wrap animation, displayFace is already set to the
    // destination face. Interrupting uses that destination as the base for the
    // next navigation, so next()/prev() produce deterministic results.

    it("prev() during face4→face1 wrap: currentFace is face1 mid-wrap, prev goes to face4", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(4, false);
      await adapter.advanceTime(300);
      adapter.next(); // face4 → face1 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap, displayFace = face1
      adapter.prev(); // from face1 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("next() during face1→face4 wrap: currentFace is face4 mid-wrap, next goes to face1", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.prev(); // face1 → face4 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap, displayFace = face4
      adapter.next(); // from face4 → face1
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    it("next() during face4→face1 wrap: currentFace is face1 mid-wrap, next goes to face2", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(4, false);
      await adapter.advanceTime(300);
      adapter.next(); // face4 → face1 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap, displayFace = face1
      adapter.next(); // from face1 → face2
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
    });

    it("prev() during face1→face4 wrap: currentFace is face4 mid-wrap, prev goes to face3", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.prev(); // face1 → face4 (boundary wrap)
      await adapter.advanceTime(50); // mid-wrap, displayFace = face4
      adapter.prev(); // from face4 → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    // ── queue seamlessness ────────────────────────────────────────────────────
    // Queued animations must start immediately when the previous one completes,
    // with no inter-animation gap. ADJUST_TIME is only needed for the very first
    // animation (to ensure transforms are painted before CSS transition starts).
    // For queue-drained animations the transforms are already in the correct
    // painted state, so the delay must be 0.

    it("queued animation: second face shown immediately when first completes", async () => {
      // face1→face2 completes at ADJUST_TIME(20) + DURATION(200) = 220ms from t=0
      // With 0ms gap: face3 shown at t=220ms
      // With 20ms gap (bug): face3 shown at t=240ms → this assertion fails
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // queue face3
      await adapter.advanceTime(170); // 50+170=220ms total
      expect(adapter.isFaceShown(3)).toBe(true);
    });

    it("consecutive queued animations complete without inter-animation gap", async () => {
      // With 20ms gap (bug): 20 + 200 + 20 + 200 = 440ms total
      // With 0ms gap (fix):  20 + 200 +  0 + 200 = 420ms total
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // queue face3
      await adapter.advanceTime(370); // 50+370=420ms total
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
      expect(adapter.isAnimating()).toBe(false);
    });

    // ── queue seamlessness: type:skip ─────────────────────────────────────────
    // type:skip allows multi-face jumps with CSS transition (deff>1 stays animated).
    // Seamlessness must hold for 1-step-after-skip AND 2-step-skip-after-1-step.

    it("type:skip queued 1-step after 2-step: second face shown immediately", async () => {
      // face1→face3 (2-step skip), then next() queued → face3→face4 (1-step)
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(3); // face1→face3 (skip)
      await adapter.advanceTime(50);
      adapter.next(); // queue face4
      await adapter.advanceTime(170); // 50+170=220ms
      expect(adapter.isFaceShown(4)).toBe(true);
    });

    it("type:skip queued 2-step after 1-step: second face shown immediately", async () => {
      // face1→face2 (1-step), then goTo(4) queued → face2→face4 (2-step skip)
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.next(); // face1→face2
      await adapter.advanceTime(50);
      adapter.goTo(4); // queue face4 (2-step skip)
      await adapter.advanceTime(170); // 50+170=220ms
      expect(adapter.isFaceShown(4)).toBe(true);
    });

    it("type:skip consecutive queued animations complete without inter-animation gap", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.next(); // face1→face2
      await adapter.advanceTime(50);
      adapter.goTo(4); // queue face4 (2-step skip from face2)
      await adapter.advanceTime(370); // 50+370=420ms
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isFaceShown(4)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
      expect(adapter.isAnimating()).toBe(false);
    });

    // ── queue seamlessness: type:repeat boundary wrap ─────────────────────────
    // When next() at face4 is queued, {face:1} is stored (resolved from rawTarget=5).
    // On drain, resolveTransition(4, 1, type:repeat) must recognise this as a boundary
    // wrap (direct-wrap) — not a 3-step non-adjacent jump (doAnimate:false → snap).

    it("type:repeat queued next() face4→face1: boundary wrap animates (not snap)", async () => {
      adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.goTo(3, false); // instant to face3
      await adapter.advanceTime(300); // settle
      adapter.next(); // face3→face4 (t=300)
      await adapter.advanceTime(50);
      adapter.next(); // queue face1 (next at displayFace=4 → rawTarget=5 → stored as {face:1})
      // face3→face4 cleanup fires at t=500ms; drainQueue starts face4→face1
      await adapter.advanceTime(210); // total 560ms; second animation 60ms in
      expect(adapter.isAnimating()).toBe(true); // still animating — proves it didn't snap
      expect(adapter.getCurrentFace()).toBe(1);
      await adapter.advanceTime(200);
      expect(adapter.isAnimating()).toBe(false);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    it("type:repeat queued prev() face1→face4: boundary wrap animates (not snap)", async () => {
      adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.next(); // face1→face2 (t=0)
      await adapter.advanceTime(50);
      adapter.prev(); // immediate-execute: abort → face2→face1
      await adapter.advanceTime(300); // settle at face1
      adapter.prev(); // face1→face4 boundary wrap (t=350)
      await adapter.advanceTime(50);
      adapter.prev(); // queue face3 (next from displayFace=4)
      await adapter.advanceTime(160); // face1→face4 cleanup fires at 200ms; drain starts at 200ms
      expect(adapter.isAnimating()).toBe(true);
      expect(adapter.getCurrentFace()).toBe(3);
      await adapter.advanceTime(200);
      expect(adapter.isAnimating()).toBe(false);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    // ── queue behavior ────────────────────────────────────────────────────────

    it("two next() queued during same animation: same target queued twice, executes once", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2 (FROM=1, display=2)
      await adapter.advanceTime(50);
      adapter.next(); // queue face3 (next from display=2)
      await adapter.advanceTime(50);
      adapter.next(); // queue face3 again (display still 2)
      await adapter.advanceTime(600); // face1→face2 + face2→face3 complete
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("next() queued: isAnimating stays true through both animations", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1→face2 (≈220ms)
      await adapter.advanceTime(50);
      adapter.next(); // queue face3
      await adapter.advanceTime(200); // 250ms: face1→face2 still in progress
      expect(adapter.isAnimating()).toBe(true);
      await adapter.advanceTime(300); // 550ms: both complete
      expect(adapter.isAnimating()).toBe(false);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("multiple goTo() queued: executes in order", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.goTo(3); // queue face3
      adapter.goTo(4); // queue face4
      await adapter.advanceTime(800); // all animations complete
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("immediate-execute clears pending queue", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2 (FROM=1)
      await adapter.advanceTime(50);
      adapter.goTo(3); // queue face3
      adapter.prev(); // immediate-execute (display=2, prev=1=FROM) → clears queue
      await adapter.advanceTime(500);
      expect(adapter.getCurrentFace()).toBe(1); // face3 was cleared
    });

    // ── no flash on immediate-execute ─────────────────────────────────────────
    // abortAnimation() hides the animating-from face (not the settle face).
    // The new animation's step() runs via setTimeout(0) and re-shows it, but a
    // browser paint in that ~1ms window would flash the face invisible.
    // The fix: showFace(targetFace) synchronously before schedule(step,0).

    it("target face is shown synchronously after immediate-execute, before step() fires", async () => {
      // next(): face1→face2. abortAnimation() in prev() hides face1 (animatingFromFace).
      // Without fix: face1 invisible until step() fires via setTimeout.
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50); // mid-animation
      adapter.prev(); // immediate-execute: abort + reschedule face2→face1
      // Synchronously after prev() — step() has NOT fired yet (it's a setTimeout)
      expect(adapter.isFaceShown(1)).toBe(true);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    // ── stale queue entries do not fire as phantom navigations ────────────────
    // When the same target is queued multiple times (all resolve to noop once
    // settled), leftover entries must be discarded rather than held as pending.
    // Without the fix, the stuck {face:3} entry fires when the NEXT user
    // navigation completes, producing an unexpected reverse animation.

    // ── queue: rawTarget resolved at enqueue time ─────────────────────────────
    // Queued entries are stored as resolved face numbers, not raw targets.
    // This prevents direct-wrap re-resolution on drain (which would produce a
    // jarring 180° CSS animation from the "back of box" position).
    // Instead, the entry re-resolves as a non-adjacent step (doAnimate:false)
    // from the settled face, executing as a clean instant snap.

    it("goTo(0) queued during face1→face2: resolves as instant snap to face4, no jarring animation", async () => {
      // goTo(0) during face1→face2: rawTarget=0 resolves to direct-wrap face4, stored as {face:4}
      // drainQueue(2): resolveTransition(2,4,type:real)=step,doAnimate:false → instant snap
      // Without fix (rawTarget=0 stored): re-resolves as direct-wrap → 180° CSS animation from back
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.next(); // face1→face2 (FROM=1, display=2)
      adapter.goTo(0); // direct-wrap to face4 → queued as {face:4}
      await adapter.advanceTime(500); // face1→face2 (≈220ms) + instant snap + cleanup (200ms)
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isAnimating()).toBe(false);
    });

    it("stale noop queue entries are discarded: subsequent next() reaches face4", async () => {
      // face1→2 starts. face3 queued 3× (display stays at 2 for all queued calls).
      // After settling at face3, one stale {face:3} entry would remain without the fix.
      // next() must go to face4, not bounce back to face3.
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(50);
      adapter.next(); // queue face3
      adapter.next(); // queue face3 (dup)
      adapter.next(); // queue face3 (dup)
      await adapter.advanceTime(600); // face1→2 + face2→3 settle
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isAnimating()).toBe(false);
      adapter.next(); // face3 → face4
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });
  });
};
