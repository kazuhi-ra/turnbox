import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement, createRef } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "react";
import { TurnBox } from "@kazuhi-ra/turnbox-react";
import type { TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const mountSSR = (faces: 2 | 3 | 4 = 4, opts: Record<string, unknown> = {}) => {
  const ref = createRef<TurnBoxRootHandle>();
  const faceNodes = Array.from({ length: faces }, (_, i) => createElement(TurnBox.Face, { key: `face-${i + 1}` }));
  const rootEl = createElement(TurnBox.Root, { faces, ...opts, ref }, ...faceNodes);
  const element = createElement(TurnBox.Provider, { reduceAnimation: "system setting" }, rootEl);

  const html = renderToString(element);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  act(() => {
    hydrateRoot(container, element);
  });

  const getHandle = () => {
    if (!ref.current) throw new Error("handle not mounted");
    return ref.current;
  };

  const getFaceEl = (n: number) => container.querySelector<HTMLElement>(`[data-face-index="${n}"]`);

  return { html, container, getHandle, getFaceEl };
};

describe("React SSR: renderToString + hydrateRoot", () => {
  describe("server HTML", () => {
    it("contains data-face-index for all faces", () => {
      const { html } = mountSSR(4);
      for (let i = 1; i <= 4; i++) {
        expect(html).toContain(`data-face-index="${i}"`);
      }
    });
  });

  describe("hydration", () => {
    it("hydrates without console.error (no mismatch)", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        mountSSR(4);
        expect(spy).not.toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });

    it("getCurrentFace returns 1 after hydration", () => {
      const { getHandle } = mountSSR(4);
      expect(getHandle().getCurrentFace()).toBe(1);
    });

    it("face 1 is visible and face 2 is hidden after hydration", () => {
      const { getFaceEl } = mountSSR(4);
      expect(getFaceEl(1)?.style.opacity).not.toBe("0");
      expect(getFaceEl(2)?.style.opacity).toBe("0");
    });
  });

  describe("navigation after hydration", () => {
    it("goTo() changes face", () => {
      const { getHandle } = mountSSR(4);
      act(() => {
        getHandle().goTo(2, false);
      });
      expect(getHandle().getCurrentFace()).toBe(2);
    });

    it("next() advances to face 2 with animation", async () => {
      const { getHandle } = mountSSR(4, { duration: 200 });
      act(() => {
        getHandle().next();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(getHandle().getCurrentFace()).toBe(2);
    });

    it("prev() on face 1 is a no-op", () => {
      const { getHandle } = mountSSR(4);
      act(() => {
        getHandle().prev();
      });
      expect(getHandle().getCurrentFace()).toBe(1);
    });
  });
});
