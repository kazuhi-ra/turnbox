import { vi } from "vitest";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

type JQueryStatic = {
  (selector: string): JQueryInstance;
  fn: Record<string, unknown>;
};

type JQueryInstance = {
  turnBox(options?: Record<string, unknown>): JQueryInstance;
  turnBoxAnimate(options: { face: number; animation?: boolean }): JQueryInstance;
};

// Lazy accessor for globalThis.$
const $$ = (): JQueryStatic => (globalThis as unknown as Record<string, JQueryStatic>).$;

let counter = 0;

export const createJQueryAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, ...turnBoxOptions } = options;

  // Use a data attribute as the unique identifier for this test instance.
  // jQuery selector via [data-turnbox-test="N"] becomes box.selector in turnBox.js,
  // which is then used as the CSS selector prefix — so no class/id needed.
  const testId = String(counter++);
  const selector = `[data-turnbox-test="${testId}"]`;

  const container = document.createElement("div");
  container.setAttribute("data-turnbox-test", testId);

  for (let i = 0; i < faces; i++) {
    container.appendChild(document.createElement("div"));
  }
  document.body.appendChild(container);

  $$()(selector).turnBox(turnBoxOptions as Record<string, unknown>);

  const getCurrentFace = (): number => {
    const cls = Array.from(container.classList).find((c) => c.startsWith("turnBoxCurrentFace"));
    return cls ? parseInt(cls.replace("turnBoxCurrentFace", ""), 10) : 1;
  };

  return {
    goTo(face, animation = true) {
      $$()(selector).turnBoxAnimate({ face, animation });
    },

    next() {
      $$()(selector).turnBoxAnimate({ face: getCurrentFace() + 1 });
    },

    prev() {
      $$()(selector).turnBoxAnimate({ face: getCurrentFace() - 1 });
    },

    getCurrentFace,

    isFaceShown(faceNum) {
      const face =
        container.querySelector(`[data-turnbox-face="${faceNum}"]`) ??
        container.querySelector(`.turnBoxFaceNum${faceNum}`);
      return face?.classList.contains("turnBoxShow") ?? false;
    },

    getFaceState(faceNum) {
      const face = (container.querySelector(`[data-turnbox-face="${faceNum}"]`) ??
        container.querySelector(`.turnBoxFaceNum${faceNum}`)) as HTMLElement | null;
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

    getAriaHidden(_faceNum) {
      return null;
    },

    getInert(_faceNum) {
      return false;
    },

    getFocusedFaceIndex() {
      return null;
    },

    waitForRender() {
      return Promise.resolve();
    },

    async advanceTime(ms) {
      await vi.advanceTimersByTimeAsync(ms);
    },

    destroy() {
      if (container.parentNode) container.parentNode.removeChild(container);
      // Style tag ID is derived from encode_class_id(selector).
      // encode_class_id only transforms . # and spaces, so brackets/quotes remain —
      // look up the style element by searching for any whose id starts with turnBoxStyle-.
      document.head.querySelectorAll('style[id*="turnBoxStyle"]').forEach((el) => {
        el.remove();
      });
    },
  };
};
