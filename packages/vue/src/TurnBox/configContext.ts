import { inject, type InjectionKey } from "vue";
import type { ReduceMotion } from "@kazuhi-ra/turnbox-core";

export type TurnBoxConfig = { reduceMotion: ReduceMotion };

export const TurnBoxConfigKey: InjectionKey<TurnBoxConfig> = Symbol("TurnBoxConfig");

export const injectTurnBoxConfig = (): TurnBoxConfig =>
  inject(TurnBoxConfigKey, { reduceMotion: "user" });
