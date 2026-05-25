import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;

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

describe("DOM — destroy removes inert", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("destroy removes inert from all faces", async () => {
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
    expect(faceEls[0].inert).toBe(true); // face 1 is now hidden

    instance.destroy();
    for (const face of faceEls) {
      expect(face.inert).toBe(false);
    }
    container.remove();
  });
});

describe("DOM — ariaLabel sets role and aria-label on container", () => {
  it("sets role=region and aria-label when ariaLabel is provided", () => {
    const container = document.createElement("div");
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, ariaLabel: "Image rotator" });

    expect(container.getAttribute("role")).toBe("region");
    expect(container.getAttribute("aria-label")).toBe("Image rotator");

    instance.destroy();
    container.remove();
  });

  it("removes role and aria-label on destroy", () => {
    const container = document.createElement("div");
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4, ariaLabel: "Image rotator" });

    instance.destroy();
    expect(container.getAttribute("role")).toBeNull();
    expect(container.getAttribute("aria-label")).toBeNull();
    container.remove();
  });

  it("does not set role when ariaLabel is omitted", () => {
    const container = document.createElement("div");
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement("div"));
    document.body.appendChild(container);
    const instance = createTurnBox(container, { faces: 4 });

    expect(container.getAttribute("role")).toBeNull();

    instance.destroy();
    container.remove();
  });
});
