import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { TurnBoxTestAdapter } from "./adapter.js";
import { implAdapters } from "../adapters/index.js";

// ── アニメーション中は操作を無視する ─────────────────────────────────────────
// アニメーションが完了する前に next()/prev()/goTo() を呼んでも no-op になること。
// 完了後は通常通り動作すること。

describe.each(implAdapters)("%s — animation guard", (_, createAdapter) => {
  let adapter: TurnBoxTestAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("next() during animation is ignored: stays at face 2, not face 3", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next(); // face1 → face2 アニメーション開始
    await adapter.advanceTime(50); // アニメーション中 (duration=200 なので未完了)
    adapter.next(); // 無視されるべき
    await adapter.advanceTime(300); // 最初のアニメーション完了
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("prev() during animation is ignored", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(50);
    adapter.prev(); // 無視されるべき
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
    expect(adapter.isFaceShown(1)).toBe(false);
  });

  it("goTo() during animation is ignored", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(50);
    adapter.goTo(4); // 無視されるべき
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("after animation completes, next() works normally", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(300); // 完了
    expect(adapter.getCurrentFace()).toBe(2);
    adapter.next(); // face2 → face3 (ガード解除済み)
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  it("wrap animation guard: next() during face4→face1 wrap is ignored", async () => {
    adapter = createAdapter({ facePcs: 4, type: "real", duration: 200 });
    adapter.goTo(4);
    await adapter.advanceTime(300);
    adapter.next(); // face4 → face1 wrap アニメーション開始
    await adapter.advanceTime(50);
    adapter.next(); // 無視されるべき
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(1);
  });

  // ── 連続複数操作はキューに積まれない ──────────────────────────────────────

  it("three rapid next() calls result in only one step", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next(); // face1 → face2 開始
    adapter.next(); // 無視
    adapter.next(); // 無視
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
  });

  it("next() called 5 times rapidly only moves one step", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    for (let i = 0; i < 5; i++) adapter.next();
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(2);
    expect(adapter.isFaceShown(2)).toBe(true);
  });

  // ── animation=false でもガードが効く ─────────────────────────────────────

  it("goTo(face, false) blocks subsequent calls during its own timeouts", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.goTo(3, false); // instant (no CSS transition) だが状態更新は非同期
    adapter.next(); // 無視されるべき
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(3);
  });

  // ── ガード解除後は正常に動作する ─────────────────────────────────────────

  it("all navigation methods work after guard releases", async () => {
    adapter = createAdapter({ facePcs: 4, duration: 200 });
    adapter.next();
    await adapter.advanceTime(300); // face2
    adapter.next();
    await adapter.advanceTime(300); // face3
    adapter.prev();
    await adapter.advanceTime(300); // face2
    adapter.goTo(4);
    await adapter.advanceTime(300); // face4
    expect(adapter.getCurrentFace()).toBe(4);
    expect(adapter.isFaceShown(4)).toBe(true);
  });

  // ── even≠length (fixed=false) + ガード ───────────────────────────────────
  // shouldAddAdjust が有効な場合、adjust cleanup まで isAnimating=true のまま

  it("even≠height: operation during adjust cleanup window is ignored", async () => {
    // duration=200, delay=50 → time=250. adjust cleanup は 250+20+20=290ms に発火
    adapter = createAdapter({
      facePcs: 4,
      type: "real",
      height: 200,
      even: 150,
      axis: "X",
      duration: 200,
    });
    adapter.next(); // face1 → face2 (shouldAddAdjust=false for this pair, guard releases at ~270ms)
    await adapter.advanceTime(150); // アニメーション中
    adapter.next(); // 無視されるべき
    await adapter.advanceTime(200); // 完了
    expect(adapter.getCurrentFace()).toBe(2);
  });
});
