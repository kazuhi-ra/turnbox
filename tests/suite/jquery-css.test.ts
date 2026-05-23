import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createJQueryAdapter } from "../adapters/jquery.js";

// ── jQuery adapter: double-init guard ─────────────────────────────────────────
// turnBox.js does not reset state when turnBox() is called again on an already-initialized element.

describe("jQuery — double-init guard", () => {
  let adapter: ReturnType<typeof createJQueryAdapter>;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("calling turnBox() on an already-initialized element does not reset to face 1", async () => {
    adapter = createJQueryAdapter({ faces: 4, duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);

    const $$ = (globalThis as Record<string, unknown>).$ as (s: string) => {
      turnBox: (o?: object) => void;
    };
    const container = document.querySelector("[data-turnbox-test]") as HTMLElement;
    const testId = container.getAttribute("data-turnbox-test");
    $$(`[data-turnbox-test="${testId}"]`).turnBox();

    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });
});

// ── jQuery adapter: CSS rules for 2/3/4-face boxes ───────────────────────────
// turnBox.js injects CSS into <head> via a <style> tag.
// For 2- and 3-face boxes, virtual wrap faces (currentFace0 / currentFace5)
// must not be generated. For 4-face boxes all 6 positions (0–5) are required.

describe("jQuery — CSS rules for 2/3/4-face boxes", () => {
  let adapter: ReturnType<typeof createJQueryAdapter>;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  const hasRule = (currentFace: number): boolean => {
    const styleEl = document.head.querySelector('style[id*="turnBoxStyle"]');
    const sheet = (styleEl as HTMLStyleElement)?.sheet;
    if (!sheet) return false;
    return Array.from(sheet.cssRules).some(
      (r) => r instanceof CSSStyleRule && r.selectorText.includes(`turnBoxCurrentFace${currentFace}`),
    );
  };

  it("2-face box: no CSS rules for virtual currentFace0 or currentFace5", () => {
    adapter = createJQueryAdapter({ faces: 2 });
    expect(hasRule(0)).toBe(false);
    expect(hasRule(5)).toBe(false);
  });

  it("2-face box: has CSS rules only for currentFace1 and currentFace2", () => {
    adapter = createJQueryAdapter({ faces: 2 });
    expect(hasRule(1)).toBe(true);
    expect(hasRule(2)).toBe(true);
    expect(hasRule(3)).toBe(false);
  });

  it("3-face box: no CSS rules for virtual currentFace0 or currentFace5", () => {
    adapter = createJQueryAdapter({ faces: 3 });
    expect(hasRule(0)).toBe(false);
    expect(hasRule(5)).toBe(false);
  });

  it("3-face box: has CSS rules for currentFace1, 2, 3 only", () => {
    adapter = createJQueryAdapter({ faces: 3 });
    expect(hasRule(1)).toBe(true);
    expect(hasRule(2)).toBe(true);
    expect(hasRule(3)).toBe(true);
    expect(hasRule(4)).toBe(false);
  });

  it("4-face box: has CSS rules for currentFace0 through currentFace5 (virtual wrap)", () => {
    adapter = createJQueryAdapter({ faces: 4 });
    for (let i = 0; i <= 5; i++) {
      expect(hasRule(i)).toBe(true);
    }
  });
});

// ── jQuery adapter: CSS wrap positions (virtual face 0/5) ─────────────────────
// These verify the CSS transform values generated for wrap animations.
// Virtual currentFace5 = face4 NEXT → face1 arrival.
// Virtual currentFace0 = face1 PREV → face4 arrival.

const readCSSTransform = (currentFace: number, faceNum: number): string => {
  const styleEl = document.head.querySelector('style[id*="turnBoxStyle"]');
  const sheet = (styleEl as HTMLStyleElement)?.sheet;
  if (!sheet) return "";
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof CSSStyleRule)) continue;
    if (
      rule.selectorText.includes(`turnBoxCurrentFace${currentFace}`) &&
      rule.selectorText.includes(`turnBoxFaceNum${faceNum}`) &&
      !rule.selectorText.includes("Adjust")
    ) {
      return rule.style.transform;
    }
  }
  return "";
};

describe("jQuery — CSS wrap positions", () => {
  let adapter: ReturnType<typeof createJQueryAdapter>;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  describe("axis:X — virtual currentFace5 (face4 NEXT → face1 arrival)", () => {
    it("face1 arrives at front: rotateX(-360deg) translate3d(0,0,0)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(readCSSTransform(5, 1)).toBe("rotateX(-360deg) translate3d(0px, 0px, 0px)");
    });

    it("face4 departs to bottom: rotateX(-90deg) translate3d(0, 25px, 25px)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(readCSSTransform(5, 4)).toBe("rotateX(-90deg) translate3d(0px, 25px, 25px)");
    });
  });

  describe("axis:X — virtual currentFace0 (face1 PREV → face4 arrival)", () => {
    it("face4 arrives at front: rotateX(360deg) translate3d(0,0,0)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(readCSSTransform(0, 4)).toBe("rotateX(360deg) translate3d(0px, 0px, 0px)");
    });

    it("face1 departs to top: rotateX(90deg) translate3d(0, -25px, 25px)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "X" });
      expect(readCSSTransform(0, 1)).toBe("rotateX(90deg) translate3d(0px, -25px, 25px)");
    });
  });

  describe("axis:Y — virtual currentFace5 (face4 NEXT → face1 arrival)", () => {
    it("face1 arrives at front: rotateY(-360deg) translate3d(0,0,0)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(readCSSTransform(5, 1)).toBe("rotateY(-360deg) translate3d(0px, 0px, 0px)");
    });

    it("face4 departs to left: rotateY(-90deg) translate3d(-100px, 0, 100px)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(readCSSTransform(5, 4)).toBe("rotateY(-90deg) translate3d(-100px, 0px, 100px)");
    });
  });

  describe("axis:Y — virtual currentFace0 (face1 PREV → face4 arrival)", () => {
    it("face4 arrives at front: rotateY(360deg) translate3d(0,0,0)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(readCSSTransform(0, 4)).toBe("rotateY(360deg) translate3d(0px, 0px, 0px)");
    });

    it("face1 departs to right: rotateY(90deg) translate3d(100px, 0, 100px)", () => {
      adapter = createJQueryAdapter({ faces: 4, width: 200, height: 50, axis: "Y" });
      expect(readCSSTransform(0, 1)).toBe("rotateY(90deg) translate3d(100px, 0px, 100px)");
    });
  });
});
