import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, Fragment, h, nextTick, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";
import { useTurnBoxContext } from "../src/TurnBox/context.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const mountTurnBox = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
  const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

  const TestComponent = defineComponent({
    render() {
      const faceNodes = Array.from({ length: faces }, (_, i) =>
        h(TurnBox.Face, { key: `face-${i + 1}`, "data-testid": `face-${i + 1}` }),
      );
      return h(
        TurnBox.Root,
        {
          faces,
          ...opts,
          ref: (r: TurnBoxRootHandle | null) => {
            rootHandle.value = r;
          },
        } as Record<string, unknown>,
        () => faceNodes,
      );
    },
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });

  const getHandle = (): TurnBoxRootHandle => {
    if (!rootHandle.value) throw new Error("handle not mounted");
    return rootHandle.value;
  };

  const getFaceEl = (n: number) => wrapper.element.querySelector<HTMLElement>(`[data-face-index="${n}"]`);

  return { wrapper, getHandle, getFaceEl };
};

describe("TurnBox.Face positional indexing", () => {
  it("injects data-face-index starting at 1", () => {
    const { getFaceEl, wrapper } = mountTurnBox(4);
    for (let i = 1; i <= 4; i++) {
      expect(getFaceEl(i)).not.toBeNull();
    }
    wrapper.unmount();
  });

  it("extra Face components beyond faces are not rendered", () => {
    const TestComponent = defineComponent({
      render() {
        return h(TurnBox.Root, { faces: 2 } as Record<string, unknown>, () => [
          h(TurnBox.Face, { key: "1" }),
          h(TurnBox.Face, { key: "2" }),
          h(TurnBox.Face, { key: "3" }), // extra
        ]);
      },
    });
    const wrapper = mount(TestComponent, { attachTo: document.body });
    expect(wrapper.element.querySelector("[data-face-index='1']")).not.toBeNull();
    expect(wrapper.element.querySelector("[data-face-index='2']")).not.toBeNull();
    expect(wrapper.element.querySelector("[data-face-index='3']")).toBeNull();
    wrapper.unmount();
  });

  it("non-Face siblings do not affect _faceIndex numbering", () => {
    const TestComponent = defineComponent({
      render() {
        return h(TurnBox.Root, { faces: 3 } as Record<string, unknown>, () => [
          h(TurnBox.Face, { key: "1" }),
          h("div", { key: "sep" }),
          h(TurnBox.Face, { key: "2" }),
          h(TurnBox.Face, { key: "3" }),
        ]);
      },
    });
    const wrapper = mount(TestComponent, { attachTo: document.body });
    expect(wrapper.element.querySelector("[data-face-index='1']")).not.toBeNull();
    expect(wrapper.element.querySelector("[data-face-index='2']")).not.toBeNull();
    expect(wrapper.element.querySelector("[data-face-index='3']")).not.toBeNull();
    wrapper.unmount();
  });

  it("Face components wrapped in a Fragment (v-for pattern) are correctly indexed", () => {
    const TestComponent = defineComponent({
      render() {
        // Manually reproduce the Fragment structure that v-for generates after template compilation
        const fragment = h(
          Fragment,
          null,
          Array.from({ length: 4 }, (_, i) => h(TurnBox.Face, { key: `face-${i + 1}` })),
        );
        return h(TurnBox.Root, { faces: 4 } as Record<string, unknown>, () => [fragment]);
      },
    });
    const wrapper = mount(TestComponent, { attachTo: document.body });
    for (let i = 1; i <= 4; i++) {
      expect(wrapper.element.querySelector(`[data-face-index="${i}"]`)).not.toBeNull();
    }
    expect(wrapper.element.querySelector("[data-face-index='1']")?.style.opacity).not.toBe("0");
    expect(wrapper.element.querySelector("[data-face-index='2']")?.style.opacity).toBe("0");
    wrapper.unmount();
  });
});

describe("TurnBox.Button", () => {
  const mountWithButtons = (faces: 2 | 3 | 4 = 4) => {
    const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

    const TestComponent = defineComponent({
      render() {
        const faceNodes = Array.from({ length: faces }, (_, i) => {
          const nextBtn = i < faces - 1 ? h(TurnBox.Button, { "data-testid": `next-${i + 1}` }, () => "Next") : null;
          const prevBtn =
            i > 0
              ? h(TurnBox.Button, { direction: "prev" as const, "data-testid": `prev-${i + 1}` }, () => "Prev")
              : null;
          return h(TurnBox.Face, { key: `face-${i + 1}` }, () => [nextBtn, prevBtn].filter(Boolean));
        });

        return h(
          TurnBox.Root,
          {
            faces,
            duration: 600,
            ref: (r: TurnBoxRootHandle | null) => {
              rootHandle.value = r;
            },
          } as Record<string, unknown>,
          () => faceNodes,
        );
      },
    });

    const wrapper = mount(TestComponent, { attachTo: document.body });

    const getHandle = (): TurnBoxRootHandle => {
      if (!rootHandle.value) throw new Error("handle not mounted");
      return rootHandle.value;
    };

    const click = async (testId: string) => {
      const btn = wrapper.element.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
      if (!btn) throw new Error(`Button [data-testid="${testId}"] not found`);
      btn.click();
      await nextTick();
    };

    return { wrapper, getHandle, click };
  };

  it("Next button advances to the next face", async () => {
    const { getHandle, click } = mountWithButtons();
    await click("next-1");
    await vi.advanceTimersByTimeAsync(600);
    await nextTick();
    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("Prev button goes back to the previous face", async () => {
    const { getHandle, click } = mountWithButtons();
    await click("next-1");
    await vi.advanceTimersByTimeAsync(700);
    await nextTick();
    await click("prev-2");
    await vi.advanceTimersByTimeAsync(700);
    await nextTick();
    expect(getHandle().getCurrentFace()).toBe(1);
  });
});

describe("TurnBox.Button to={N}", () => {
  it("navigates directly to target face", async () => {
    const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

    const TestComponent = defineComponent({
      render() {
        const faces = Array.from({ length: 4 }, (_, i) =>
          h(TurnBox.Face, { key: `face-${i + 1}` }, () =>
            i === 0 ? [h(TurnBox.Button, { to: 3, "data-testid": "goto3" }, () => "Go 3")] : [],
          ),
        );
        return h(
          TurnBox.Root,
          {
            faces: 4,
            type: "skip",
            duration: 600,
            ref: (r: TurnBoxRootHandle | null) => {
              rootHandle.value = r;
            },
          } as Record<string, unknown>,
          () => faces,
        );
      },
    });

    const wrapper = mount(TestComponent, { attachTo: document.body });

    const btn = wrapper.element.querySelector<HTMLButtonElement>('[data-testid="goto3"]');
    btn?.click();
    await nextTick();
    await vi.advanceTimersByTimeAsync(600);
    await nextTick();

    expect(rootHandle.value?.getCurrentFace()).toBe(3);
    wrapper.unmount();
  });
});

describe("TurnBox.Face style prop", () => {
  it("merges user style with computed position style", () => {
    const TestComponent = defineComponent({
      render() {
        return h(TurnBox.Root, { faces: 2 } as Record<string, unknown>, () => [
          h(TurnBox.Face, { style: { background: "red" } }),
          h(TurnBox.Face, {}),
        ]);
      },
    });

    const wrapper = mount(TestComponent, { attachTo: document.body });

    const face1 = wrapper.element.querySelector<HTMLElement>("[data-face-index='1']");
    expect(face1?.style.background).toBe("red");
    expect(face1?.style.position).toBe("absolute");

    wrapper.unmount();
  });
});

describe("focus management", () => {
  const mountWithFocusable = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
    const rootHandle = shallowRef<TurnBoxRootHandle | null>(null);

    const TestComponent = defineComponent({
      render() {
        const faceNodes = Array.from({ length: faces }, (_, i) =>
          h(TurnBox.Face, { key: `face-${i + 1}` }, () => [
            h("button", { "data-testid": `btn-face-${i + 1}` }, `Face ${i + 1}`),
          ]),
        );
        return h(
          TurnBox.Root,
          {
            faces,
            ...opts,
            ref: (r: TurnBoxRootHandle | null) => {
              rootHandle.value = r;
            },
          } as Record<string, unknown>,
          () => faceNodes,
        );
      },
    });

    const wrapper = mount(TestComponent, { attachTo: document.body });

    const getHandle = (): TurnBoxRootHandle => {
      if (!rootHandle.value) throw new Error("handle not mounted");
      return rootHandle.value;
    };

    return { wrapper, getHandle };
  };

  it("focuses first focusable element in target face after instant goTo (animation=false)", async () => {
    const { wrapper, getHandle } = mountWithFocusable(4, { duration: 0 });

    getHandle().goTo(2, false);
    await nextTick();
    await vi.advanceTimersByTimeAsync(0);
    await nextTick();

    const btn2 = wrapper.element.querySelector<HTMLElement>('[data-testid="btn-face-2"]');
    expect(document.activeElement).toBe(btn2);
    wrapper.unmount();
  });

  it("focuses first focusable element in target face after animated goTo", async () => {
    const { wrapper, getHandle } = mountWithFocusable(4, { duration: 100 });

    getHandle().goTo(2, true);
    await nextTick();
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();

    const btn2 = wrapper.element.querySelector<HTMLElement>('[data-testid="btn-face-2"]');
    expect(document.activeElement).toBe(btn2);
    wrapper.unmount();
  });
});

describe("TurnBox.Root ariaLabel", () => {
  it("sets role=region and aria-label when ariaLabel is provided", () => {
    const TestComponent = defineComponent({
      render() {
        return h(TurnBox.Root, { faces: 2, ariaLabel: "Image rotator" } as Record<string, unknown>, () => [
          h(TurnBox.Face, { key: "1" }),
          h(TurnBox.Face, { key: "2" }),
        ]);
      },
    });
    const wrapper = mount(TestComponent, { attachTo: document.body });
    expect(wrapper.element.getAttribute("role")).toBe("region");
    expect(wrapper.element.getAttribute("aria-label")).toBe("Image rotator");
    wrapper.unmount();
  });

  it("does not set role when ariaLabel is omitted", () => {
    const TestComponent = defineComponent({
      render() {
        return h(TurnBox.Root, { faces: 2 } as Record<string, unknown>, () => [
          h(TurnBox.Face, { key: "1" }),
          h(TurnBox.Face, { key: "2" }),
        ]);
      },
    });
    const wrapper = mount(TestComponent, { attachTo: document.body });
    expect(wrapper.element.getAttribute("role")).toBeNull();
    wrapper.unmount();
  });
});

describe("useTurnBoxContext outside Root", () => {
  it("throws when used outside TurnBox.Root", () => {
    const BadComponent = defineComponent({
      setup() {
        useTurnBoxContext();
        return {};
      },
      render: () => h("div"),
    });

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      mount(BadComponent, { attachTo: document.body });
    }).toThrow();
    warn.mockRestore();
  });
});
