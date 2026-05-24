import { defineComponent, provide, reactive, watchEffect, type PropType } from "vue";
import type { ReduceMotion } from "@kazuhi-ra/turnbox-core";
import { TurnBoxConfigKey, type TurnBoxConfig } from "./configContext.js";

export const Provider = defineComponent({
  name: "TurnBoxProvider",
  props: {
    reduceMotion: { type: String as PropType<ReduceMotion>, required: true },
  },
  setup(props, { slots }) {
    const config = reactive<TurnBoxConfig>({ reduceMotion: props.reduceMotion });
    watchEffect(() => {
      config.reduceMotion = props.reduceMotion;
    });
    provide(TurnBoxConfigKey, config);
    return () => slots.default?.();
  },
});
