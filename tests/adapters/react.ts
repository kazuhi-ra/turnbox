import { vi } from "vitest";
import { createElement, StrictMode, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { useTurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

let counter = 0;

export const createReactAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, ...turnBoxOptions } = options;
  const testId = String(counter++);

  const holder: {
    goTo: (face: number, animation?: boolean) => void;
    next: () => void;
    prev: () => void;
    container: HTMLElement | null;
    getCurrentFace: () => number;
    isAnimating: boolean;
  } = {
    goTo: () => {},
    next: () => {},
    prev: () => {},
    container: null,
    getCurrentFace: () => 1,
    isAnimating: false,
  };

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  function TestComponent() {
    const { containerRef, goTo, next, prev, currentFace, isAnimating } = useTurnBox({
      faces,
      ...turnBoxOptions,
    });

    // goTo/next/prev are stable useCallbacks; update via effect after mount.
    useEffect(() => {
      holder.goTo = goTo;
      holder.next = next;
      holder.prev = prev;
      if (containerRef.current) holder.container = containerRef.current;
    });

    // currentFace and isAnimating change with state; expose as values updated every render.
    holder.getCurrentFace = () => currentFace;
    holder.isAnimating = isAnimating;

    return createElement(
      "div",
      { ref: containerRef, "data-turnbox-test": testId },
      ...Array.from({ length: faces }, (_, i) => {
        const btn = options.withFocusableChildren
          ? createElement("button", { key: "btn", "data-face-btn": String(i + 1) })
          : null;
        return createElement("div", { key: `face-${i + 1}` }, btn);
      }),
    );
  }

  let root: Root;
  act(() => {
    root = createRoot(wrapper);
    root.render(createElement(StrictMode, null, createElement(TestComponent)));
  });

  const getContainer = (): HTMLElement => {
    if (!holder.container) throw new Error("container not mounted");
    return holder.container;
  };

  return {
    goTo(face, animation = true) {
      act(() => {
        holder.goTo(face, animation);
      });
    },

    next() {
      act(() => {
        holder.next();
      });
    },

    prev() {
      act(() => {
        holder.prev();
      });
    },

    getCurrentFace() {
      return holder.getCurrentFace();
    },

    isAnimating() {
      return holder.isAnimating;
    },

    isFaceShown(faceNum) {
      const face = getContainer().querySelector(`.turnBoxFaceNum${faceNum}`);
      return face?.classList.contains("turnBoxShow") ?? false;
    },

    getFaceState(faceNum) {
      const face = getContainer().querySelector(`.turnBoxFaceNum${faceNum}`) as HTMLElement | null;
      return {
        shown: face?.classList.contains("turnBoxShow") ?? false,
        transform: face ? (window.getComputedStyle(face).transform ?? "") : "",
        transformOrigin: face?.style.transformOrigin ?? "",
        inlineHeight: face?.style.height ?? "",
        inlineWidth: face?.style.width ?? "",
        inlineTransition: face?.style.transition ?? "",
      };
    },

    getContainerState() {
      const c = getContainer();
      return {
        inlineHeight: c.style.height,
        inlineLeft: c.style.left,
        inlineTransition: c.style.transition,
        perspective: c.style.perspective,
      };
    },

    getAriaHidden(faceNum) {
      return getContainer().querySelector(`.turnBoxFaceNum${faceNum}`)?.getAttribute("aria-hidden") ?? null;
    },

    getFocusedFaceIndex() {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const c = getContainer();
      for (let i = 1; i <= faces; i++) {
        const faceEl = c.querySelector(`.turnBoxFaceNum${i}`);
        if (faceEl?.contains(el)) return i;
      }
      return null;
    },

    waitForRender() {
      return Promise.resolve();
    },

    async advanceTime(ms) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    },

    destroy() {
      act(() => {
        root.unmount();
      });
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    },
  };
};
