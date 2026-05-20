export type Axis = "X" | "Y";
export type Direction = "positive" | "negative";
export type AnimationType = "real" | "repeat" | "skip";

export type TurnBoxOptions = {
  facePcs: number;
  axis?: Axis;
  direction?: Direction;
  type?: AnimationType;
  duration?: number;
  delay?: number;
  width?: number;
  height?: number;
  even?: number;
};

export type NormalizedOptions = {
  facePcs: number;
  axis: Axis;
  direction: Direction;
  type: AnimationType;
  duration: number;
  delay: number;
  width: number;
  height: number;
  even: number;
  fixed: boolean;
};

export type FaceTransform = {
  axis: Axis;
  deg: number;
  x: number;
  y: number;
  z: number;
  zIndex: number;
  transformOrigin: string;
};
