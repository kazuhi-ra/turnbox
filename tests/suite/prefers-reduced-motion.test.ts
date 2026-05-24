import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { modernAdapters } from "../adapters/index.js";
import type { TurnBoxTestAdapter } from "./adapter.js";

const mockMatchMediaReduceMotion = (matches: boolean): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList),
  });
};

const restoreMatchMedia = (): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: undefined,
  });
};

describe.each(modernAdapters)("%s — prefers-reduced-motion", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no real CSS media query engine, so matchMedia is undefined by default.
    // Define it via Object.defineProperty (vi.spyOn requires the property to already exist).
    // matches:true simulates the OS "reduce motion" setting being ON, which causes
    // the implementation to override duration/delay to 0 at initialization time.
    mockMatchMediaReduceMotion(true);
    adapter = createAdapter({ faces: 4, duration: 300, delay: 100 });
  });

  afterEach(() => {
    adapter.destroy();
    restoreMatchMedia();
    vi.useRealTimers();
  });

  it("animation completes in ~50ms despite duration:300 + delay:100", async () => {
    adapter.next();
    await adapter.waitForRender();
    await adapter.advanceTime(50);
    await adapter.waitForRender();
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("goTo with animation=false also completes quickly", async () => {
    adapter.goTo(3, false);
    await adapter.waitForRender();
    await adapter.advanceTime(50);
    await adapter.waitForRender();
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });
});

describe.each(modernAdapters)("%s — reduceAnimation:'never'", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    // Simulate OS "reduce motion" ON, but the component opts out via reduceMotion:"never"
    mockMatchMediaReduceMotion(true);
    adapter = createAdapter({ faces: 4, duration: 300, delay: 100, reduceAnimation: "never" });
  });

  afterEach(() => {
    adapter.destroy();
    restoreMatchMedia();
    vi.useRealTimers();
  });

  it("animation is NOT suppressed: face does not change after only 50ms", async () => {
    adapter.next();
    await adapter.waitForRender();
    // duration:300 + delay:100 = 400ms total; 50ms is not enough to complete
    await adapter.advanceTime(50);
    await adapter.waitForRender();
    // Still animating — face 2 is shown but face 1 should still be shown too (mid-animation)
    // OR getCurrentFace has not yet updated. Either way, the animation is NOT done in 50ms.
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("animation completes after full duration+delay (400ms)", async () => {
    adapter.next();
    await adapter.waitForRender();
    await adapter.advanceTime(450);
    await adapter.waitForRender();
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });
});
