import { inject, type InjectionKey } from "vue";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceAnimation: ReduceAnimation };

export const TurnBoxConfigKey: InjectionKey<TurnBoxConfig> = Symbol("TurnBoxConfig");

export const injectTurnBoxConfig = (): TurnBoxConfig => {
  const config = inject(TurnBoxConfigKey);
  if (!config) throw new Error('[TurnBox] reduceAnimation is required. Wrap with <TurnBox.Provider reduceAnimation="system setting" | "never">.');
  return config;
};
