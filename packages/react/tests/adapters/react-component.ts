import { vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../../../../tests/adapter.js";

export const createReactComponentAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, withFocusableChildren, reduceAnimation, ...rest } = options;
  const rootRef = createRef<TurnBoxRootHandle>();

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const faceNodes = Array.from({ length: faces }, (_, i) => {
    const btn = options.withFocusableChildren
      ? createElement("button", { key: "btn", type: "button", "data-face-btn": String(i + 1) })
      : null;
    return createElement(TurnBox.Face, { key: `face-${i + 1}` }, btn);
  });

  const rootEl = createElement(TurnBox.Root, { faces: faces as 2 | 3 | 4, ...rest, ref: rootRef }, ...faceNodes);
  const tree = reduceAnimation ? createElement(TurnBox.Provider, { reduceAnimation }, rootEl) : rootEl;

  let root: Root;
  act(() => {
    root = createRoot(wrapper);
    root.render(createElement(StrictMode, null, tree));
  });

  const getHandle = (): TurnBoxRootHandle => {
    if (!rootRef.current) throw new Error("TurnBoxRootHandle not mounted");
    return rootRef.current;
  };

  const getBoxEl = (): HTMLElement => {
    const el = wrapper.querySelector<HTMLElement>("[data-turnbox-box]");
    if (!el) throw new Error("[data-turnbox-box] not found");
    return el;
  };

  const getFaceEl = (faceNum: number): HTMLElement | null =>
    wrapper.querySelector<HTMLElement>(`[data-face-index="${faceNum}"]`);

  return {
    goTo(face, animation = true) {
      act(() => {
        getHandle().goTo(face, animation);
      });
    },

    next() {
      act(() => {
        getHandle().next();
      });
    },

    prev() {
      act(() => {
        getHandle().prev();
      });
    },

    getCurrentFace() {
      return getHandle().getCurrentFace();
    },

    isAnimating() {
      return getHandle().isAnimating();
    },

    isFaceShown(faceNum) {
      const face = getFaceEl(faceNum);
      return face ? face.style.opacity !== "0" : false;
    },

    getFaceState(faceNum) {
      const face = getFaceEl(faceNum);
      return {
        shown: face ? face.style.opacity !== "0" : false,
        transform: face ? (window.getComputedStyle(face).transform ?? "") : "",
        transformOrigin: face?.style.transformOrigin ?? "",
        inlineHeight: face?.style.height ?? "",
        inlineWidth: face?.style.width ?? "",
        inlineTransition: face?.style.transition ?? "",
      };
    },

    getContainerState() {
      const c = getBoxEl();
      return {
        inlineHeight: c.style.height,
        inlineLeft: c.style.left,
        inlineTransition: c.style.transition,
        perspective: (c.parentElement as HTMLElement | null)?.style.perspective ?? "",
      };
    },

    getAriaHidden(faceNum) {
      return wrapper.querySelector(`[data-face-index="${faceNum}"]`)?.getAttribute("aria-hidden") ?? null;
    },

    getInert(faceNum) {
      const el = wrapper.querySelector(`[data-face-index="${faceNum}"]`) as HTMLElement | null;
      return el ? el.inert === true || el.hasAttribute("inert") : false;
    },

    getFocusedFaceIndex() {
      const el = document.activeElement;
      if (!el) return null;
      const face = el.closest<HTMLElement>("[data-face-index]");
      return face ? Number(face.getAttribute("data-face-index")) : null;
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
