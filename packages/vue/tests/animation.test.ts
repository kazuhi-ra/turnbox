import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, h, nextTick, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const mountTurnBox = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
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

  const wrapper = mount(TestComponent, { attachTo: document.body });

  const getHandle = (): TurnBoxRootHandle => {
    if (!rootHandle.value) throw new Error("handle not mounted");
    return rootHandle.value;
  };

  const getFaceEl = (n: number) => wrapper.element.querySelector<HTMLElement>(`[data-face-index="${n}"]`);

  // Navigates without animation and waits until isAnimatingFlag is released
  const navigateTo = async (face: number, duration: number) => {
    getHandle().goTo(face, false);
    await nextTick();
    await vi.advanceTimersByTimeAsync(duration);
    await nextTick();
  };

  return { wrapper, getHandle, getFaceEl, navigateTo };
};

// ──────────────────────────────────────────────────────────
// simple step: step.doAnimate=true, hasAdjust=false
// Starts from face 1; no setup needed.
// ──────────────────────────────────────────────────────────
describe("simple step animation: transition CSS before transform change", () => {
  it("displayFace does not advance before rAF fires (next)", async () => {
    const { getHandle } = mountTurnBox(2, { duration: 200 });

    getHandle().next();
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(1);
  });

  it("transition CSS is set on faces before displayFace changes", async () => {
    const { getHandle, getFaceEl } = mountTurnBox(2, { duration: 200 });

    getHandle().next();
    await nextTick();

    expect(getFaceEl(2)?.style.transition).toContain("transform");
    expect(getHandle().getCurrentFace()).toBe(1);
  });

  it("displayFace advances and animation completes after rAF + duration", async () => {
    const { getHandle } = mountTurnBox(2, { duration: 200 });

    getHandle().next();
    await nextTick();
    await vi.advanceTimersByTimeAsync(16); // rAF → displayFace changes
    await nextTick();
    await vi.advanceTimersByTimeAsync(200); // animation duration
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("displayFace does not advance before rAF fires (prev)", async () => {
    const { getHandle, navigateTo } = mountTurnBox(3, { duration: 200 });
    await navigateTo(2, 200); // isAnimatingFlag cleared

    getHandle().prev();
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────
// direct-wrap: face4→face1 wrap with type="repeat"
// navigation.ts returns { kind: "direct-wrap" }, which falls through to the common goTo() tail.
// ──────────────────────────────────────────────────────────
describe("direct-wrap animation: transition CSS before transform change", () => {
  it("displayFace stays at 4 before rAF fires when wrapping face4 → face1", async () => {
    const { getHandle, navigateTo } = mountTurnBox(4, { type: "repeat", duration: 200 });
    await navigateTo(4, 200); // isAnimatingFlag cleared

    getHandle().next(); // direct-wrap: face4 → face1
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(4);
  });

  it("displayFace advances to 1 after rAF + duration", async () => {
    const { getHandle, navigateTo } = mountTurnBox(4, { type: "repeat", duration: 200 });
    await navigateTo(4, 200);

    getHandle().next();
    await nextTick();
    await vi.advanceTimersByTimeAsync(16);
    await nextTick();
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────
// adjusting: step.hasAdjust=true, doAnimate=true
// even + type="real" + direction="positive" makes face2→face3 hit ADJUST_PAIRS.
// The watch(phase, { flush: "post" }) handler updates displayFace and phase together.
// ──────────────────────────────────────────────────────────
describe("adjusting animation: transition CSS before transform change", () => {
  const adjustOpts = { height: 30, even: 60, type: "real", direction: "positive", duration: 200 };

  it("displayFace stays at 2 before rAF fires on goTo(3) via adjusting path", async () => {
    const { getHandle, navigateTo } = mountTurnBox(4, adjustOpts);
    await navigateTo(2, 200); // isAnimatingFlag cleared

    getHandle().goTo(3); // adjusting path
    await nextTick(); // phase1 flush + post-flush watcher fires

    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("transition CSS is set before displayFace changes (adjusting)", async () => {
    const { getFaceEl, getHandle, navigateTo } = mountTurnBox(4, adjustOpts);
    await navigateTo(2, 200);

    getHandle().goTo(3);
    await nextTick(); // watcher fires: phase="adjust-animating" queued
    await nextTick(); // DOM updated with watcher's changes

    expect(getFaceEl(3)?.style.transition).toContain("transform");
    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("displayFace advances to 3 after rAF + duration (adjusting)", async () => {
    const { getHandle, navigateTo } = mountTurnBox(4, adjustOpts);
    await navigateTo(2, 200);

    getHandle().goTo(3);
    await nextTick();
    await vi.advanceTimersByTimeAsync(16); // rAF → displayFace changes
    await nextTick();
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();

    expect(getHandle().getCurrentFace()).toBe(3);
  });
});
