import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { modernAdapters } from "../adapters/index.js";
import type { TurnBoxTestAdapter } from "./adapter.js";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;

describe.each(modernAdapters)("%s — focus management", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, withFocusableChildren: true });
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("focuses target face after instant goTo (animation=false)", async () => {
    adapter.goTo(2, false);
    await adapter.waitForRender();
    await adapter.advanceTime(TOTAL + 50);
    await adapter.waitForRender();
    expect(adapter.getFocusedFaceIndex()).toBe(2);
  });

  it("focuses target face after animated goTo", async () => {
    adapter.next();
    await adapter.waitForRender();
    await adapter.advanceTime(TOTAL + 50);
    await adapter.waitForRender();
    expect(adapter.getFocusedFaceIndex()).toBe(2);
  });

  it("focuses correct face after sequential goTo calls", async () => {
    adapter.goTo(3, false);
    await adapter.waitForRender();
    await adapter.advanceTime(TOTAL + 50);
    await adapter.waitForRender();
    expect(adapter.getFocusedFaceIndex()).toBe(3);
  });
});
