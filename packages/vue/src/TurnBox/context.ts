import { inject } from "vue";
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from "vue";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";

export type AnimationPhase = { kind: "idle" } | { kind: "animating" };

export type TurnBoxContextValue = {
  opts: ComputedRef<NormalizedOptions>;
  displayFace: Ref<number>;
  phase: ShallowRef<AnimationPhase>;
  shownFaces: ShallowRef<ReadonlySet<number>>;
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
