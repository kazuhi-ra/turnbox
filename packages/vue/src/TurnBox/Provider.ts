import { defineComponent, provide, reactive, watchEffect, type PropType } from "vue";
import type { ReduceAnimation } from "@kazuhi-ra/turnbox-core";
import { TurnBoxConfigKey, type TurnBoxConfig } from "./configContext.js";

export const Provider = defineComponent({
  name: "TurnBoxProvider",
  props: {
    reduceAnimation: { type: String as PropType<ReduceAnimation>, default: "system setting" },
  },
  setup(props, { slots }) {
    const config = reactive<TurnBoxConfig>({ reduceAnimation: props.reduceAnimation });
    watchEffect(() => {
      config.reduceAnimation = props.reduceAnimation;
    });
    provide(TurnBoxConfigKey, config);
    return () => slots.default?.();
  },
});
