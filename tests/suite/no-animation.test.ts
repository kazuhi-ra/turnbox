import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { TurnBoxTestAdapter } from "./adapter.js";
import { allAdapters } from "../adapters/index.js";

describe.each(allAdapters)("%s — no animation", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── explicit animation=false ──────────────────────────────────────────────

  it("goTo(2, false) reaches face 2", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(2, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("goTo(3, false) from face 1 reaches face 3", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(3, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });

  it("goTo(4, false) from face 1 reaches face 4", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(4, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
    expect(adapter.isFaceShown(4)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  // ── non-adjacent goTo (type:real forces animation=false for diff > 1) ──────

  it("type:real — goTo(3) from face 1 (diff=2) reaches face 3", async () => {
    adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  it("type:real — goTo(1) from face 3 (diff=2) reaches face 1", async () => {
    adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    adapter.goTo(1);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
    expect(adapter.isFaceShown(3)).toBe(false);
  });

  it("type:repeat — goTo(3) from face 1 (diff=2) reaches face 3", async () => {
    adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  // ── back-and-forth without animation ─────────────────────────────────────

  it("multiple goTo(face, false) calls in sequence reach correct faces", async () => {
    adapter = createAdapter({ faces: 4, duration: 200 });
    adapter.goTo(4, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
    adapter.goTo(2, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    adapter.goTo(1, false);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
  });
});
