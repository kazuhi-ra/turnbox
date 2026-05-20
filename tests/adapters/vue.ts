import { vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useTurnBox } from "@turnbox/vue";
import type { TurnBoxTestAdapter, CreateAdapterOptions } from "../suite/adapter.js";

let counter = 0;

export const createVueAdapter = (options: CreateAdapterOptions): TurnBoxTestAdapter => {
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

  const TestComponent = defineComponent({
    setup() {
      const { containerRef, goTo, next, prev } = useTurnBox({ facePcs, ...turnBoxOptions });

      holder.goTo = goTo;
      holder.next = next;
      holder.prev = prev;

      return { containerRef };
    },
    render() {
      return h(
        "div",
        { ref: "containerRef", "data-turnbox-test": testId },
        Array.from({ length: facePcs }, (_, i) => h("div", { key: `face-${i + 1}` })),
      );
    },
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });
  holder.container = wrapper.element as HTMLElement;

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
      await vi.advanceTimersByTimeAsync(ms);
      await nextTick();
    },

    destroy() {
      wrapper.unmount();
    },
  };
};
