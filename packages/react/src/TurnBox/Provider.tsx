import type React from "react";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";
import { TurnBoxConfigContext } from "./ConfigContext.js";

type ProviderProps = {
  reduceAnimation?: ReduceAnimation;
  children?: React.ReactNode;
};

export const Provider = ({ reduceAnimation = "system setting", children }: ProviderProps): React.ReactElement => (
  <TurnBoxConfigContext.Provider value={{ reduceAnimation }}>{children}</TurnBoxConfigContext.Provider>
);
