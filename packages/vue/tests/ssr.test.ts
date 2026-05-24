import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, h, nextTick, shallowRef } from "vue";
import { renderToString } from "@vue/server-renderer";
import { mount } from "@vue/test-utils";
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const makeTestComponent = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
  const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

  const TestComponent = defineComponent({
    render() {
      const faceNodes = Array.from({ length: faces }, (_, i) => h(TurnBox.Face, { key: `face-${i + 1}` }));
      return h(TurnBox.Provider, { reduceAnimation: "system setting" }, () =>
        h(
          TurnBox.Root,
          {
            faces,
            ...opts,
            ref: (r: TurnBoxRootHandle | null) => {
              rootHandle.value = r;
            },
          } as Record<string, unknown>,
          () => faceNodes,
        ),
      );
    },
  });

  return { TestComponent, rootHandle };
};

describe("Vue SSR: renderToString + client mount", () => {
  describe("server HTML", () => {
    it("contains data-face-index for all faces", async () => {
      const { TestComponent } = makeTestComponent(4);
      const html = await renderToString(h(TestComponent));
      for (let i = 1; i <= 4; i++) {
        expect(html).toContain(`data-face-index="${i}"`);
      }
    });

    it("face 1 is shown, face 2 is hidden in server HTML", async () => {
      const { TestComponent } = makeTestComponent(4);
      const html = await renderToString(h(TestComponent));
      // face 1: opacity not set to 0
      // face 2: opacity:0 in inline style
      expect(html).toContain('data-face-index="1"');
      expect(html).toMatch(/data-face-index="2"[^>]*style="[^"]*opacity:\s*0/);
    });
  });

  describe("client mount (hydration equivalent)", () => {
    it("getCurrentFace returns 1 after mount", () => {
      const { TestComponent, rootHandle } = makeTestComponent(4);
      const wrapper = mount(TestComponent, { attachTo: document.body });
      expect(rootHandle.value?.getCurrentFace()).toBe(1);
      wrapper.unmount();
    });

    it("face 1 is visible and face 2 is hidden after mount", () => {
      const { TestComponent } = makeTestComponent(4);
      const wrapper = mount(TestComponent, { attachTo: document.body });
      const face1 = wrapper.element.querySelector<HTMLElement>('[data-face-index="1"]');
      const face2 = wrapper.element.querySelector<HTMLElement>('[data-face-index="2"]');
      expect(face1?.style.opacity).not.toBe("0");
      expect(face2?.style.opacity).toBe("0");
      wrapper.unmount();
    });
  });

  describe("navigation after mount", () => {
    it("goTo() changes face", async () => {
      const { TestComponent, rootHandle } = makeTestComponent(4);
      const wrapper = mount(TestComponent, { attachTo: document.body });
      rootHandle.value?.goTo(2, false);
      await nextTick();
      await vi.advanceTimersByTimeAsync(50);
      expect(rootHandle.value?.getCurrentFace()).toBe(2);
      wrapper.unmount();
    });

    it("next() advances to face 2 with animation", async () => {
      const { TestComponent, rootHandle } = makeTestComponent(4, { duration: 50 });
      const wrapper = mount(TestComponent, { attachTo: document.body });
      rootHandle.value?.next();
      await nextTick();
      await vi.advanceTimersByTimeAsync(16);
      await nextTick();
      await vi.advanceTimersByTimeAsync(50);
      await nextTick();
      expect(rootHandle.value?.getCurrentFace()).toBe(2);
      wrapper.unmount();
    });

    it("prev() on face 1 is a no-op", async () => {
      const { TestComponent, rootHandle } = makeTestComponent(4);
      const wrapper = mount(TestComponent, { attachTo: document.body });
      rootHandle.value?.prev();
      await nextTick();
      expect(rootHandle.value?.getCurrentFace()).toBe(1);
      wrapper.unmount();
    });
  });
});
