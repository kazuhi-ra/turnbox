import { createContext, useContext } from "react";
import type { ReduceMotion } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceMotion: ReduceMotion };

export const TurnBoxConfigContext = createContext<TurnBoxConfig>({ reduceMotion: "user" });

export const useTurnBoxConfig = (): TurnBoxConfig => useContext(TurnBoxConfigContext);
