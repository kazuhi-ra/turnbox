import type React from "react";
import type { ReduceMotion } from "@kazuhi-ra/turnbox-core";
import { TurnBoxConfigContext } from "./ConfigContext.js";

type ProviderProps = {
  reduceMotion: ReduceMotion;
  children?: React.ReactNode;
};

export const Provider = ({ reduceMotion, children }: ProviderProps): React.ReactElement => (
  <TurnBoxConfigContext.Provider value={{ reduceMotion }}>{children}</TurnBoxConfigContext.Provider>
);
