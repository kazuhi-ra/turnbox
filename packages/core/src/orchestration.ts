import type { TurnBoxState, PendingNav } from "./state-machine.js";
import type { NormalizedOptions } from "./types.js";
import { resolveTransition } from "./navigation.js";

// ─── resolveNavigation ────────────────────────────────────────────────────────

export type NavigationDecision =
  | { kind: "noop" }
  | { kind: "enqueue"; nav: PendingNav }
  | { kind: "abort" } // caller: abortAnimation(), then call resolveNavigation again
  | { kind: "go"; from: number; to: number; doAnimate: boolean };

export const resolveNavigation = (
  state: TurnBoxState,
  rawTarget: number,
  opts: NormalizedOptions,
  animation: boolean,
): NavigationDecision => {
  if (state.kind !== "idle") {
    const t = resolveTransition(state.displayFace, rawTarget, opts, animation);
    if (t.kind === "noop") return { kind: "noop" };
    const isImmediate = !animation || t.to === state.from;
    if (!isImmediate) return { kind: "enqueue", nav: { face: t.to, animation } };
    return { kind: "abort" };
  }
  const from = state.displayFace;
  const t = resolveTransition(from, rawTarget, opts, animation);
  if (t.kind === "noop") return { kind: "noop" };
  return { kind: "go", from, to: t.to, doAnimate: t.doAnimate };
};

// ─── buildDrainResult ─────────────────────────────────────────────────────────

export type DrainResult = { kind: "empty" } | { kind: "navigate"; nav: PendingNav; enqueue: PendingNav[] };

export const buildDrainResult = (settledFace: number, queue: PendingNav[], opts: NormalizedOptions): DrainResult => {
  for (let i = 0; i < queue.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: index is within bounds
    const pending = queue[i]!;
    const t = resolveTransition(settledFace, pending.face, opts, pending.animation);
    if (t.kind !== "noop") {
      return { kind: "navigate", nav: pending, enqueue: queue.slice(i + 1) };
    }
  }
  return { kind: "empty" };
};
