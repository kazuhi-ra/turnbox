import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@turnbox/dom";
import { modernAdapters } from "../adapters/index.js";
import type { TurnBoxTestAdapter } from "./adapter.js";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;

// ── adapter-based: covers DOM / React / Vue / React (Component) ───────────────

describe.each(modernAdapters)("%s — aria-hidden", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
  });

  afterEach(async () => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── initial state ────────────────────────────────────────────────────────────

  it("face 1 has no aria-hidden on init", () => {
    expect(adapter.getAriaHidden(1)).toBeNull();
  });

  it("faces 2–4 have aria-hidden on init", () => {
    expect(adapter.getAriaHidden(2)).toBe("true");
    expect(adapter.getAriaHidden(3)).toBe("true");
    expect(adapter.getAriaHidden(4)).toBe("true");
  });

  it("only shown face has no aria-hidden (2-face)", async () => {
    adapter.destroy();
    adapter = createAdapter({ faces: 2, duration: DURATION, delay: DELAY });
    expect(adapter.getAriaHidden(1)).toBeNull();
    expect(adapter.getAriaHidden(2)).toBe("true");
  });

  // ── after transition ─────────────────────────────────────────────────────────

  it("target face loses aria-hidden after animation", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaHidden(2)).toBeNull();
  });

  it("previous face gains aria-hidden after animation", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaHidden(1)).toBe("true");
  });

  it("only current face has no aria-hidden after multiple transitions", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaHidden(1)).toBe("true");
    expect(adapter.getAriaHidden(2)).toBe("true");
    expect(adapter.getAriaHidden(3)).toBeNull();
    expect(adapter.getAriaHidden(4)).toBe("true");
  });

  // ── no-animation ─────────────────────────────────────────────────────────────

  it("aria-hidden updates correctly for no-animation goTo", async () => {
    adapter.goTo(3, false);
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaHidden(3)).toBeNull();
    expect(adapter.getAriaHidden(1)).toBe("true");
  });

  // ── virtual-wrap ─────────────────────────────────────────────────────────────

  it("aria-hidden is correct after virtual-wrap (face4→face1)", async () => {
    adapter.goTo(4, false);
    await adapter.advanceTime(TOTAL + 50);
    adapter.next(); // face4 → face1 (virtual-wrap)
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaHidden(1)).toBeNull();
    expect(adapter.getAriaHidden(4)).toBe("true");
  });
});

// ── DOM only: destroy removes aria-hidden ─────────────────────────────────────
// createTurnBox.destroy() explicitly removes aria-hidden from all faces so that
// any code holding element references doesn't see stale attributes.
// React/Vue adapters unmount and remove the DOM, so this guarantee doesn't apply.

describe("DOM — destroy removes aria-hidden", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("destroy removes aria-hidden from all faces", async () => {
    const container = document.createElement("div");
    const faceEls: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      container.appendChild(el);
      faceEls.push(el);
    }
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION, delay: DELAY });

    instance.next();
    await vi.advanceTimersByTimeAsync(TOTAL + 50);

    instance.destroy();
    expect(faceEls[0].getAttribute("aria-hidden")).toBeNull();
    expect(faceEls[1].getAttribute("aria-hidden")).toBeNull();
    container.remove();
  });
});

describe("DOM — destroy mid-animation clears inline transition", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("no face retains style.transition after destroy() during animation", async () => {
    const container = document.createElement("div");
    const faceEls: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      container.appendChild(el);
      faceEls.push(el);
    }
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION, delay: DELAY });

    instance.next();
    // Advance past ADJUST_TIME (20ms) so the transition has been applied to faces,
    // but stop before duration ends so we are still mid-animation.
    await vi.advanceTimersByTimeAsync(30);
    expect(faceEls[0].style.transition).not.toBe("");

    instance.destroy();
    for (const face of faceEls) {
      expect(face.style.transition).toBe("");
    }
    container.remove();
  });
});
