export type Axis = "X" | "Y";
export type Direction = "positive" | "negative";
export type AnimationType = "real" | "repeat" | "skip";

export type Transition =
  | { kind: "noop" }
  | { kind: "step"; to: number; doAnimate: boolean }
  | { kind: "direct-wrap"; to: number; doAnimate: boolean };

// The constrained set of rotation angles calcDeg can produce
export type RotationDeg = -360 | -180 | -90 | 0 | 90 | 180 | 360;

// Visibility of a face from the viewer's perspective — drives z-index layering
export type FaceVisibility = "front" | "side" | "hidden";

// Parity of a face number — affects variable-geometry translate calculations
export type FaceParity = "odd" | "even";

// Geometry mode: fixed when even === length, variable otherwise
export type Geometry =
  | { kind: "fixed"; axis: Axis; length: number }
  | { kind: "variable"; axis: Axis; length: number; even: number };

export type FaceCount = 2 | 3 | 4;

export type ReduceAnimation = "system setting" | "never";

export type TurnBoxOptions = {
  faces: FaceCount;
  axis?: Axis;
  direction?: Direction;
  type?: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  perspective?: number;
  width?: number;
  height?: number;
  even?: number;
  onChange?: (face: number) => void;
  onAnimationEnd?: (face: number) => void;
};

export type NormalizedOptions = {
  faces: FaceCount;
  direction: Direction;
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  perspective: number;
  geometry: Geometry;
};

export type FaceTransform = {
  axis: Axis;
  deg: RotationDeg;
  x: number;
  y: number;
  z: number;
  zIndex: number;
  transformOrigin: string;
};
