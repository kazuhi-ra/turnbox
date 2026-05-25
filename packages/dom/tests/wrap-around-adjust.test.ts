import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createJQueryAdapter } from "./adapters/jquery.js";

// ── jQuery — turnBox.js-specific behavior ────────────────────────────────────
// turnBoxAnimate clamps face > faces, so next() wrap is impossible.
// For non-real types, prev() wraps via face 0 → face_pcs remap.

describe("jQuery — wrap-around", () => {
  let adapter: ReturnType<typeof createJQueryAdapter>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // turnBoxAnimate clamps face > faces, so next() wrap is impossible for all types.

  describe("next() from face 4 is no-op (all types: turnBoxAnimate clamps to faces)", () => {
    it("type:real", async () => {
      adapter = createJQueryAdapter({ faces: 4, type: "real", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("type:repeat", async () => {
      adapter = createJQueryAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });

    it("type:skip", async () => {
      adapter = createJQueryAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.goTo(4);
      await adapter.advanceTime(300);
      adapter.next();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });
  });

  // face 0 → face_pcs remap makes prev() wrap for type:repeat and type:skip.

  describe("prev() from face 1 wraps to face 4 (type:repeat and type:skip)", () => {
    it("type:repeat", async () => {
      adapter = createJQueryAdapter({ faces: 4, type: "repeat", duration: 200 });
      adapter.prev();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
      expect(adapter.isFaceShown(4)).toBe(true);
      expect(adapter.isFaceShown(1)).toBe(false);
    });

    it("type:skip", async () => {
      adapter = createJQueryAdapter({ faces: 4, type: "skip", duration: 200 });
      adapter.prev();
      await adapter.advanceTime(300);
      expect(adapter.getCurrentFace()).toBe(4);
    });
  });
});
