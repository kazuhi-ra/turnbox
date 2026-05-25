import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AdapterList, TurnBoxTestAdapter } from "./adapter.js";

export const wrapAroundCompatSuite = (adapters: AdapterList) => {
  describe.each(adapters)("%s — wrap-around", (_, createAdapter) => {
    let adapter: TurnBoxTestAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      adapter.destroy();
      vi.useRealTimers();
    });

    describe("type:real — prev() wrap", () => {
      it("prev() from face 1 wraps to face 4", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.getCurrentFace()).toBe(4);
      });

      it("prev() from face 1 shows face 4 and hides face 1", async () => {
        adapter = createAdapter({ faces: 4, type: "real", duration: 200 });
        adapter.prev();
        await adapter.advanceTime(300);
        expect(adapter.isFaceShown(4)).toBe(true);
        expect(adapter.isFaceShown(1)).toBe(false);
      });
    });

    describe("type:repeat — traverse", () => {
      it("can traverse all faces 1→2→3→4 in sequence", async () => {
        adapter = createAdapter({ faces: 4, type: "repeat", duration: 200 });
        for (let face = 2; face <= 4; face++) {
          adapter.next();
          await adapter.advanceTime(300);
          expect(adapter.getCurrentFace()).toBe(face);
        }
      });
    });
  });
};
