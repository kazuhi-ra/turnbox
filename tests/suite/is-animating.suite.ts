import { describe, it, expect, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "./adapter.js";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

export const isAnimatingSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — isAnimating", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    afterEach(() => {
      adapter?.destroy();
      vi.useRealTimers();
    });

    it("is false initially", () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
      expect(adapter.isAnimating()).toBe(false);
    });

    it("is true while animation is in progress", async () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
      adapter.next();
      await adapter.advanceTime(ADJUST_TIME);
      expect(adapter.isAnimating()).toBe(true);
    });

    it("is false after animation completes", async () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
      adapter.next();
      await adapter.advanceTime(ADJUST_TIME + TOTAL + 1);
      expect(adapter.isAnimating()).toBe(false);
    });

    it("is false for noop (already at target face)", async () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
      adapter.goTo(1, true);
      await adapter.advanceTime(ADJUST_TIME);
      expect(adapter.isAnimating()).toBe(false);
    });

    it("stays true while animating — second call is blocked", async () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
      adapter.next();
      await adapter.advanceTime(ADJUST_TIME);
      const firstTrue = adapter.isAnimating();
      adapter.next(); // ignored while animating
      await adapter.advanceTime(10);
      expect(firstTrue).toBe(true);
      expect(adapter.isAnimating()).toBe(true);
    });

    it("is false after virtual-wrap animation completes", async () => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, type: "real", duration: DURATION, delay: DELAY });
      adapter.goTo(4, false);
      await adapter.advanceTime(ADJUST_TIME + TOTAL + 1);
      adapter.next(); // face4 → virtual5 → face1
      await adapter.advanceTime(ADJUST_TIME + TOTAL + 1);
      expect(adapter.isAnimating()).toBe(false);
    });
  });
};
