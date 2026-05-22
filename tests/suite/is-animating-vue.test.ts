import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTurnBox } from "@turnbox/vue";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, watch } from "vue";

const DURATION = 200;
const DELAY = 0;
const ADJUST_TIME = 20;
const TOTAL = DURATION + DELAY;

const createWrapper = () => {
  const holder: { next: () => void; isAnimating: boolean } = {
    next: () => {},
    isAnimating: false,
  };

  const TestComponent = defineComponent({
    setup() {
      const { containerRef, next, isAnimating } = useTurnBox({
        facePcs: 4,
        duration: DURATION,
        delay: DELAY,
      });
      holder.next = next;
      watch(isAnimating, (val) => { holder.isAnimating = val; }, { immediate: true });
      return { containerRef };
    },
    render() {
      return h("div", { ref: "containerRef" }, [h("div"), h("div"), h("div"), h("div")]);
    },
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });
  return {
    holder,
    destroy() {
      wrapper.unmount();
    },
  };
};

describe("isAnimating — Vue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false initially", () => {
    const { holder, destroy } = createWrapper();
    expect(holder.isAnimating).toBe(false);
    destroy();
  });

  it("is true while animation is in progress", async () => {
    const { holder, destroy } = createWrapper();
    holder.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME);
    await nextTick();
    expect(holder.isAnimating).toBe(true);
    destroy();
  });

  it("is false after animation completes", async () => {
    const { holder, destroy } = createWrapper();
    holder.next();
    await vi.advanceTimersByTimeAsync(ADJUST_TIME + TOTAL + 1);
    await nextTick();
    expect(holder.isAnimating).toBe(false);
    destroy();
  });
});
