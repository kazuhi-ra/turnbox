import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createJQueryAdapter } from "./adapters/jquery.js";

// ── jQuery interrupt: abort-all cascade ───────────────────────────────────────
// The jQuery adapter uses abort-all interrupt: every new navigation immediately
// cancels the in-flight animation and restarts from the current display face.
// This differs from modern adapters (DOM/React/Vue) which use a queue/immediate-
// execute model. These tests pin the jQuery-specific cascade behavior.

describe("jQuery — interrupt (abort-all cascade)", () => {
  let adapter: ReturnType<typeof createJQueryAdapter>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  it("two sequential interrupts each advance one step: ends at face4", async () => {
    // Each next() aborts the current animation and restarts from the new display face.
    // getCurrentFace() reads turnBoxCurrentFaceN, which is updated at animation start.
    // So: face1→face2 (abort) → face2→face3 (abort) → face3→face4.
    adapter = createJQueryAdapter({ faces: 4, duration: 200 });
    adapter.next(); // face1 → face2
    await adapter.advanceTime(50);
    adapter.next(); // abort → face2 → face3
    await adapter.advanceTime(50);
    adapter.next(); // abort → face3 → face4
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
  });

  it("rapid goTo() calls abort in sequence, landing on last target", async () => {
    adapter = createJQueryAdapter({ faces: 4, duration: 200 });
    adapter.goTo(2); // face1 → face2
    await adapter.advanceTime(50);
    adapter.goTo(3); // abort → face2 → face3
    await adapter.advanceTime(50);
    adapter.goTo(4); // abort → face3 → face4
    await adapter.advanceTime(300);
    expect(adapter.getCurrentFace()).toBe(4);
  });
});
