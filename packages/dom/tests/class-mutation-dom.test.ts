import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

// ── setCurrentFace: same-value guard ──────────────────────────────────────────
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

// ── hideFace: aria-hidden identity mutation guard ──────────────────────────────
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

describe("DOM — container class: abort after step() does not produce redundant face-class mutations", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("abort after step(): container receives exactly one class change per real face transition", async () => {
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

// ── showFace/hideFace: classList no-op mutation guard ─────────────────────────
// syncFaceVisibility() iterates all faces unconditionally:
//   showFace(from) → classList.add("turnBoxShow") — from-face already has it   [no-op]
//   hideFace(N)    → classList.remove("turnBoxShow") — N has no turnBoxShow    [no-op]
// jsdom (and Chrome) fire a MO record for every classList.add/remove call,
// even when the token set does not change.
//
// Fix: guard each call with classList.contains() before add/remove.

describe("DOM — classList: showFace and hideFace only mutate when token set actually changes", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("next() syncFaceVisibility: only the target face receives a class mutation before step() fires", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    const mutatedFaces = new Set<string>();
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as HTMLElement;
        const m = el.className.match(/turnBoxFaceNum(\d+)/);
        if (m) mutatedFaces.add(m[1]);
      }
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });

    instance.next(); // syncFaceVisibility() runs synchronously: showFace(1)[no-op], showFace(2)[real], hideFace(3)[no-op], hideFace(4)[no-op]
    await Promise.resolve(); // flush MO microtask before step() fires
    observer.disconnect();
    instance.destroy();
    container.remove();

    // Without classList.contains() guard: faces 1, 2, 3, 4 all appear (no-ops fire MO)
    // With guard: only face 2 appears (real classList.add("turnBoxShow"))
    expect([...mutatedFaces].sort()).toEqual(["2"]);
  });

  it("already-visible from-face is not re-mutated: only the target face receives turnBoxShow in syncFaceVisibility", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    instance.next();
    await vi.advanceTimersByTimeAsync(DURATION + 1); // full animation completes

    const mutatedFaces = new Set<string>();
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as HTMLElement;
        const m = el.className.match(/turnBoxFaceNum(\d+)/);
        if (!m) continue;
        // Detect only mutations where the turnBoxShow TOKEN itself changed.
        // Chrome/jsdom fire MO records for every classList.add/remove call even when
        // the token set does not change (no-op). Additionally, step() adds
        // turnBoxTransition to face2 which already has turnBoxShow — the resulting
        // MO record has r.oldValue containing "turnBoxShow" even though turnBoxShow
        // was not touched. A naive `r.oldValue.includes("turnBoxShow")` filter
        // incorrectly captures that record. Compare old vs current token presence
        // to detect only actual turnBoxShow changes.
        const hadShow = r.oldValue?.split(/\s+/).includes("turnBoxShow") ?? false;
        const hasShow = el.classList.contains("turnBoxShow");
        if (hadShow !== hasShow) mutatedFaces.add(m[1]);
      }
    });

    // Trigger second transition to generate another cleanup
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });
    instance.next(); // face2→face3
    await vi.advanceTimersByTimeAsync(1); // step() fires: adds turnBoxTransition to all faces
    await Promise.resolve(); // flush MO microtask (captures syncFaceVisibility + step() mutations)
    observer.disconnect();
    instance.destroy();
    container.remove();

    // syncFaceVisibility in animate(): showFace(2)[no-op, already has turnBoxShow], showFace(3)[real add]
    // step() also adds turnBoxTransition to face2, producing a MO record whose r.oldValue
    // contains "turnBoxShow" — the hadShow!==hasShow filter correctly excludes this.
    expect([...mutatedFaces].sort()).toEqual(["3"]);
  });

  it("completion cleanup syncFaceVisibility: no no-op class mutations on already-hidden or already-visible faces", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    instance.next(); // face1→face2
    await vi.advanceTimersByTimeAsync(1); // step() fires: transitions applied

    const identityMutations: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName !== "class") continue;
        const el = r.target as HTMLElement;
        // An identity mutation: classList.add/remove was called but left the class string
        // unchanged (token already present or absent). Chrome/jsdom fire a MO record for
        // every classList call regardless of whether the token set actually changed.
        if (r.oldValue === el.className) identityMutations.push(el.className);
      }
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });

    await vi.advanceTimersByTimeAsync(DURATION); // completion timer fires
    await Promise.resolve(); // flush MO microtask
    observer.disconnect();
    instance.destroy();
    container.remove();

    // Completion syncFaceVisibility(shownFaces={2}):
    //   showFace(2)[no-op: face2 already has turnBoxShow] → identity mutation without guard
    //   hideFace(1)[real: removes turnBoxShow from from-face]
    //   hideFace(3,4)[no-op: already hidden, no turnBoxShow] → identity mutation without guard
    expect(identityMutations).toHaveLength(0);
  });
});

// ── animate: aria-hidden timing vs applyFaceTransforms ────────────────────────
// In animate(), turnBoxShow is added early (prevents paint flash between the sync
// task and step()'s setTimeout task). aria-hidden removal for the to-face is
// deferred to step(), where it runs atomically after applyFaceTransforms() has
// placed the face at center. This ensures screen readers never see a face at a
// side position, and restores bilateral CSS animation (both faces start from their
// side positions and transition simultaneously).

describe("DOM — animate: target face is at center position when aria-hidden is removed", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("when aria-hidden is removed from target face, its transform is already rotateX(0deg)", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });
    const faces = Array.from(container.children) as HTMLElement[];

    let transformAtUnhide: string | null = null;
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "aria-hidden" && r.oldValue === "true") {
          const el = r.target as HTMLElement;
          if (el.classList.contains("turnBoxFaceNum2")) {
            // Record transform at the moment aria-hidden is removed
            // (m.target.style.transform is the live value when callback fires)
            transformAtUnhide = el.style.transform;
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

    instance.next();
    await vi.advanceTimersByTimeAsync(1); // step() fires: applyFaceTransforms then aria-hidden removed
    await Promise.resolve(); // flush MO microtask
    observer.disconnect();
    instance.destroy();
    container.remove();

    // aria-hidden is removed in step() after applyFaceTransforms(), so face2 transform
    // is already rotateX(0deg) when the MO callback observes the aria-hidden removal.
    expect(transformAtUnhide).toMatch(/rotateX\(0deg\)/);
  });

  it("abort-then-new-animation: target face is already at center when aria-hidden is removed", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    // Scenario: next() starts face1→face2 (displayFace=2). step() fires (currentFace=2).
    // prev() = animate(displayFace-1=1) → abort (settleFace=displayFace=2) →
    //   abortAnimation syncFaceVisibility hides face1 (adds aria-hidden="true") →
    //   new animate(from=2, to=1) → turnBoxShow added to face1; aria-hidden deferred to step() →
    //   step() fires: applyFaceTransforms(to=1) places face1 at center → removeAttribute("aria-hidden").
    instance.next(); // face1→face2
    await vi.advanceTimersByTimeAsync(1); // step() fires: currentFace=2

    let transformAtUnhide: string | null = null;
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "aria-hidden" && r.oldValue === "true") {
          const el = r.target as HTMLElement;
          if (el.classList.contains("turnBoxFaceNum1")) {
            transformAtUnhide = el.style.transform;
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

    instance.prev(); // abort face1→face2, start new face2→face1
    await vi.advanceTimersByTimeAsync(1); // new step() fires: applyFaceTransforms then aria-hidden removed
    await Promise.resolve(); // flush MO microtask
    observer.disconnect();
    instance.destroy();
    container.remove();

    expect(transformAtUnhide).toMatch(/rotateX\(0deg\)/);
  });
});

describe("DOM — aria-hidden: hideFace skips setAttribute when value is already 'true'", () => {
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

// ── destroy: no identity class mutations ───────────────────────────────────────
// destroy() calls classList.remove("turnBoxFace", "turnBoxShow", ...turnBoxFaceNum*)
// in a single call. Passing absent tokens to a single classList.remove() call does
// NOT produce extra MO records — the browser fires one record for the combined
// attribute change. This test locks in that single-call behavior so that splitting
// it into separate remove calls (which would require a classList.contains guard)
// is caught as a regression.

describe("DOM — classList: destroy() produces no identity class mutations", () => {
  it("destroy() does not produce identity class mutations on faces without turnBoxShow", async () => {
    const container = makeContainer(4);
    const instance = createTurnBox(container, { faces: 4, duration: DURATION });

    const identityMutations: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName !== "class") continue;
        const el = r.target as HTMLElement;
        // An identity mutation: the class attribute was set but the string did not change.
        // Chrome/jsdom fire a MO record for every classList.remove call even when the
        // token is absent — but only when called as a separate invocation. A single
        // classList.remove(a, b, c) call with mixed present/absent tokens fires one
        // combined record that is NOT an identity mutation.
        if (r.oldValue === el.className) identityMutations.push(r.oldValue);
      }
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });

    instance.destroy();
    await Promise.resolve(); // flush MO microtask
    observer.disconnect();
    container.remove();

    // Faces 2–4 never had turnBoxShow. If destroy() splits the remove into two calls,
    // the second classList.remove("turnBoxShow") on an already-empty class fires an
    // identity mutation record (oldValue === className === "").
    expect(identityMutations).toHaveLength(0);
  });
});
