import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { TurnBoxTestAdapter } from "./adapter.js";
import { sharedAdapters, modernAdapters } from "../adapters/index.js";

const onlyOneFaceShown = (adapter: TurnBoxTestAdapter, faces: number): void => {
  const shownFaces = Array.from({ length: faces }, (_, i) => i + 1).filter((f) => adapter.isFaceShown(f));
  expect(shownFaces).toHaveLength(1);
};

describe.each(sharedAdapters)("%s — basic navigation", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── initialization ──────────────────────────────────────────────────────────

  describe("initialization", () => {
    it("starts at face 1", () => {
      adapter = createAdapter({ faces: 4 });
      expect(adapter.getCurrentFace()).toBe(1);
    });

    it("face 1 is shown initially, others are hidden", () => {
      adapter = createAdapter({ faces: 4 });
      expect(adapter.isFaceShown(1)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
      expect(adapter.isFaceShown(3)).toBe(false);
      expect(adapter.isFaceShown(4)).toBe(false);
    });

    it("exactly one face is shown at initialization", () => {
      adapter = createAdapter({ faces: 4 });
      onlyOneFaceShown(adapter, 4);
    });
  });

  // ── turnBoxAnimate() defaults ───────────────────────────────────────────────

  describe("turnBoxAnimate defaults", () => {
    it("calling with no face arg (default face:1) from face 3 returns to face 1", async () => {
      adapter = createAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
      // goTo(1) is equivalent to turnBoxAnimate({ face: 1 })
      adapter.goTo(1);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
      expect(adapter.isFaceShown(1)).toBe(true);
      expect(adapter.isFaceShown(3)).toBe(false);
    });
  });

  // ── goTo ────────────────────────────────────────────────────────────────────

  describe("goTo", () => {
    it("goTo(2) transitions to face 2", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(2);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
      expect(adapter.isFaceShown(2)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("goTo(3) from face 1 skips animation (non-adjacent, type:real)", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("goTo(4) from face 1 reaches face 4", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isFaceShown(4)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("goTo with animation=false transitions to target face", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(2, false);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
    });

    it("goTo same face is no-op", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(1);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });

    it("goTo face > faces is clamped to last face", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(99);
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isFaceShown(4)).toBe(true);
    });

    it("exactly one face is shown after each goTo", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      for (const face of [2, 3, 4, 1]) {
        adapter.goTo(face);
        await adapter.advanceTime(300);
        onlyOneFaceShown(adapter, 4);
      }
    });
  });

  // ── next / prev ─────────────────────────────────────────────────────────────

  describe("next / prev", () => {
    it("next() from face 1 goes to face 2", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
      expect(adapter.isFaceShown(2)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("prev() from face 2 returns to face 1", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next();
      await adapter.advanceTime(300);
      adapter.prev();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
      expect(adapter.isFaceShown(1)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
    });

    it("next() through all faces in sequence", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      for (let face = 2; face <= 4; face++) {
        adapter.next();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(face);
      }
    });

    it("exactly one face is shown after each next()", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      for (let i = 0; i < 3; i++) {
        adapter.next();
        await adapter.advanceTime(300);
        onlyOneFaceShown(adapter, 4);
      }
    });
  });

  // ── shown state lifecycle ───────────────────────────────────────────────────

  describe("shown state lifecycle", () => {
    it("after animation only target face is shown", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.isFaceShown(1)).toBe(false);
      expect(adapter.isFaceShown(2)).toBe(true);
    });

    it("exactly one face is shown after animation completes", async () => {
      adapter = createAdapter({ faces: 4, duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      onlyOneFaceShown(adapter, 4);
    });
  });

  // ── 2-face box ──────────────────────────────────────────────────────────────

  describe("2-face box", () => {
    it("starts at face 1", () => {
      adapter = createAdapter({ faces: 2 });
      expect(adapter.getCurrentFace()).toBe(1);
      expect(adapter.isFaceShown(1)).toBe(true);
      expect(adapter.isFaceShown(2)).toBe(false);
    });

    it("next() from face 2 is no-op", async () => {
      adapter = createAdapter({ faces: 2, duration: 200 });
      adapter.next();
      await adapter.advanceTime(300);
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(2);
    });

    it("prev() from face 1 is no-op", async () => {
      adapter = createAdapter({ faces: 2, duration: 200 });
      adapter.prev();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });
  });

  // ── 3-face box ──────────────────────────────────────────────────────────────

  describe("3-face box", () => {
    it("starts at face 1", () => {
      adapter = createAdapter({ faces: 3 });
      expect(adapter.getCurrentFace()).toBe(1);
    });

    it("next() from face 3 is no-op", async () => {
      adapter = createAdapter({ faces: 3, duration: 200 });
      adapter.goTo(3);
      await adapter.advanceTime(300);
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(3);
    });

    it("prev() from face 1 is no-op", async () => {
      adapter = createAdapter({ faces: 3, duration: 200 });
      adapter.prev();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(1);
    });
  });
});

describe.each(modernAdapters)("%s — basic navigation (modern)", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("starts at face 1", () => {
    adapter = createAdapter({ faces: 4 });
    expect(adapter.getCurrentFace()).toBe(1);
  });

  it("face 1 is shown initially, others are hidden", () => {
    adapter = createAdapter({ faces: 4 });
    expect(adapter.isFaceShown(1)).toBe(true);
    expect(adapter.isFaceShown(2)).toBe(false);
    expect(adapter.isFaceShown(3)).toBe(false);
    expect(adapter.isFaceShown(4)).toBe(false);
  });

  it("goTo(2) transitions to face 2", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
  });
});
