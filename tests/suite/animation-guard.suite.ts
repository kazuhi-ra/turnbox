import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

// ── navigation works normally once an animation settles ───────────────────────

export const animationGuardSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — animation guard", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    it("after animation completes, next() works normally", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next(); // face1 → face2
      await adapter.advanceTime(300); // animation complete
      expect(adapter.getCurrentFace()).toBe(2);
      adapter.next(); // face2 → face3
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("all navigation methods work after animation completes", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next();
      await adapter.advanceTime(300); // face2
      adapter.next();
      await adapter.advanceTime(300); // face3
      adapter.prev();
      await adapter.advanceTime(300); // face2
      adapter.goTo(4);
      await adapter.advanceTime(300); // face4
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isFaceShown(4)).toBe(true);
    });
  });
};
