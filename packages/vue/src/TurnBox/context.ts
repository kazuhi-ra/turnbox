import { inject } from "vue";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import type { AnimationPhase } from "@kazuhi-ra/turnbox-core/internal";

export type { AnimationPhase };

export type TurnBoxContextValue = {
  opts: ComputedRef<NormalizedOptions>;
  displayFace: Ref<number>;
  phase: Ref<AnimationPhase>;
  shownFaces: Ref<ReadonlySet<number>>;
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
