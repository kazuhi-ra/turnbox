import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { TurnBoxTestAdapter } from "./adapter.js";
import { adapters } from "../adapters/index.js";

describe.each(adapters)("%s — options", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  // ── axis ─────────────────────────────────────────────────────────────────────

  it("axis:X — starts at face 1", () => {
    adapter = createAdapter({ facePcs: 4, axis: "X" });
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("axis:X — navigation works correctly", async () => {
    adapter = createAdapter({ facePcs: 4, axis: "X", duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("axis:Y — starts at face 1", () => {
    adapter = createAdapter({ facePcs: 4, axis: "Y" });
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("axis:Y — navigation works correctly", async () => {
    adapter = createAdapter({ facePcs: 4, axis: "Y", duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("axis:Y — next/prev navigation works", async () => {
    adapter = createAdapter({ facePcs: 4, axis: "Y", duration: 200 });
    adapter.next();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    adapter.prev();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
  });

  it("axis:Y — face1 prev wraps to face4", async () => {
    adapter = createAdapter({ facePcs: 4, axis: "Y", duration: 200 });
    adapter.prev();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
  });

  // ── direction ────────────────────────────────────────────────────────────────

  it("direction:positive — starts at face 1", () => {
    adapter = createAdapter({ facePcs: 4, direction: "positive" });
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("direction:positive — navigation reaches correct faces", async () => {
    adapter = createAdapter({ facePcs: 4, direction: "positive", duration: 200 });
    adapter.goTo(3);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
    expect(adapter.isFaceShown(3)).toBe(true);
  });

  it("direction:negative — starts at face 1", () => {
    adapter = createAdapter({ facePcs: 4, direction: "negative" });
    expect(adapter.getCurrentFace()).toBe(1);
    expect(adapter.isFaceShown(1)).toBe(true);
  });

  it("direction:negative — navigation reaches correct faces", async () => {
    adapter = createAdapter({ facePcs: 4, direction: "negative", duration: 200 });
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("direction:negative — next/prev still move by face number", async () => {
    adapter = createAdapter({ facePcs: 4, direction: "negative", duration: 200 });
    adapter.next();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    adapter.prev();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
  });

  // ── axis + direction combinations ────────────────────────────────────────────

  it("axis:Y + direction:negative — starts at face 1, navigation correct", async () => {
    adapter = createAdapter({ facePcs: 4, axis: "Y", direction: "negative", duration: 200 });
    expect(adapter.getCurrentFace()).toBe(1);
    adapter.goTo(2);
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
  });
});
