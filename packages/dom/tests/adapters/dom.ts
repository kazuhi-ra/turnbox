import { vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../../../../tests/suite/adapter.js";

let counter = 0;

export const createDomAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, withFocusableChildren, reduceAnimation, ...turnBoxOptions } = options;

  const testId = String(counter++);
  const container = document.createElement("div");
  container.setAttribute("data-turnbox-test", testId);

  for (let i = 0; i < faces; i++) {
    const face = document.createElement("div");
    if (options.withFocusableChildren) {
      const btn = document.createElement("button");
      btn.setAttribute("data-face-btn", String(i + 1));
      face.appendChild(btn);
    }
    container.appendChild(face);
  }
  document.body.appendChild(container);

  const instance = createTurnBox(container, { faces, reduceAnimation, ...turnBoxOptions });

  return {
    goTo(face, animation = true) {
      instance.goTo(face, animation);
    },

    next() {
      instance.next();
    },

    prev() {
      instance.prev();
    },

    getCurrentFace() {
      return instance.getCurrentFace();
    },

    isAnimating() {
      return instance.isAnimating();
    },

    isFaceShown(faceNum) {
      const face = container.querySelector(`.turnBoxFaceNum${faceNum}`);
      return face?.classList.contains("turnBoxShow") ?? false;
    },

    getFaceState(faceNum) {
      const face = container.querySelector(`.turnBoxFaceNum${faceNum}`) as HTMLElement | null;
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
      return {
        inlineHeight: container.style.height,
        inlineLeft: container.style.left,
        inlineTransition: container.style.transition,
        perspective: container.style.perspective,
      };
    },

    getAriaHidden(faceNum) {
      return container.querySelector(`.turnBoxFaceNum${faceNum}`)?.getAttribute("aria-hidden") ?? null;
    },

    getInert(faceNum) {
      return (container.querySelector(`.turnBoxFaceNum${faceNum}`) as HTMLElement | null)?.inert ?? false;
    },

    getFocusedFaceIndex() {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      for (let i = 1; i <= faces; i++) {
        const faceEl = container.querySelector(`.turnBoxFaceNum${i}`);
        if (faceEl?.contains(el)) return i;
      }
      return null;
    },

    waitForRender() {
      return Promise.resolve();
    },

    async advanceTime(ms) {
      await vi.advanceTimersByTimeAsync(ms);
    },

    destroy() {
      instance.destroy();
      if (container.parentNode) container.parentNode.removeChild(container);
    },
  };
};
