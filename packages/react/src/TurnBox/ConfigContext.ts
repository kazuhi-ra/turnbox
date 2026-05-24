import { createContext, useContext } from "react";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceAnimation: ReduceAnimation };

export const TurnBoxConfigContext = createContext<TurnBoxConfig | null>(null);

export const useTurnBoxConfig = (): TurnBoxConfig => {
  const config = useContext(TurnBoxConfigContext);
  if (!config)
    throw new Error(
      '[TurnBox] reduceAnimation is required. Wrap with <TurnBox.Provider reduceAnimation="system setting" | "never">.',
    );
  return config;
};
