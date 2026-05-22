import { createContext, useContext } from "react";
import type { NormalizedOptions } from "@turnbox/core";

export type AnimationPhase =
  | { kind: "idle" }
  | { kind: "pre-positioning"; via: 0 | 5; landAt: 1 | 4 }
  | { kind: "animating" }
  | { kind: "adjusting"; to: number }
  | { kind: "adjust-animating" };

export type TurnBoxContextValue = {
  opts: NormalizedOptions;
  displayFace: number;
  phase: AnimationPhase;
  shownFaces: ReadonlySet<number>;
  faceOverrides: ReadonlyMap<number, string>;
  go: (rawTarget: number, animation: boolean) => void;
};

export const TurnBoxContext = createContext<TurnBoxContextValue | null>(null);

export const useTurnBoxContext = (): TurnBoxContextValue => {
  const ctx = useContext(TurnBoxContext);
  if (!ctx) throw new Error("TurnBox components must be used within <TurnBox.Root>");
  return ctx;
};
