import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { modernAdapters } from "../adapters/index.js";
import type { TurnBoxTestAdapter } from "./adapter.js";

describe.each(modernAdapters)("%s — prefers-reduced-motion", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no real CSS media query engine, so matchMedia is undefined by default.
    // Define it via Object.defineProperty (vi.spyOn requires the property to already exist).
    // matches:true simulates the OS "reduce motion" setting being ON, which causes
    // the implementation to override duration/delay to 0 at initialization time.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList),
    });
    adapter = createAdapter({ faces: 4, duration: 300, delay: 100 });
  });

  afterEach(() => {
    adapter.destroy();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });
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
