import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";
import { modernAdapters } from "../adapters/index.js";
import type { TurnBoxTestAdapter } from "./adapter.js";

const ADJUST_TIME = 20; // DOM adapter internal delay before applying transition CSS

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

describe("DOM — destroy removes turnBoxShow class", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("destroy removes turnBoxShow from the active face", () => {
    const container = document.createElement("div");
    const faceEls: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      container.appendChild(el);
      faceEls.push(el);
    }
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION, delay: DELAY });

    expect(faceEls[0].classList.contains("turnBoxShow")).toBe(true);
    instance.destroy();
    expect(faceEls[0].classList.contains("turnBoxShow")).toBe(false);
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

  it("container style.transition is cleared after destroy() during variable-geometry animation", async () => {
    const container = document.createElement("div");
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);
    const instance = createTurnBox(container, {
      faces: 4,
      duration: DURATION,
      delay: DELAY,
      axis: "X",
      height: 200,
      even: 120,
    });

    instance.next();
    await vi.advanceTimersByTimeAsync(30); // mid-animation, container has transition set
    expect(container.style.transition).not.toBe("");

    instance.destroy();
    expect(container.style.transition).toBe("");
    container.remove();
  });
});

// ── aria-current ──────────────────────────────────────────────────────────────

describe.each(modernAdapters)("%s — aria-current", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
  });

  afterEach(async () => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("face 1 has aria-current on init", () => {
    expect(adapter.getAriaCurrent(1)).toBe("true");
  });

  it("other faces have no aria-current on init", () => {
    expect(adapter.getAriaCurrent(2)).toBeNull();
    expect(adapter.getAriaCurrent(3)).toBeNull();
    expect(adapter.getAriaCurrent(4)).toBeNull();
  });

  it("target face gains aria-current after animation", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaCurrent(2)).toBe("true");
  });

  it("previous face loses aria-current after animation", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaCurrent(1)).toBeNull();
  });

  it("only current face has aria-current after multiple transitions", async () => {
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    adapter.next();
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getAriaCurrent(1)).toBeNull();
    expect(adapter.getAriaCurrent(2)).toBeNull();
    expect(adapter.getAriaCurrent(3)).toBe("true");
    expect(adapter.getAriaCurrent(4)).toBeNull();
  });
});

// ── DOM — aria-current cleaned up by destroy() ───────────────────────────────

describe("DOM — destroy removes aria-current", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("destroy removes aria-current from all faces", () => {
    const container = document.createElement("div");
    const faceEls: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      container.appendChild(el);
      faceEls.push(el);
    }
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION, delay: DELAY });

    expect(faceEls[0].getAttribute("aria-current")).toBe("true");
    instance.destroy();
    for (const face of faceEls) {
      expect(face.getAttribute("aria-current")).toBeNull();
    }
    container.remove();
  });
});

// ── aria-live ─────────────────────────────────────────────────────────────────

describe.each(modernAdapters)("%s — aria-live", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY });
  });

  afterEach(async () => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("live region is present on init", () => {
    expect(adapter.getLiveRegionText()).toBeDefined();
  });

  it("live region text updates after navigation", async () => {
    adapter.goTo(3);
    await adapter.advanceTime(TOTAL + 50);
    expect(adapter.getLiveRegionText()).toContain("3");
  });
});

// ── DOM — prefers-reduced-motion ──────────────────────────────────────────────

describe("DOM — prefers-reduced-motion", () => {
  const mockReducedMotion = () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
          onchange: null,
        }) as MediaQueryList,
    });
  };

  const restoreMatchMedia = () => {
    Object.defineProperty(window, "matchMedia", { writable: true, value: undefined });
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    restoreMatchMedia();
    vi.useRealTimers();
  });

  it("onAnimationEnd fires quickly (duration effectively 0, not 200ms)", async () => {
    mockReducedMotion();
    const onAnimationEnd = vi.fn();
    const container = document.createElement("div");
    for (let i = 0; i < 2; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);

    const instance = createTurnBox(container, { faces: 2, duration: 200, onAnimationEnd });
    instance.next();
    // With duration:0 delay:0, total wait is ADJUST_TIME + 0 = 20ms
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + 5);
    expect(onAnimationEnd).toHaveBeenCalledWith(2);

    instance.destroy();
    container.remove();
  });
});
