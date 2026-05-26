import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;

// ── adapter-based: covers DOM / React / Vue / React (Component) ───────────────

export const accessibilitySuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — aria-hidden", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
    });

    afterEach(async () => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── initial state ────────────────────────────────────────────────────────────

    it("face 1 has no aria-hidden on init", () => {
      expect(adapter.getAriaHidden(1)).toBeNull();
    });

    it("faces 2–4 have aria-hidden on init", () => {
      expect(adapter.getAriaHidden(2)).toBe("true");
      expect(adapter.getAriaHidden(3)).toBe("true");
      expect(adapter.getAriaHidden(4)).toBe("true");
    });

    it("only shown face has no aria-hidden (2-face)", async () => {
      adapter.destroy();
      adapter = createAdapter({ faces: 2, duration: DURATION, delay: DELAY });
      expect(adapter.getAriaHidden(1)).toBeNull();
      expect(adapter.getAriaHidden(2)).toBe("true");
    });

    // ── after transition ─────────────────────────────────────────────────────────

    it("target face loses aria-hidden after animation", async () => {
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getAriaHidden(2)).toBeNull();
    });

    it("previous face gains aria-hidden after animation", async () => {
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getAriaHidden(1)).toBe("true");
    });

    it("only current face has no aria-hidden after multiple transitions", async () => {
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getAriaHidden(1)).toBe("true");
      expect(adapter.getAriaHidden(2)).toBe("true");
      expect(adapter.getAriaHidden(3)).toBeNull();
      expect(adapter.getAriaHidden(4)).toBe("true");
    });

    // ── no-animation ─────────────────────────────────────────────────────────────

    it("aria-hidden updates correctly for no-animation goTo", async () => {
      adapter.goTo(3, false);
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getAriaHidden(3)).toBeNull();
      expect(adapter.getAriaHidden(1)).toBe("true");
    });

    // ── boundary wrap ────────────────────────────────────────────────────────────

    it("aria-hidden is correct after boundary wrap (face4→face1)", async () => {
      adapter.goTo(4, false);
      await adapter.advanceTime(TOTAL + 50);
      adapter.next(); // face4 → face1 (boundary wrap)
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getAriaHidden(1)).toBeNull();
      expect(adapter.getAriaHidden(4)).toBe("true");
    });
  });

  // ── adapter-based: inert ─────────────────────────────────────────────────────
  // inert prevents Tab focus into hidden faces (aria-hidden alone does not).

  describe.each(adapters)("%s — inert", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
      adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
    });

    afterEach(async () => {
      adapter.destroy();
      vi.useRealTimers();
    });

    it("face 1 is not inert on init", () => {
      expect(adapter.getInert(1)).toBe(false);
    });

    it("faces 2–4 are inert on init", () => {
      expect(adapter.getInert(2)).toBe(true);
      expect(adapter.getInert(3)).toBe(true);
      expect(adapter.getInert(4)).toBe(true);
    });

    it("target face loses inert after animation", async () => {
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getInert(2)).toBe(false);
    });

    it("previous face gains inert after animation", async () => {
      adapter.next();
      await adapter.advanceTime(TOTAL + 50);
      expect(adapter.getInert(1)).toBe(true);
    });
  });
};
