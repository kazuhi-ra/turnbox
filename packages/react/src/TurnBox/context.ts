import { createContext, useContext } from "react";
import type { NormalizedOptions } from "@kazuhi-ra/turnbox-core";

export type AnimationPhase =
  | { kind: "idle" }
  | { kind: "animating" }
  | { kind: "adjusting"; to: number }
  | { kind: "adjust-animating" };

export type TurnBoxContextValue = {
  opts: NormalizedOptions;
  displayFace: number;
  phase: AnimationPhase;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
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
