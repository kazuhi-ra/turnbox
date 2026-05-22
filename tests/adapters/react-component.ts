import { vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { TurnBox } from "@turnbox/react";
import type { TurnBoxRootHandle } from "@turnbox/react";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

export const createReactComponentAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { facePcs, ...rest } = options;
  const rootRef = createRef<TurnBoxRootHandle>();

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const faces = Array.from({ length: facePcs }, (_, i) =>
    createElement(TurnBox.Face, { key: `face-${i + 1}` }),
  );

  const rootEl = createElement(
    TurnBox.Root,
    { options: { facePcs: facePcs as 2 | 3 | 4, ...rest }, ref: rootRef },
    ...faces,
  );

  let root: Root;
  act(() => {
    root = createRoot(wrapper);
    root.render(createElement(StrictMode, null, rootEl));
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
        getHandle().go(face, animation);
      });
    },

    next() {
      act(() => {
        getHandle().go(getHandle().getCurrentFace() + 1, true);
      });
    },

    prev() {
      act(() => {
        getHandle().go(getHandle().getCurrentFace() - 1, true);
      });
    },

    getCurrentFace() {
      return getHandle().getCurrentFace();
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
      };
    },

    getContainerState() {
      const c = getBoxEl();
      return {
        inlineHeight: c.style.height,
        inlineLeft: c.style.left,
        inlineTransition: c.style.transition,
      };
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
