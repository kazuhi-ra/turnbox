import { inject } from "vue";
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from "vue";
import type { NormalizedOptions } from "@turnbox/core";

export type AnimationPhase =
  | { kind: "idle" }
  | { kind: "pre-positioning"; via: 0 | 5; landAt: 1 | 4 }
  | { kind: "animating" }
  | { kind: "adjusting"; to: number }
  | { kind: "adjust-animating" };

export type TurnBoxContextValue = {
  opts: ComputedRef<NormalizedOptions>;
  displayFace: Ref<number>;
  phase: ShallowRef<AnimationPhase>;
  shownFaces: ShallowRef<ReadonlySet<number>>;
  faceOverrides: ShallowRef<ReadonlyMap<number, string>>;
  goTo: (rawTarget: number, animation?: boolean) => void;
  next: () => void;
  prev: () => void;
};

export const TurnBoxContextKey: InjectionKey<TurnBoxContextValue> = Symbol("TurnBoxContext");

export const useTurnBoxContext = (): TurnBoxContextValue => {
  const ctx = inject(TurnBoxContextKey);
  if (!ctx) throw new Error("TurnBox components must be used within <TurnBox.Root>");
  return ctx;
};
