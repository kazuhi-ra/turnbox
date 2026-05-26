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
  });
};
