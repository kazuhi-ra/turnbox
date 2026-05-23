import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { TurnBoxTestAdapter } from "./adapter.js";
import { modernAdapters } from "../adapters/index.js";

// ── calls during animation are ignored ───────────────────────────────────────
// next()/prev()/goTo() called before animation completes must be no-ops.
// After completion, navigation must work normally again.

describe.each(modernAdapters)("%s — animation guard", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("next() during animation is ignored: stays at face 2, not face 3", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.next(); // start face1 → face2 animation
    await adapter.advanceTime(50); // mid-animation (duration=200, not yet complete)
    adapter.next(); // should be ignored
    await adapter.advanceTime(300); // first animation completes
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("prev() during animation is ignored", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(50);
    adapter.prev(); // should be ignored
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("goTo() during animation is ignored", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(50);
    adapter.goTo(4); // should be ignored
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("after animation completes, next() works normally", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(300); // animation complete
    expect(adapter.getCurrentFace()).toBe(2);
    adapter.next(); // face2 → face3 (guard released)
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  it("wrap animation guard: next() during face4→face1 wrap is ignored", async () => {
    adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
    adapter.goTo(4);
    await adapter.advanceTime(300);
    adapter.next(); // start face4 → face1 wrap animation
    await adapter.advanceTime(50);
    adapter.next(); // should be ignored
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
  });

  // ── rapid calls are not queued ───────────────────────────────────────────────

  it("three rapid next() calls result in only one step", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.next(); // start face1 → face2
    adapter.next(); // ignored
    adapter.next(); // ignored
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("next() called 5 times rapidly only moves one step", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    for (let i = 0; i < 5; i++) adapter.next();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
  });

  // ── guard applies even when animation=false ───────────────────────────────────

  it("goTo(face, false) blocks subsequent calls during its own timeouts", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(3, false); // no CSS transition, but state update is still async
    adapter.next(); // should be ignored
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  // ── all navigation methods work normally after guard releases ────────────────

  it("all navigation methods work after guard releases", async () => {
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

  // ── even≠length (fixed=false) + guard ────────────────────────────────────────
  // When hasAdjust=true, isAnimating remains true until adjust cleanup completes.

  it("even≠height: operation during adjust cleanup window is ignored", async () => {
    // duration=200, delay=50 → time=250. adjust cleanup は 250+20+20=290ms に発火
    adapter = createAdapter({
      faces: 4,
      type: "real",
      height: 200,
      even: 150,
      axis: "X",
      duration: 200,
    });
    adapter.next(); // face1 → face2 (shouldAddAdjust=false for this pair, guard releases at ~270ms)
    await adapter.advanceTime(150); // mid-animation
    adapter.next(); // should be ignored
    await adapter.advanceTime(200); // animation complete
    expect(adapter.getCurrentFace()).toBe(2);
  });
});
