import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { TurnBox } from "@turnbox/react";
import type { TurnBoxRootHandle } from "@turnbox/react";
import { useTurnBoxContext } from "../../packages/react/src/TurnBox/context.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const mountTurnBox = (facePcs: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
  const ref = createRef<TurnBoxRootHandle>();
  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const faces = Array.from({ length: facePcs }, (_, i) =>
    createElement(TurnBox.Face, { key: `face-${i + 1}`, "data-testid": `face-${i + 1}` }),
  );

  act(() => {
    const root = createRoot(wrapper);
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(TurnBox.Root, { options: { facePcs, ...opts }, ref }, ...faces),
      ),
    );
  });

  const getHandle = () => {
    if (!ref.current) throw new Error("handle not mounted");
    return ref.current;
  };

  const getFaceEl = (n: number) =>
    wrapper.querySelector<HTMLElement>(`[data-face-index="${n}"]`);

  return { wrapper, getHandle, getFaceEl };
};

describe("TurnBox.Root handle", () => {
  it("getCurrentFace returns 1 initially", () => {
    const { getHandle } = mountTurnBox();
    expect(getHandle().getCurrentFace()).toBe(1);
  });

  it("go() advances the face", () => {
    const { getHandle } = mountTurnBox();
    act(() => {
      getHandle().go(2, false);
    });
    expect(getHandle().getCurrentFace()).toBe(2);
  });
});

describe("TurnBox.Face positional indexing", () => {
  it("injects data-face-index starting at 1", () => {
    const { getFaceEl } = mountTurnBox(4);
    for (let i = 1; i <= 4; i++) {
      expect(getFaceEl(i)).not.toBeNull();
    }
  });

  it("face 1 is visible and face 2 is hidden on mount", () => {
    const { getFaceEl } = mountTurnBox(4);
    expect(getFaceEl(1)?.style.opacity).not.toBe("0");
    expect(getFaceEl(2)?.style.opacity).toBe("0");
  });
});

describe("TurnBox.Button", () => {
  const mountWithButtons = (facePcs: 2 | 3 | 4 = 4) => {
    const ref = createRef<TurnBoxRootHandle>();
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const faces = Array.from({ length: facePcs }, (_, i) => {
      const nextBtn =
        i < facePcs - 1
          ? createElement(TurnBox.Button, { "data-testid": `next-${i + 1}` }, "Next")
          : null;
      const prevBtn =
        i > 0
          ? createElement(TurnBox.Button, { direction: "prev" as const, "data-testid": `prev-${i + 1}` }, "Prev")
          : null;
      return createElement(TurnBox.Face, { key: `face-${i + 1}` }, nextBtn, prevBtn);
    });

    act(() => {
      const root = createRoot(wrapper);
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(TurnBox.Root, { options: { facePcs, duration: 600 }, ref }, ...faces),
        ),
      );
    });

    const getHandle = () => {
      if (!ref.current) throw new Error("handle not mounted");
      return ref.current;
    };

    const click = (testId: string) => {
      const btn = wrapper.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
      if (!btn) throw new Error(`Button [data-testid="${testId}"] not found`);
      act(() => {
        btn.click();
      });
    };

    return { wrapper, getHandle, click };
  };

  it("Next button advances to the next face", async () => {
    const { getHandle, click } = mountWithButtons();
    click("next-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("Prev button goes back to the previous face", async () => {
    const { getHandle, click } = mountWithButtons();
    // navigate to face 2 via next button (with animation)
    click("next-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    // click prev from face 2 to go back to face 1
    click("prev-2");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(getHandle().getCurrentFace()).toBe(1);
  });
});

describe("TurnBox.Button to={N}", () => {
  it("navigates directly to target face", async () => {
    const ref = createRef<TurnBoxRootHandle>();
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const faces = Array.from({ length: 4 }, (_, i) =>
      createElement(
        TurnBox.Face,
        { key: `face-${i + 1}` },
        i === 0 ? createElement(TurnBox.Button, { to: 3, "data-testid": "goto3" }, "Go 3") : null,
      ),
    );

    act(() => {
      const root = createRoot(wrapper);
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            TurnBox.Root,
            { options: { facePcs: 4, type: "skip", duration: 600 }, ref },
            ...faces,
          ),
        ),
      );
    });

    const btn = wrapper.querySelector<HTMLButtonElement>('[data-testid="goto3"]');
    act(() => {
      btn?.click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(ref.current?.getCurrentFace()).toBe(3);
  });
});

describe("TurnBox.Face style prop", () => {
  it("merges user style with computed position style", () => {
    const ref = createRef<TurnBoxRootHandle>();
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    act(() => {
      const root = createRoot(wrapper);
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            TurnBox.Root,
            { options: { facePcs: 2 }, ref },
            createElement(TurnBox.Face, { style: { background: "red" } }),
            createElement(TurnBox.Face, {}),
          ),
        ),
      );
    });

    const face1 = wrapper.querySelector<HTMLElement>("[data-face-index='1']");
    expect(face1?.style.background).toBe("red");
    // position: absolute must still be applied
    expect(face1?.style.position).toBe("absolute");
  });
});

describe("useTurnBoxContext outside Root", () => {
  it("throws when used outside TurnBox.Root", () => {
    function BadComponent() {
      useTurnBoxContext();
      return null;
    }

    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const onError = (e: ErrorEvent) => e.preventDefault();
    window.addEventListener("error", onError);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => {
        act(() => {
          const root = createRoot(wrapper);
          root.render(createElement(BadComponent));
        });
      }).toThrow();
    } finally {
      spy.mockRestore();
      window.removeEventListener("error", onError);
    }
  });
});
