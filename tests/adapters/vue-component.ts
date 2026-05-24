import { vi } from "vitest";
import { defineComponent, h, nextTick, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

export const createVueComponentAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, withFocusableChildren, reduceAnimation = "system setting", ...rest } = options;
  const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

  const faceNodes = Array.from({ length: faces }, (_, i) => {
    const btn = options.withFocusableChildren ? h("button", { "data-face-btn": String(i + 1) }) : null;
    return h(TurnBox.Face, { key: `face-${i + 1}` }, btn ? () => [btn] : undefined);
  });

  const TestComponent = defineComponent({
    render() {
      const rootEl = h(
        TurnBox.Root,
        {
          faces: faces as 2 | 3 | 4,
          ...rest,
          ref: (r: TurnBoxRootHandle | null) => {
            rootHandle.value = r;
          },
        },
        () => faceNodes,
      );
      return reduceAnimation ? h(TurnBox.Provider, { reduceAnimation }, () => rootEl) : rootEl;
    },
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });

  const getHandle = (): TurnBoxRootHandle => {
    if (!rootHandle.value) throw new Error("TurnBoxRootHandle not mounted");
    return rootHandle.value;
  };

  const getBoxEl = (): HTMLElement => {
    const el = wrapper.element.querySelector<HTMLElement>("[data-turnbox-box]");
    if (!el) throw new Error("[data-turnbox-box] not found");
    return el;
  };

  const getFaceEl = (faceNum: number): HTMLElement | null =>
    wrapper.element.querySelector<HTMLElement>(`[data-face-index="${faceNum}"]`);

  return {
    goTo(face, animation = true) {
      getHandle().goTo(face, animation);
    },

    next() {
      getHandle().next();
    },

    prev() {
      getHandle().prev();
    },

    getCurrentFace() {
      return getHandle().getCurrentFace();
    },

    isAnimating() {
      return false;
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
      return getFaceEl(faceNum)?.getAttribute("aria-hidden") ?? null;
    },

    getInert(faceNum) {
      const el = getFaceEl(faceNum);
      return el ? el.inert === true || el.hasAttribute("inert") : false;
    },

    getFocusedFaceIndex() {
      const el = document.activeElement;
      if (!el) return null;
      const face = el.closest<HTMLElement>("[data-face-index]");
      return face ? Number(face.getAttribute("data-face-index")) : null;
    },

    async waitForRender() {
      await nextTick();
    },

    async advanceTime(ms) {
      await vi.advanceTimersByTimeAsync(ms);
      await nextTick();
    },

    destroy() {
      wrapper.unmount();
    },
  };
};
