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

      it("fires once per transition even when second call is blocked", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, duration: DURATION, delay: DELAY, onChange });
        adapter.next();
        adapter.next(); // ignored while animating
        await adapter.advanceTime(AFTER_ANIMATION);
        expect(onChange).toHaveBeenCalledOnce();
      });

      it("fires with landAt face (not virtual) for wrap animation", async () => {
        const onChange = vi.fn();
        adapter = createAdapter({ faces: 4, type: "real", duration: DURATION, delay: DELAY, onChange });
        adapter.goTo(4, false);
        await adapter.advanceTime(AFTER_ANIMATION);
        onChange.mockClear();
        adapter.next(); // face4 → virtual5 → face1
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
        adapter.next(); // face4 → virtual5 → face1
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
    });
  });
};
