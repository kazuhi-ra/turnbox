import { inject, type InjectionKey } from "vue";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceAnimation: ReduceAnimation };

export const TurnBoxConfigKey: InjectionKey<TurnBoxConfig> = Symbol("TurnBoxConfig");

const DEFAULT_CONFIG: TurnBoxConfig = { reduceAnimation: "system setting" };

export const injectTurnBoxConfig = (): TurnBoxConfig => inject(TurnBoxConfigKey, DEFAULT_CONFIG);
