import { vi } from "vitest";
import { createTurnBox } from "@turnbox/dom";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

let counter = 0;

export const createDomAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { facePcs, ...turnBoxOptions } = options;

  const testId = String(counter++);
  const container = document.createElement("div");
  container.setAttribute("data-turnbox-test", testId);

  for (let i = 0; i < facePcs; i++) {
    container.appendChild(document.createElement("div"));
  }
  document.body.appendChild(container);

  const instance = createTurnBox(container, { facePcs, ...turnBoxOptions });

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
      };
    },

    getContainerState() {
      return {
        inlineHeight: container.style.height,
        inlineLeft: container.style.left,
        inlineTransition: container.style.transition,
      };
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
