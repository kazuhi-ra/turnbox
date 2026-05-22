import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTurnBox } from "@turnbox/react";
import { createElement, StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

const setup = () => {
  const holder: { next: () => void; isAnimating: boolean } = {
    next: () => {},
    isAnimating: false,
  };

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  function TestComponent() {
    const { containerRef, next, isAnimating } = useTurnBox({
      facePcs: 4,
      duration: DURATION,
      delay: DELAY,
    });
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (!isFirstRender.current) return;
      isFirstRender.current = false;
      holder.next = next;
    });
    holder.isAnimating = isAnimating;
    return createElement(
      "div",
      { ref: containerRef },
      createElement("div"),
      createElement("div"),
      createElement("div"),
      createElement("div"),
    );
  }

  let root: ReturnType<typeof createRoot>;
  act(() => {
    root = createRoot(wrapper);
    root.render(createElement(StrictMode, null, createElement(TestComponent)));
  });

  return {
    holder,
    destroy() {
      act(() => root.unmount());
      wrapper.remove();
    },
  };
};

describe("isAnimating — React", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false initially", () => {
    const { holder, destroy } = setup();
    expect(holder.isAnimating).toBe(false);
    destroy();
  });

  it("is true while animation is in progress", async () => {
    const { holder, destroy } = setup();
    act(() => holder.next());
    await act(() => vi.advanceTimersByTimeAsync(ADJUST_TIME));
    expect(holder.isAnimating).toBe(true);
    destroy();
  });

  it("is false after animation completes", async () => {
    const { holder, destroy } = setup();
    act(() => holder.next());
    await act(() => vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1));
    expect(holder.isAnimating).toBe(false);
    destroy();
  });
});
