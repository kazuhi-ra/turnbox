import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { TurnBoxTestAdapter } from "./adapter.js";
import { sharedAdapters } from "../adapters/index.js";

describe.each(sharedAdapters)("%s — edge cases", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── facePcs > 4 capped at 4 ─────────────────────────────────────────────────
  // turnBox.js removes children at index > 3 and caps face_pcs to 4.

  it("facePcs 5 is capped to 4: starts at face 1 and navigates to face 4", async () => {
    adapter = createAdapter({ facePcs: 5, duration: 200 });
    expect(adapter.getCurrentFace()).toBe(1);
    adapter.goTo(4);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
    expect(adapter.isFaceShown(4)).toBe(true);
  });

  it("facePcs 6 is capped to 4: can navigate to face 4", async () => {
    adapter = createAdapter({ facePcs: 6, duration: 200 });
    adapter.goTo(4);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
    expect(adapter.isFaceShown(4)).toBe(true);
  });

  // ── goTo out-of-range clamping ───────────────────────────────────────────────
  // turnBoxAnimate clamps face > face_pcs to face_pcs.

  it("goTo(99) on 4-face box clamps to face 4", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.goTo(99);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
    expect(adapter.isFaceShown(4)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("goTo(99) on 3-face box clamps to face 3", async () => {
    adapter = createAdapter({ facePcs: 3, duration: 200 });
    adapter.goTo(99);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });

  it("goTo(99) on 2-face box clamps to face 2", async () => {
    adapter = createAdapter({ facePcs: 2, duration: 200 });
    adapter.goTo(99);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
  });

  // ── uneven geometry: even ≠ length (fixed=false) ────────────────────────────
  // When even !== height (axis:X) or even !== width (axis:Y), fixed=false.
  // Navigation behavior (face transitions) must still work correctly.

  it("uneven geometry (axis:X, even≠height): starts at face 1", () => {
    adapter = createAdapter({ facePcs: 4, height: 50, even: 30, axis: "X" });
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("uneven geometry (axis:X, even≠height): navigation works correctly", async () => {
    adapter = createAdapter({ facePcs: 4, height: 50, even: 30, axis: "X", duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("uneven geometry (axis:Y, even≠width): navigation works correctly", async () => {
    adapter = createAdapter({ facePcs: 4, width: 200, even: 120, axis: "Y", duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });

  // ── type:skip coerced to type:real when even≠length ─────────────────────────
  // When fixed=false (even≠length), type:skip is forced to type:real.
  // Non-adjacent goTo therefore gets animation=false (type:real behavior).

  it("type:skip + even≠height: non-adjacent goTo behaves as type:real (no-op skipping)", async () => {
    adapter = createAdapter({
      facePcs: 4,
      type: "skip",
      height: 50,
      even: 30,
      axis: "X",
      duration: 200,
    });
    // type:skip is coerced to type:real; non-adjacent goTo(3) from face1 still reaches face3
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });

  // ── shown state invariant ────────────────────────────────────────────────────
  // At any stable state (after animations settle), exactly one face has turnBoxShow.

  it("invariant: exactly one face shown after any navigation sequence", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    const check = () => {
      const shownFaces = [1, 2, 3, 4].filter((f) => adapter.isFaceShown(f));
      expect(shownFaces).toHaveLength(1);
    };

    for (const face of [3, 1, 4, 2, 4, 1]) {
      adapter.goTo(face);
      await adapter.advanceTime(300);
      check();
    }
  });

  it("invariant: exactly one face shown after next/prev sequence", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    const check = () => {
      const shownFaces = [1, 2, 3, 4].filter((f) => adapter.isFaceShown(f));
      expect(shownFaces).toHaveLength(1);
    };

    adapter.next();
    await adapter.advanceTime(300);
    check();
    adapter.next();
    await adapter.advanceTime(300);
    check();
    adapter.prev();
    await adapter.advanceTime(300);
    check();
    adapter.next();
    await adapter.advanceTime(300);
    check();
  });

  // ── turnBoxAdjust cleanup (uneven geometry) ──────────────────────────────────
  // When fixed=false (even≠length), certain transitions add .turnBoxAdjust.
  // It must be removed after animation completes (no leftover state).

  it("uneven geometry: no .turnBoxAdjust left after face1 PREV animation", async () => {
    adapter = createAdapter({ facePcs: 4, height: 50, even: 30, axis: "X", duration: 200 });
    adapter.prev(); // current=1 → target=0 → adds turnBoxAdjust (direction:positive, 1→0 path)
    await adapter.advanceTime(300);
    const container = document.querySelector("[data-turnbox-test]") as HTMLElement;
    expect(container.classList.contains("turnBoxAdjust")).toBe(false);
  });

  it("uneven geometry: no .turnBoxAdjust left after face2 NEXT animation", async () => {
    adapter = createAdapter({ facePcs: 4, height: 50, even: 30, axis: "X", duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    adapter.next(); // current=2 → target=3 → adds turnBoxAdjust (2→3 path)
    await adapter.advanceTime(300);
    const container = document.querySelector("[data-turnbox-test]") as HTMLElement;
    expect(container.classList.contains("turnBoxAdjust")).toBe(false);
  });
});
