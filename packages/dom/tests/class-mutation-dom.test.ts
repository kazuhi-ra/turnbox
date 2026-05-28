import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

// ── Bug #1: setCurrentFace same-value guard ────────────────────────────────────
// abortAnimation() calls setCurrentFace(state.displayFace) unconditionally.
// When step() has already run and updated currentFace to the same value,
// this executes classList.remove + classList.add for the same class — producing
// 2 unnecessary MO records and a momentary bare "turnBoxContainer" class.
//
// Timeline: next() → advance 1ms → step() fires → currentFace=2
//           prev()  → abortAnimation() → setCurrentFace(2) [same! BUG]
//                   → new step() fires → setCurrentFace(1)
//
// Expected class mutations on container (each setCurrentFace = 2 records):
//   With bug:    next-step(2) + abort-same(2) + prev-step(2) = 6 records
//   After fix:   next-step(2) +  guarded(0)  + prev-step(2) = 4 records
//
// Fix: `if (currentFace === n) return;` at the top of setCurrentFace.

// ── Bug #2: hideFace identity mutations ────────────────────────────────────────
// syncFaceVisibility() calls hideFace() on every non-shown face, including faces
// that already have aria-hidden="true". hideFace() calls setAttribute("aria-hidden",
// "true") unconditionally, which fires a MO record even when the value is unchanged.
//
// During next() (face1→face2), syncFaceVisibility() runs synchronously:
//   showFace(2) — correct, face2 was hidden
//   hideFace(3) — setAttribute("aria-hidden","true") on face3 already "true" [BUG]
//   hideFace(4) — same for face4
//
// Fix: guard in hideFace with `if (face.getAttribute("aria-hidden") !== "true")`.

const DURATION = 200;

const makeContainer = (faceCount: number) => {
  const container = document.createElement("div");
  for (let i = 0; i < faceCount; i++) container.appendChild(document.createElement("div"));
  document.body.appendChild(container);
  return container;
};

describe("DOM — Bug #1: setCurrentFace same-value guard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("abort after step() already ran: container class mutation count is 4, not 6", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    const classOldValues: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "class" && r.target === container) {
          classOldValues.push(r.oldValue ?? "");
        }
      }
    });
    observer.observe(container, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });

    instance.next(); // schedules step() (delay=0)
    await vi.advanceTimersByTimeAsync(1); // step() fires: setCurrentFace(2) → 2 records
    instance.prev(); // abort: setCurrentFace(2) again [BUG: 2 more records]; then schedules new step()
    await vi.advanceTimersByTimeAsync(1); // new step() fires: setCurrentFace(1) → 2 records

    observer.disconnect();
    instance.destroy();
    container.remove();

    // Each real setCurrentFace(M→N) produces 2 records (remove M + add N).
    // abortAnimation() also calls container.classList.remove("turnBoxAdjust"),
    // which in jsdom fires 1 MO record even when "turnBoxAdjust" is absent (no-op).
    // Without guard: 2 (step→2) + 1 (noop adjust) + 2 (abort same-value) + 2 (step→1) = 7
    // With guard:    2 (step→2) + 1 (noop adjust) +          0           + 2 (step→1) = 5
    expect(classOldValues).toHaveLength(5);
  });

  it("abort after step() already ran: no bare turnBoxContainer intermediate in class history", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    const classOldValues: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "class" && r.target === container) {
          classOldValues.push(r.oldValue ?? "");
        }
      }
    });
    observer.observe(container, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });

    instance.next();
    await vi.advanceTimersByTimeAsync(1); // step(): setCurrentFace(2)
    instance.prev(); // abort: setCurrentFace(2) [same value → remove+add → bare state BUG]
    await vi.advanceTimersByTimeAsync(1); // new step(): setCurrentFace(1)

    observer.disconnect();
    instance.destroy();
    container.remove();

    // Reconstruct the sequence of class states from consecutive oldValues.
    // oldValues[i] is the class string BEFORE mutation i+1, so consecutive pairs give
    // the before/after of each mutation.
    // Detect the pattern: "...FaceN" → "turnBoxContainer" → "...FaceN" (same N)
    // which indicates a redundant remove+add cycle for the same face.
    const states = [...classOldValues, container.className];
    const redundantCycles: string[] = [];
    for (let i = 0; i + 2 < states.length; i++) {
      const faceA = states[i].match(/turnBoxCurrentFace(\d+)/)?.[1];
      const midIsBare = !/turnBoxCurrentFace\d+/.test(states[i + 1]);
      const faceC = states[i + 2].match(/turnBoxCurrentFace(\d+)/)?.[1];
      if (faceA && midIsBare && faceC === faceA) {
        redundantCycles.push(`face${faceA}: "${states[i]}" → "${states[i + 1]}" → "${states[i + 2]}"`);
      }
    }

    expect(redundantCycles).toHaveLength(0);
  });
});

describe("DOM — Bug #2: hideFace aria-hidden identity mutations", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("next() does not produce identity aria-hidden mutations on already-hidden faces", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    // Faces 3 and 4 are hidden at init. next() transitions face1→face2.
    // syncFaceVisibility() runs synchronously inside next() and calls hideFace()
    // on faces 3 and 4 — setAttribute("aria-hidden","true") when already "true".
    const identityMutations: Array<{ face: number; value: string }> = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName !== "aria-hidden") continue;
        const el = r.target as HTMLElement;
        // Identity mutation: attribute was already set to the same non-null value.
        // Guard r.oldValue !== null to avoid false positives when setAttribute
        // and removeAttribute run in the same task (final value = null = oldValue).
        if (r.oldValue !== null && r.oldValue === el.getAttribute("aria-hidden")) {
          const faceMatch = el.className.match(/turnBoxFaceNum(\d+)/);
          if (faceMatch) {
            identityMutations.push({ face: Number(faceMatch[1]), value: r.oldValue ?? "" });
          }
        }
      }
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["aria-hidden"],
    });

    instance.next(); // syncFaceVisibility() runs here synchronously
    // Flush MO microtask without advancing time (so step() does not fire yet)
    await Promise.resolve();
    observer.disconnect();

    instance.destroy();
    container.remove();

    // Without guard: face3 and face4 each receive one identity mutation → length 2
    // After fix: no identity mutations → length 0
    expect(identityMutations).toHaveLength(0);
  });

  it("abort does not produce identity aria-hidden mutations on bystander faces", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    instance.next();
    await vi.advanceTimersByTimeAsync(1); // step() fires

    const identityMutations: Array<{ face: number; value: string }> = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName !== "aria-hidden") continue;
        const el = r.target as HTMLElement;
        if (r.oldValue !== null && r.oldValue === el.getAttribute("aria-hidden")) {
          const faceMatch = el.className.match(/turnBoxFaceNum(\d+)/);
          if (faceMatch) {
            identityMutations.push({ face: Number(faceMatch[1]), value: r.oldValue });
          }
        }
      }
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["aria-hidden"],
    });

    instance.prev(); // abort + new animation; syncFaceVisibility called twice
    await Promise.resolve(); // flush MO microtask before step() fires
    observer.disconnect();

    instance.destroy();
    container.remove();

    // During abort, abortAnimation() calls syncFaceVisibility() then the new
    // animate() call also calls syncFaceVisibility(). Bystander faces (3, 4) that
    // remain hidden receive setAttribute("aria-hidden","true") multiple times.
    expect(identityMutations).toHaveLength(0);
  });
});
