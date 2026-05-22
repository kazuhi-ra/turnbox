import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@turnbox/dom";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

const setup = (facePcs: 2 | 3 | 4 = 4) => {
  const container = document.createElement("div");
  const faceEls: HTMLElement[] = [];
  for (let i = 0; i < facePcs; i++) {
    const el = document.createElement("div");
    container.appendChild(el);
    faceEls.push(el);
  }
  document.body.appendChild(container);
  const instance = createTurnBox(container, { facePcs, duration: DURATION, delay: DELAY });
  return {
    instance,
    ariaHidden: (n: number) => faceEls[n - 1].getAttribute("aria-hidden"),
    destroy() {
      instance.destroy();
      container.remove();
    },
  };
};

describe("accessibility — aria-hidden", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // ── initial state ──────────────────────────────────────────────────────────

  it("face 1 is not aria-hidden on init", () => {
    const { ariaHidden, destroy } = setup();
    expect(ariaHidden(1)).toBeNull();
    destroy();
  });

  it("faces 2–4 are aria-hidden on init", () => {
    const { ariaHidden, destroy } = setup();
    expect(ariaHidden(2)).toBe("true");
    expect(ariaHidden(3)).toBe("true");
    expect(ariaHidden(4)).toBe("true");
    destroy();
  });

  it("only shown face has no aria-hidden (2-face)", () => {
    const { ariaHidden, destroy } = setup(2);
    expect(ariaHidden(1)).toBeNull();
    expect(ariaHidden(2)).toBe("true");
    destroy();
  });

  // ── after transition ───────────────────────────────────────────────────────

  it("target face loses aria-hidden after animation", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(ariaHidden(2)).toBeNull();
    destroy();
  });

  it("previous face gains aria-hidden after animation", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(ariaHidden(1)).toBe("true");
    destroy();
  });

  it("only the current face has no aria-hidden after multiple transitions", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(ariaHidden(1)).toBe("true");
    expect(ariaHidden(2)).toBe("true");
    expect(ariaHidden(3)).toBeNull();
    expect(ariaHidden(4)).toBe("true");
    destroy();
  });

  // ── no-animation ───────────────────────────────────────────────────────────

  it("aria-hidden updates correctly for no-animation goTo", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.goTo(3, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(ariaHidden(3)).toBeNull();
    expect(ariaHidden(1)).toBe("true");
    destroy();
  });

  // ── virtual-wrap ───────────────────────────────────────────────────────────

  it("aria-hidden is correct after virtual-wrap (face4→face1)", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.goTo(4, false);
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    instance.next(); // face4 → face1 (virtual-wrap)
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    expect(ariaHidden(1)).toBeNull();
    expect(ariaHidden(4)).toBe("true");
    destroy();
  });

  // ── destroy ────────────────────────────────────────────────────────────────

  it("destroy removes aria-hidden from all faces", async () => {
    const { instance, ariaHidden, destroy } = setup();
    instance.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    instance.destroy();
    expect(ariaHidden(1)).toBeNull();
    expect(ariaHidden(2)).toBeNull();
    destroy();
  });
});
