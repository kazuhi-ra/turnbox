export type Axis = "X" | "Y";
export type Direction = "positive" | "negative";
export type AnimationType = "real" | "repeat" | "skip";

// type:real, 4-face: face1-prev passes through virtual face 0 and lands at face4
export const VIRTUAL_PREV_WRAP = 0 as const;
// type:real, 4-face: face4-next passes through virtual face 5 and lands at face1
export const VIRTUAL_NEXT_WRAP = 5 as const;

export type VirtualWrapFace = typeof VIRTUAL_PREV_WRAP | typeof VIRTUAL_NEXT_WRAP;

export type Transition =
  | { kind: "noop" }
  | { kind: "step"; to: number; doAnimate: boolean; hasAdjust: boolean }
  | { kind: "virtual-wrap"; via: VirtualWrapFace; landAt: 1 | 4; doAnimate: boolean }
  | { kind: "direct-wrap"; to: number; doAnimate: boolean };

// The constrained set of rotation angles calcDeg can produce
export type RotationDeg = -360 | -270 | -180 | -90 | 0 | 90 | 180 | 270 | 360;

// Visibility of a face from the viewer's perspective — drives z-index layering
export type FaceVisibility = "front" | "side" | "hidden";

// Parity of a face number — affects variable-geometry translate calculations
export type FaceParity = "odd" | "even";

// Geometry mode: fixed when even === length, variable otherwise
export type Geometry =
  | { kind: "fixed"; axis: Axis; length: number }
  | { kind: "variable"; axis: Axis; length: number; even: number };

export type FaceCount = 2 | 3 | 4;

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
