import { useTurnBoxContext } from "./context.js";

export type ButtonProps = {
  children?: React.ReactNode;
  direction?: "next" | "prev";
  to?: number;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

export const Button = ({ direction = "next", to, children, ...rest }: ButtonProps) => {
  const { goTo, next, prev } = useTurnBoxContext();

  const handleClick = () => {
    if (to !== undefined) {
      goTo(to);
    } else if (direction === "prev") {
      prev();
    } else {
      next();
    }
  };

  return (
    <button type="button" {...rest} onClick={handleClick}>
      {children}
    </button>
  );
};

Button.displayName = "TurnBox.Button";
