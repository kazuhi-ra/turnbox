import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@turnbox/dom";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

const setup = (opts?: Parameters<typeof createTurnBox>[1]) => {
  const container = document.createElement("div");
  for (let i = 0; i < (opts?.facePcs ?? 4); i++)
    container.appendChild(document.createElement("div"));
  document.body.appendChild(container);

  const onChange = vi.fn();
  const onAnimationEnd = vi.fn();
  const instance = createTurnBox(container, {
    facePcs: 4,
    duration: DURATION,
    delay: DELAY,
    ...opts,
    onChange,
    onAnimationEnd,
  });

  return {
    instance,
    onChange,
    onAnimationEnd,
    destroy() {
      instance.destroy();
      container.remove();
    },
  };
};

describe("callbacks", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // ── onChange ────────────────────────────────────────────────────────────────

  it("onChange fires with target face when animation begins", async () => {
    const { instance, onChange, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(2);
    destroy();
  });

  it("onChange fires with correct face for prev()", async () => {
    const { instance, onChange, destroy } = setup();
    instance.goTo(3, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    onChange.mockClear();

    instance.prev();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledWith(2);
    destroy();
  });

  it("onChange fires with correct face for goTo()", async () => {
    const { instance, onChange, destroy } = setup();
    instance.goTo(3, true);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledWith(3);
    destroy();
  });

  it("onChange is not called when transition is noop (already at face)", async () => {
    const { instance, onChange, destroy } = setup();
    instance.goTo(1, true); // already at face 1
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(onChange).not.toHaveBeenCalled();
    destroy();
  });

  it("onChange fires once per transition even for chained calls", async () => {
    const { instance, onChange, destroy } = setup();
    instance.next(); // starts animating
    instance.next(); // ignored while animating
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledOnce();
    destroy();
  });

  // ── onAnimationEnd ──────────────────────────────────────────────────────────

  it("onAnimationEnd fires with target face after animation completes", async () => {
    const { instance, onAnimationEnd, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL - 1);
    expect(onAnimationEnd).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2);
    expect(onAnimationEnd).toHaveBeenCalledOnce();
    expect(onAnimationEnd).toHaveBeenCalledWith(2);
    destroy();
  });

  it("onAnimationEnd fires after onChange", async () => {
    const { instance, onChange, onAnimationEnd, destroy } = setup();
    const order: string[] = [];
    onChange.mockImplementation(() => order.push("onChange"));
    onAnimationEnd.mockImplementation(() => order.push("onAnimationEnd"));

    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(order).toEqual(["onChange", "onAnimationEnd"]);
    destroy();
  });

  // ── virtual-wrap (type:real, face4→face1) ───────────────────────────────────

  it("onChange fires with landAt face (not virtual) for wrap animation", async () => {
    const { instance, onChange, destroy } = setup({ facePcs: 4, type: "real" });
    instance.goTo(4, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    onChange.mockClear();

    instance.next(); // face4 → virtual5 → face1
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledWith(1); // landAt, not 5
    destroy();
  });

  it("onAnimationEnd fires with landAt face for wrap animation", async () => {
    const { instance, onAnimationEnd, destroy } = setup({ facePcs: 4, type: "real" });
    instance.goTo(4, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    onAnimationEnd.mockClear();

    instance.next(); // face4 → virtual5 → face1
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(onAnimationEnd).toHaveBeenCalledWith(1); // landAt, not 5
    destroy();
  });

  // ── no-animation ────────────────────────────────────────────────────────────

  it("onChange fires for no-animation goTo", async () => {
    const { instance, onChange, destroy } = setup();
    instance.goTo(3, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    expect(onChange).toHaveBeenCalledWith(3);
    destroy();
  });

  it("onAnimationEnd fires for no-animation goTo", async () => {
    const { instance, onAnimationEnd, destroy } = setup();
    instance.goTo(3, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(onAnimationEnd).toHaveBeenCalledWith(3);
    destroy();
  });
});
