import { createContext, useContext } from "react";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceAnimation: ReduceAnimation };

const DEFAULT_CONFIG: TurnBoxConfig = { reduceAnimation: "system setting" };

export const TurnBoxConfigContext = createContext<TurnBoxConfig>(DEFAULT_CONFIG);

export const useTurnBoxConfig = (): TurnBoxConfig => useContext(TurnBoxConfigContext);
