import { vi } from "vitest";
import { defineComponent, h, nextTick, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { useTurnBox, TurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

let counter = 0;

export const createVueAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
  const { faces, withFocusableChildren, reduceAnimation, ...turnBoxOptions } = options;
  const testId = String(counter++);

  const holder: {
    goTo: (face: number, animation?: boolean) => void;
    next: () => void;
    prev: () => void;
    container: HTMLElement | null;
    currentFace: Ref<number> | null;
    isAnimating: Ref<boolean> | null;
  } = {
    goTo: () => {},
    next: () => {},
    prev: () => {},
    container: null,
    currentFace: null,
    isAnimating: null,
  };

  const TestComponent = defineComponent({
    setup() {
      const { containerRef, goTo, next, prev, currentFace, isAnimating } = useTurnBox({
        faces,
        ...turnBoxOptions,
      });

      holder.goTo = goTo;
      holder.next = next;
      holder.prev = prev;
      holder.currentFace = currentFace;
      holder.isAnimating = isAnimating;

      return { containerRef };
    },
    render() {
      return h(
        "div",
        { ref: "containerRef", "data-turnbox-test": testId },
        Array.from({ length: faces }, (_, i) => {
          const btn = options.withFocusableChildren ? h("button", { "data-face-btn": String(i + 1) }) : null;
          return h("div", { key: `face-${i + 1}` }, btn ? [btn] : undefined);
        }),
      );
    },
  });

  const RootComponent = reduceAnimation
    ? defineComponent({ render: () => h(TurnBox.Provider, { reduceAnimation }, () => h(TestComponent)) })
    : TestComponent;

  const wrapper = mount(RootComponent, { attachTo: document.body });
  holder.container =
    (wrapper.element.querySelector("[data-turnbox-test]") as HTMLElement | null) ?? (wrapper.element as HTMLElement);

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
      return holder.currentFace?.value ?? 1;
    },

    isAnimating() {
      return holder.isAnimating?.value ?? false;
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

    getInert(faceNum) {
      return (getContainer().querySelector(`.turnBoxFaceNum${faceNum}`) as HTMLElement | null)?.inert ?? false;
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
