import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";
import { useTurnBoxContext } from "../src/TurnBox/context.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const mountTurnBox = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
  const ref = createRef<TurnBoxRootHandle>();
  const faceNodes = Array.from({ length: faces }, (_, i) => createElement(TurnBox.Face, { key: `face-${i + 1}` }));
  const element = createElement(TurnBox.Root, { faces, ...opts, ref }, ...faceNodes);

  const container = document.createElement("div");
  document.body.appendChild(container);

  let root: ReturnType<typeof createRoot>;
  act(() => {
    root = createRoot(container);
    root.render(element);
  });

  const getHandle = (): TurnBoxRootHandle => {
    if (!ref.current) throw new Error("handle not mounted");
    return ref.current;
  };

  const getFaceEl = (n: number) => container.querySelector<HTMLElement>(`[data-face-index="${n}"]`);

  const destroy = () => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };

  return { container, getHandle, getFaceEl, destroy };
};

describe("TurnBox.Face positional indexing", () => {
  it("injects data-face-index starting at 1", () => {
    const { getFaceEl, destroy } = mountTurnBox(4);
    for (let i = 1; i <= 4; i++) {
      expect(getFaceEl(i)).not.toBeNull();
    }
    destroy();
  });

  it("extra Face components beyond faces are not rendered", () => {
    const ref = createRef<TurnBoxRootHandle>();
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = createRoot(container);
      root.render(
        createElement(
          TurnBox.Root,
          { faces: 2, ref },
          createElement(TurnBox.Face, { key: "1" }),
          createElement(TurnBox.Face, { key: "2" }),
          createElement(TurnBox.Face, { key: "3" }),
        ),
      );
    });

    expect(container.querySelector("[data-face-index='1']")).not.toBeNull();
    expect(container.querySelector("[data-face-index='2']")).not.toBeNull();
    expect(container.querySelector("[data-face-index='3']")).toBeNull();
    container.remove();
  });

  it("non-Face siblings do not affect _faceIndex numbering", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = createRoot(container);
      root.render(
        createElement(
          TurnBox.Root,
          { faces: 3 },
          createElement(TurnBox.Face, { key: "1" }),
          createElement("div", { key: "sep" }),
          createElement(TurnBox.Face, { key: "2" }),
          createElement(TurnBox.Face, { key: "3" }),
        ),
      );
    });

    expect(container.querySelector("[data-face-index='1']")).not.toBeNull();
    expect(container.querySelector("[data-face-index='2']")).not.toBeNull();
    expect(container.querySelector("[data-face-index='3']")).not.toBeNull();
    container.remove();
  });
});

describe("TurnBox.Button", () => {
  const mountWithButtons = (faces: 2 | 3 | 4 = 4) => {
    const ref = createRef<TurnBoxRootHandle>();
    const container = document.createElement("div");
    document.body.appendChild(container);

    const faceNodes = Array.from({ length: faces }, (_, i) => {
      const nextBtn = i < faces - 1 ? createElement(TurnBox.Button, { "data-testid": `next-${i + 1}` }, "Next") : null;
      const prevBtn =
        i > 0
          ? createElement(TurnBox.Button, { direction: "prev" as const, "data-testid": `prev-${i + 1}` }, "Prev")
          : null;
      return createElement(TurnBox.Face, { key: `face-${i + 1}` }, ...[nextBtn, prevBtn].filter(Boolean));
    });

    act(() => {
      const root = createRoot(container);
      root.render(createElement(TurnBox.Root, { faces, duration: 600, ref }, ...faceNodes));
    });

    const getHandle = (): TurnBoxRootHandle => {
      if (!ref.current) throw new Error("handle not mounted");
      return ref.current;
    };

    const click = async (testId: string) => {
      const btn = container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
      if (!btn) throw new Error(`Button [data-testid="${testId}"] not found`);
      await act(async () => {
        btn.click();
        await vi.advanceTimersByTimeAsync(0);
      });
    };

    return { container, getHandle, click };
  };

  it("Next button advances to the next face", async () => {
    const { getHandle, click } = mountWithButtons();
    await click("next-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(getHandle().getCurrentFace()).toBe(2);
  });

  it("Prev button goes back to the previous face", async () => {
    const { getHandle, click } = mountWithButtons();
    await click("next-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    await click("prev-2");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(getHandle().getCurrentFace()).toBe(1);
  });
});

describe("TurnBox.Button to={N}", () => {
  it("navigates directly to target face", async () => {
    const ref = createRef<TurnBoxRootHandle>();
    const container = document.createElement("div");
    document.body.appendChild(container);

    const faces = Array.from({ length: 4 }, (_, i) =>
      createElement(
        TurnBox.Face,
        { key: `face-${i + 1}` },
        ...(i === 0 ? [createElement(TurnBox.Button, { to: 3, "data-testid": "goto3" }, "Go 3")] : []),
      ),
    );

    act(() => {
      const root = createRoot(container);
      root.render(createElement(TurnBox.Root, { faces: 4, type: "skip", duration: 600, ref }, ...faces));
    });

    const btn = container.querySelector<HTMLButtonElement>('[data-testid="goto3"]');
    await act(async () => {
      btn?.click();
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(ref.current?.getCurrentFace()).toBe(3);
    container.remove();
  });
});

describe("useTurnBoxContext outside Root", () => {
  it("throws when used outside TurnBox.Root", () => {
    const BadComponent = () => {
      useTurnBoxContext();
      return null;
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const suppressWindowError = (e: ErrorEvent) => e.preventDefault();
    window.addEventListener("error", suppressWindowError);
    try {
      expect(() => {
        act(() => {
          createRoot(container).render(createElement(BadComponent));
        });
      }).toThrow("TurnBox components must be used within <TurnBox.Root>");
    } finally {
      errorSpy.mockRestore();
      window.removeEventListener("error", suppressWindowError);
      container.remove();
    }
  });
});

describe("TurnBox.Face style prop", () => {
  it("merges user style with computed position style", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = createRoot(container);
      root.render(
        createElement(
          TurnBox.Root,
          { faces: 2 },
          createElement(TurnBox.Face, { style: { background: "red" } }),
          createElement(TurnBox.Face, {}),
        ),
      );
    });

    const face1 = container.querySelector<HTMLElement>("[data-face-index='1']");
    expect(face1?.style.background).toBe("red");
    expect(face1?.style.position).toBe("absolute");
    container.remove();
  });
});

describe("focus management", () => {
  const mountWithFocusable = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
    const ref = createRef<TurnBoxRootHandle>();
    const faceNodes = Array.from({ length: faces }, (_, i) =>
      createElement(
        TurnBox.Face,
        { key: `face-${i + 1}` },
        createElement("button", { type: "button", "data-testid": `btn-face-${i + 1}` }, `Face ${i + 1}`),
      ),
    );
    const container = document.createElement("div");
    document.body.appendChild(container);

    let root: ReturnType<typeof createRoot>;
    act(() => {
      root = createRoot(container);
      root.render(createElement(TurnBox.Root, { faces, ...opts, ref }, ...faceNodes));
    });

    const getHandle = (): TurnBoxRootHandle => {
      if (!ref.current) throw new Error("handle not mounted");
      return ref.current;
    };

    const destroy = () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    };

    return { container, getHandle, destroy };
  };

  it("focuses first focusable element in target face after instant goTo (animation=false)", async () => {
    const { container, getHandle, destroy } = mountWithFocusable();

    await act(async () => {
      getHandle().goTo(2, false);
    });

    const btn2 = container.querySelector<HTMLElement>('[data-testid="btn-face-2"]');
    expect(document.activeElement).toBe(btn2);
    destroy();
  });

  it("focuses first focusable element in target face after animated goTo", async () => {
    const { container, getHandle, destroy } = mountWithFocusable(4, { duration: 100 });

    await act(async () => {
      getHandle().goTo(2, true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    const btn2 = container.querySelector<HTMLElement>('[data-testid="btn-face-2"]');
    expect(document.activeElement).toBe(btn2);
    destroy();
  });
});

describe("TurnBox.Root aria-label", () => {
  it("sets role=region and aria-label when aria-label is provided", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = createRoot(container);
      root.render(
        createElement(
          TurnBox.Root,
          { faces: 2, "aria-label": "Image rotator" },
          createElement(TurnBox.Face, { key: "1" }),
          createElement(TurnBox.Face, { key: "2" }),
        ),
      );
    });

    expect(container.firstElementChild?.getAttribute("role")).toBe("region");
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe("Image rotator");
    container.remove();
  });

  it("does not set role when aria-label is omitted", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = createRoot(container);
      root.render(
        createElement(
          TurnBox.Root,
          { faces: 2 },
          createElement(TurnBox.Face, { key: "1" }),
          createElement(TurnBox.Face, { key: "2" }),
        ),
      );
    });

    expect(container.firstElementChild?.getAttribute("role")).toBeNull();
    container.remove();
  });
});
