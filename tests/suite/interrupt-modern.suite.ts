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

    it("即時実行 clears pending queue", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2 (FROM=1)
      await adapter.advanceTime(50);
      adapter.goTo(3); // queue face3
      adapter.prev(); // 即時実行 (display=2, prev=1=FROM) → clears queue
      await adapter.advanceTime(500);
      expect(adapter.getCurrentFace()).toBe(1); // face3 was cleared
    });
  });
};
