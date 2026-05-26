import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "../adapter.js";

const DURATION = 200;
const DELAY = 0;
const TOTAL = DURATION + DELAY;
const AFTER_ANIMATION = TOTAL + 30;

export const callbacksSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — callbacks", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    // ── onChange ────────────────────────────────────────────────────────────────

    describe("onChange", () => {
      it("fires with target face when animation begins", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.next();
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith(2);
      });

      it("fires with correct face for prev()", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(3, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        onChange.mockClear();
        adapter.prev();
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledWith(2);
      });

      it("fires with correct face for goTo()", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(3, true);
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledWith(3);
      });

      it("is not called when transition is noop", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(1, true);
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).not.toHaveBeenCalled();
      });

      it("rapid next() calls: second call is queued, onChange fires once at start", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.next(); // face1 → face2: onChange(2) fires
        adapter.next(); // queue face3 (next from display=2)
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(2);
        await adapter.advanceTime(AFTER_ANIMATION * 2 + 100); // both animations complete
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(2, 3);
      });

      it("fires with destination face for wrap animation", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, type: "real", duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(4, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        onChange.mockClear();
        adapter.next(); // face4 → face1 (boundary wrap)
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledWith(1);
      });

      it("fires for no-animation goTo", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(3, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledWith(3);
      });
    });

    // ── onAnimationEnd ──────────────────────────────────────────────────────────

    describe("onAnimationEnd", () => {
      it("fires with target face after animation completes", async () => {
        const onAnimationEnd = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onAnimationEnd });
        adapter.next();
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onAnimationEnd).toHaveBeenCalledOnce();
        expect(onAnimationEnd).toHaveBeenCalledWith(2);
      });

      it("fires after onChange", async () => {
        const order: string[] = [];
        const onChange = vi.fn(() => order.push("onChange"));
        const onAnimationEnd = vi.fn(() => order.push("onAnimationEnd"));
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange, onAnimationEnd });
        adapter.next();
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(order).toEqual(["onChange", "onAnimationEnd"]);
      });

      it("fires with landAt face for wrap animation", async () => {
        const onAnimationEnd = vi.fn();
        adapter = createAdapter({ faces: 4, type: "real", duration: DURATION, delay: DELAY, onAnimationEnd });
        adapter.goTo(4, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        onAnimationEnd.mockClear();
        adapter.next(); // face4 → face1 (boundary wrap)
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onAnimationEnd).toHaveBeenCalledWith(1);
      });

      it("fires for no-animation goTo", async () => {
        const onAnimationEnd = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onAnimationEnd });
        adapter.goTo(3, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onAnimationEnd).toHaveBeenCalledWith(3);
      });

      it("not called for aborted animation, called only for completing animation", async () => {
        const onAnimationEnd = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onAnimationEnd });
        adapter.next(); // face1 → face2 (FROM=1)
        await adapter.advanceTime(50);
        adapter.prev(); // 即時実行: abort face1→face2, start face2→face1
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(1); // face2 は abort されたので呼ばれない
      });

      it("fires for each animation when queued", async () => {
        const onAnimationEnd = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onAnimationEnd });
        adapter.next(); // face1 → face2
        await adapter.advanceTime(50);
        adapter.next(); // queue face3
        await adapter.advanceTime(600); // both animations complete
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenNthCalledWith(1, 2);
        expect(onAnimationEnd).toHaveBeenNthCalledWith(2, 3);
      });
    });

    // ── onChange + queue ────────────────────────────────────────────────────────

    describe("onChange with queue", () => {
      it("fires when queued animation starts, not when queued", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.next(); // face1 → face2: onChange(2) fires
        await adapter.advanceTime(50);
        adapter.next(); // queue face3: onChange does NOT fire yet
        expect(onChange).toHaveBeenCalledTimes(1);
        await adapter.advanceTime(600); // both complete
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(2, 3);
      });
    });
  });
};
