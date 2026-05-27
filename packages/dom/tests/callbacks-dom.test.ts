import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;

// ── DOM precision timing ─────────────────────────────────────────────────────
// Verifies onAnimationEnd fires at exactly TOTAL (= 200ms).
// Non-hasAdjust animations execute step() immediately (no startDelay),
// so the only timer is the cleanup timeout at TOTAL ms.
// Only meaningful for the DOM adapter which drives real setTimeout ticks.
describe("DOM — onAnimationEnd precision timing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setupDom = (onAnimationEnd: (face: number) => void) => {
    const container = document.createElement("div");
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION, delay: DELAY, onAnimationEnd });
    return {
      instance,
      destroy() {
        instance.destroy();
        container.remove();
      },
    };
  };

  it("onAnimationEnd is NOT called at TOTAL - 1ms", async () => {
    const onAnimationEnd = vi.fn();
    const { instance, destroy } = setupDom(onAnimationEnd);
    instance.next();
    await vi.advanceTimersByTimeAsync(TOTAL - 1);
    expect(onAnimationEnd).not.toHaveBeenCalled();
    destroy();
  });

  it("onAnimationEnd IS called at TOTAL + 1ms", async () => {
    const onAnimationEnd = vi.fn();
    const { instance, destroy } = setupDom(onAnimationEnd);
    instance.next();
    await vi.advanceTimersByTimeAsync(TOTAL + 1);
    expect(onAnimationEnd).toHaveBeenCalledOnce();
    expect(onAnimationEnd).toHaveBeenCalledWith(2);
    destroy();
  });
});
