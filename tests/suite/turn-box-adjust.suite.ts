import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

// ── turnBoxAdjust cleanup (uneven geometry) ──────────────────────────────────
// When fixed=false (even≠length), certain transitions add .turnBoxAdjust.
// It must be removed after animation completes (no leftover state).
// This CSS class is a jQuery/DOM-layer concern.

export const turnBoxAdjustSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — turnBoxAdjust cleanup", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    it("uneven geometry: no .turnBoxAdjust left after face1 PREV animation", async () => {
      adapter = createAdapter({ faces: 4, height: 50, even: 30, axis: "X", duration: 200 });
      adapter.prev(); // current=1 → target=0 → adds turnBoxAdjust (direction:positive, 1→0 path)
      await adapter.advanceTime(300);
      const container = document.querySelector("[data-turnbox-test]") as HTMLElement;
      expect(container.classList.contains("turnBoxAdjust")).toBe(false);
    });

    it("uneven geometry: no .turnBoxAdjust left after face2 NEXT animation", async () => {
      adapter = createAdapter({ faces: 4, height: 50, even: 30, axis: "X", duration: 200 });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      adapter.next(); // current=2 → target=3 → adds turnBoxAdjust (2→3 path)
      await adapter.advanceTime(300);
      const container = document.querySelector("[data-turnbox-test]") as HTMLElement;
      expect(container.classList.contains("turnBoxAdjust")).toBe(false);
    });
  });
};
