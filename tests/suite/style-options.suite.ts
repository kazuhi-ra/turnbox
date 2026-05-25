import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "./adapter.js";

export const styleOptionsSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — delay", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // duration: 50, delay: 30
    // onAnimationEnd fires at ~(duration + delay) after the transition starts.
    // delay only affects the CSS animation timing, not the internal state update.

    it("delay is reflected in inline transition style", async () => {
      adapter = createAdapter({ faces: 4, duration: 50, delay: 30 });
      adapter.goTo(2);
      await adapter.waitForRender();
      await adapter.advanceTime(25); // past DOM's ADJUST_TIME
      expect(adapter.getFaceState(1).inlineTransition).toContain("30ms");
    });

    it("onAnimationEnd fires after duration + delay, not after duration alone", async () => {
      const onAnimationEnd = vi.fn();
      adapter = createAdapter({ faces: 4, duration: 50, delay: 30, onAnimationEnd });
      adapter.goTo(2);
      // 60ms from goTo: past duration (50) but before duration + delay (~100ms) → not yet fired
      await adapter.advanceTime(60);
      expect(onAnimationEnd).not.toHaveBeenCalled();
      // 120ms from goTo: past duration + delay → should have fired
      await adapter.advanceTime(60);
      expect(onAnimationEnd).toHaveBeenCalledWith(2);
    });
  });

  describe.each(adapters)("%s — easing / perspective", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── easing ────────────────────────────────────────────────────────────────────

    it("easing option is reflected in face transition during animation", async () => {
      adapter = createAdapter({ faces: 4, easing: "ease-in-out", duration: 200 });
      adapter.goTo(2);
      await adapter.waitForRender();
      await adapter.advanceTime(25); // past DOM's ADJUST_TIME (20ms)
      expect(adapter.getFaceState(1).inlineTransition).toContain("ease-in-out");
    });

    it("easing defaults to linear", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(2);
      await adapter.waitForRender();
      await adapter.advanceTime(25);
      expect(adapter.getFaceState(1).inlineTransition).toContain("linear");
    });

    // ── perspective ───────────────────────────────────────────────────────────────

    it("perspective option is applied to the container", () => {
      adapter = createAdapter({ faces: 4, perspective: 1200 });
      expect(adapter.getContainerState().perspective).toBe("1200px");
    });

    it("perspective defaults to 800px", () => {
      adapter = createAdapter({ faces: 4 });
      expect(adapter.getContainerState().perspective).toBe("800px");
    });
  });
};
