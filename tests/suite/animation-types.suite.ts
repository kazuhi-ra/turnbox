import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterFactory, TurnBoxTestAdapter } from "./adapter.js";

export const animationTypesSuite = (adapters: [string, AdapterFactory][]) => {
  describe.each(adapters)("%s — animation types", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── type:real ────────────────────────────────────────────────────────────────

    it("type:real — non-adjacent goTo(3) from face 1 still reaches face 3 (animation forced off)", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("type:real — non-adjacent goTo(4) from face 1 reaches face 4", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("type:real — goTo same face is no-op", async () => {
      adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(1);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    // ── type:repeat ──────────────────────────────────────────────────────────────

    it("type:repeat — non-adjacent goTo(3) from face 1 reaches face 3", async () => {
      adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("type:repeat — sequential navigation works same as type:real", async () => {
      adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    // ── type:skip ────────────────────────────────────────────────────────────────

    it("type:skip — goTo(3) from face 1 reaches face 3", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
      expect(adapter.isFaceShown(3)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("type:skip — goTo(4) from face 1 reaches face 4", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("type:skip — goTo(1) from face 4 reaches face 1", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      adapter.goTo(1);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
      expect(adapter.isFaceShown(1)).toBe(true);
      expect(adapter.isFaceShown(4)).toBe(false);
    });

    it("type:skip — can navigate to any face directly", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      for (const face of [3, 1, 4, 2]) {
        adapter.goTo(face);
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(face);
      }
    });

    it("type:skip — same face is still no-op", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
    });
  });
};
