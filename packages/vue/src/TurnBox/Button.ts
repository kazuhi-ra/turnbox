import { defineComponent, h, type PropType } from "vue";
import { useTurnBoxContext } from "./context.js";

export type ButtonProps = {
  direction?: "next" | "prev";
  to?: number;
};

export const Button = defineComponent({
  name: "TurnBoxButton",
  inheritAttrs: false,
  props: {
    direction: { type: String as PropType<"next" | "prev">, default: "next" },
    to: { type: Number },
  },
  setup(props, { slots, attrs }) {
    const { goTo, next, prev } = useTurnBoxContext();

    const handleClick = () => {
      if (props.to !== undefined) {
        goTo(props.to);
      } else if (props.direction === "prev") {
        prev();
      } else {
        next();
      }
    };

    return () => h("button", { type: "button", ...attrs, onClick: handleClick }, slots.default?.());
  },
});
