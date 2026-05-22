import { useTurnBoxContext } from "./context.js";

export type ButtonProps = {
  children?: React.ReactNode;
  direction?: "next" | "prev";
  to?: number;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

export const Button = ({ direction = "next", to, children, ...rest }: ButtonProps) => {
  const { go, displayFace } = useTurnBoxContext();

  const handleClick = () => {
    if (to !== undefined) {
      go(to, true);
    } else if (direction === "prev") {
      go(displayFace - 1, true);
    } else {
      go(displayFace + 1, true);
    }
  };

  return (
    <button type="button" {...rest} onClick={handleClick}>
      {children}
    </button>
  );
};
