import { createContext, useContext } from "react";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";
import type { AnimationPhase } from "@kazuhi-ra/turnbox-core/internal";

export type { AnimationPhase };

export type TurnBoxContextValue = {
  opts: NormalizedOptions;
  displayFace: number;
  phase: AnimationPhase;
  shownFaces: ReadonlySet<number>;
  goTo: (rawTarget: number, animation?: boolean) => void;
  next: () => void;
  prev: () => void;
};

export const TurnBoxContext = createContext<TurnBoxContextValue | null>(null);

export const useTurnBoxContext = (): TurnBoxContextValue => {
  const ctx = useContext(TurnBoxContext);
  if (!ctx) throw new Error("TurnBox components must be used within <TurnBox.Root>");
  return ctx;
};
