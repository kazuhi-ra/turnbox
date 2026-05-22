import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@turnbox/dom";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

const setup = (opts?: Partial<Parameters<typeof createTurnBox>[1]>) => {
  const container = document.createElement("div");
  for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
  document.body.appendChild(container);
  const instance = createTurnBox(container, {
    facePcs: 4,
    duration: DURATION,
    delay: DELAY,
    ...opts,
  });
  return {
    instance,
    destroy() {
      instance.destroy();
      container.remove();
    },
  };
};

describe("isAnimating — DOM", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false initially", () => {
    const { instance, destroy } = setup();
    expect(instance.isAnimating()).toBe(false);
    destroy();
  });

  it("is true while animation is in progress", async () => {
    const { instance, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(instance.isAnimating()).toBe(true);
    destroy();
  });

  it("is false after animation completes", async () => {
    const { instance, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(instance.isAnimating()).toBe(false);
    destroy();
  });

  it("is false for noop (already at target face)", async () => {
    const { instance, destroy } = setup();
    instance.goTo(1, true);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(instance.isAnimating()).toBe(false);
    destroy();
  });

  it("stays true while animating — second call is blocked", async () => {
    const { instance, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    const firstTrue = instance.isAnimating();
    instance.next(); // ignored
    await vi.advanceTimersByTimeAsync(10);
    expect(firstTrue).toBe(true);
    expect(instance.isAnimating()).toBe(true);
    destroy();
  });

  it("is false after virtual-wrap animation completes", async () => {
    const { instance, destroy } = setup({ type: "real" });
    instance.goTo(4, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    instance.next(); // face4 → face1 (virtual-wrap)
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(instance.isAnimating()).toBe(false);
    destroy();
  });
});
