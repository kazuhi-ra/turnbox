import { vi } from "vitest";
import { createElement, StrictMode, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { useTurnBox } from "@turnbox/react";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

let counter = 0;

export const createReactAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { facePcs, ...turnBoxOptions } = options;
  const testId = String(counter++);

  const holder: {
    goTo: (face: number, animation?: boolean) => void;
    next: () => void;
    prev: () => void;
    container: HTMLElement | null;
  } = {
    goTo: () => {},
    next: () => {},
    prev: () => {},
    container: null,
  };

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  function TestComponent() {
    const { containerRef, goTo, next, prev } = useTurnBox({ facePcs, ...turnBoxOptions });

    const isFirstRender = useRef(true);
    useEffect(() => {
      if (!isFirstRender.current) return;
      isFirstRender.current = false;
      holder.goTo = goTo;
      holder.next = next;
      holder.prev = prev;
      if (containerRef.current) holder.container = containerRef.current;
    });

    return createElement(
      "div",
      { ref: containerRef, "data-turnbox-test": testId },
      ...Array.from({ length: facePcs }, (_, i) => createElement("div", { key: `face-${i + 1}` })),
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
      holder.goTo(face, animation);
    },

    next() {
      holder.next();
    },

    prev() {
      holder.prev();
    },

    getCurrentFace() {
      const container = getContainer();
      const cls = Array.from(container.classList).find((c) => c.startsWith("turnBoxCurrentFace"));
      return cls ? parseInt(cls.replace("turnBoxCurrentFace", ""), 10) : 1;
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
      };
    },

    getContainerState() {
      const c = getContainer();
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
