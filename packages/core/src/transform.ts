import type {
  Axis,
  FaceParity,
  FaceTransform,
  FaceVisibility,
  Geometry,
  NormalizedOptions,
  RotationDeg,
  VirtualWrapFace,
} from "./types.js";
import { VIRTUAL_NEXT_WRAP } from "./types.js";
import { MAX_FACE_PCS } from "./normalize.js";

// Named transformOrigin values for the three non-dynamic cases
const TRANSFORM_ORIGIN_CENTER = "50% 50%"; // fixed geometry: center pivot
const TRANSFORM_ORIGIN_TOP_EDGE = "50% 0px"; // variable axis:X adjust: top-edge pivot
const TRANSFORM_ORIGIN_LEFT_EDGE = "0px 50%"; // variable axis:Y adjust: left-edge pivot

export const getFaceParity = (faceNum: number): FaceParity => (faceNum % 2 !== 0 ? "odd" : "even");

// ── Degree calculation ────────────────────────────────────────────────────────

const calcBaseDeg = (currentFace: number, faceNum: number): number => (currentFace - faceNum) * -90;

const isSkipWrapEdge = (currentFace: number, faceNum: number): boolean =>
  (currentFace === MAX_FACE_PCS && faceNum === 1) || (currentFace === 1 && faceNum === MAX_FACE_PCS);

const applyAnimationType = (
  deg: number,
  currentFace: number,
  faceNum: number,
  type: NormalizedOptions["type"],
): number => {
  if (type === "skip") {
    const clamped = Math.sign(deg) * 90;
    return isSkipWrapEdge(currentFace, faceNum) ? clamped * -1 : clamped;
  }
  if (type === "real" && isSkipWrapEdge(currentFace, faceNum)) {
    const clamped = Math.sign(deg) * 90;
    return clamped * -1;
  }
  if (type === "repeat") {
    if (getFaceParity(currentFace) === "odd" && getFaceParity(faceNum) === "even") return 90;
    if (getFaceParity(currentFace) === "even" && getFaceParity(faceNum) === "odd") return -90;
  }
  return deg;
};

const applyDirection = (deg: number, direction: NormalizedOptions["direction"]): number => {
  if (direction !== "negative") return deg;
  const flipped = deg * -1;
  return Object.is(flipped, -0) ? 0 : flipped;
};

const calcDeg = (currentFace: number, faceNum: number, options: NormalizedOptions): RotationDeg => {
  const base = calcBaseDeg(currentFace, faceNum);
  const typed = applyAnimationType(base, currentFace, faceNum, options.type);
  return applyDirection(typed, options.direction) as RotationDeg;
};

// ── Z-index ───────────────────────────────────────────────────────────────────

const faceVisibility = (deg: RotationDeg): FaceVisibility => {
  const abs = Math.abs(deg);
  if (abs === 0 || abs === 360) return "front";
  if (abs === 90 || abs === 270) return "side";
  return "hidden";
};

const Z_INDEX: Record<FaceVisibility, number> = { front: 20, side: 10, hidden: 0 };

const calcZIndex = (deg: RotationDeg): number => Z_INDEX[faceVisibility(deg)];

// ── Translate tables ──────────────────────────────────────────────────────────

// Classifies a RotationDeg into its effective quadrant for translate lookups.
// pos90 = +90° rotation (or equivalent -270°); neg90 = -90° (or equivalent +270°).
type DegBucket = "zero" | "pos90" | "half" | "neg90";

const classifyDeg = (deg: RotationDeg): DegBucket => {
  if (deg === 0 || Math.abs(deg) === 360) return "zero";
  if (deg === 90 || deg === -270) return "pos90";
  if (Math.abs(deg) === 180) return "half";
  return "neg90";
};

// Fixed geometry: translate uses changeHalf = (deg<0 ? -l : l)/2.
// axis:Y — same formula for |deg|=90 and |deg|=270.
// axis:X — |deg|=90 negates changeHalf for y; |deg|=270 does not.
const calcFixedTranslate = (deg: RotationDeg, axis: Axis, length: number): [number, number, number] => {
  const abs = Math.abs(deg);
  if (abs === 0 || abs === 360) return [0, 0, 0];
  if (abs === 180) return [0, 0, length];
  const changeHalf = (deg < 0 ? -length : length) / 2;
  const half = length / 2;
  if (axis === "Y") return [changeHalf, 0, half];
  return abs === 90 ? [0, -changeHalf, half] : [0, changeHalf, half];
};

type VariableTranslateFactory = (l: number, e: number) => [number, number, number];

const variableTranslateTable: Record<Axis, Record<FaceParity, Record<DegBucket, VariableTranslateFactory>>> = {
  Y: {
    odd: {
      zero: () => [0, 0, 0],
      pos90: (_l, e) => [e, 0, 0],
      half: (l, e) => [e * 2 - l, 0, e],
      neg90: (l, e) => [e - l, 0, e],
    },
    even: {
      zero: () => [0, 0, 0],
      pos90: (l, e) => [e, 0, -(e - l)],
      half: (l, e) => [e, 0, l],
      neg90: (_l, e) => [0, 0, e],
    },
  },
  X: {
    odd: {
      zero: () => [0, 0, 0],
      pos90: (l, e) => [0, e - l, e],
      half: (l, e) => [0, e * 2 - l, e],
      neg90: (_l, e) => [0, e, 0],
    },
    even: {
      zero: () => [0, 0, 0],
      pos90: (_l, e) => [0, 0, e],
      half: (l, e) => [0, e, l],
      neg90: (l, e) => [0, e, -(e - l)],
    },
  },
};

const adjustTranslateTable: Record<Axis, Record<FaceParity, Record<DegBucket, VariableTranslateFactory>>> = {
  Y: {
    odd: {
      zero: () => [0, 0, 0],
      pos90: (_l, e) => [0, 0, e],
      half: (l, e) => [-l, 0, e],
      neg90: (l, _e) => [-l, 0, 0],
    },
    even: {
      zero: () => [0, 0, 0],
      pos90: (l, _e) => [0, 0, l],
      half: (l, e) => [-e, 0, l],
      neg90: (_l, e) => [-e, 0, 0],
    },
  },
  X: {
    odd: {
      zero: () => [0, 0, 0],
      pos90: (l, _e) => [0, -l, 0],
      half: (l, e) => [0, -l, e],
      neg90: (_l, e) => [0, 0, e],
    },
    even: {
      zero: () => [0, 0, 0],
      pos90: (_l, e) => [0, -e, 0],
      half: (l, e) => [0, -e, l],
      neg90: (l, _e) => [0, 0, l],
    },
  },
};

const lookupTranslate = (
  table: typeof variableTranslateTable,
  deg: RotationDeg,
  faceNum: number,
  geometry: Extract<Geometry, { kind: "variable" }>,
): [number, number, number] =>
  table[geometry.axis][getFaceParity(faceNum)][classifyDeg(deg)](geometry.length, geometry.even);

// ── Public API ────────────────────────────────────────────────────────────────

export const calcFaceTransform = (currentFace: number, faceNum: number, options: NormalizedOptions): FaceTransform => {
  const { geometry } = options;
  const deg = calcDeg(currentFace, faceNum, options);
  const [x, y, z] =
    geometry.kind === "fixed"
      ? calcFixedTranslate(deg, geometry.axis, geometry.length)
      : lookupTranslate(variableTranslateTable, deg, faceNum, geometry);
  const transformOrigin =
    geometry.kind === "fixed"
      ? TRANSFORM_ORIGIN_CENTER
      : geometry.axis === "X"
        ? `50% ${geometry.even}px`
        : `${geometry.even}px 50%`;

  return { axis: geometry.axis, deg, x, y, z, zIndex: calcZIndex(deg), transformOrigin };
};

export const calcAdjustFaceTransform = (
  currentFace: number,
  faceNum: number,
  options: NormalizedOptions,
): FaceTransform => {
  const { geometry } = options;
  const deg = calcDeg(currentFace, faceNum, options);
  // adjust is only used for variable geometry (fixed geometry never reaches hasAdjust=true)
  const [x, y, z] =
    geometry.kind === "variable" ? lookupTranslate(adjustTranslateTable, deg, faceNum, geometry) : [0, 0, 0];
  const transformOrigin = geometry.axis === "X" ? TRANSFORM_ORIGIN_TOP_EDGE : TRANSFORM_ORIGIN_LEFT_EDGE;

  return { axis: geometry.axis, deg, x, y, z, zIndex: calcZIndex(deg), transformOrigin };
};

export const calcPrePositionTransform = (via: VirtualWrapFace, opts: NormalizedOptions): string => {
  const { geometry, direction } = opts;
  const dirSign = direction === "negative" ? -1 : 1;
  const shortDeg = (via === VIRTUAL_NEXT_WRAP ? 90 : -90) * dirSign;
  const half = geometry.length / 2;
  const changeHalf = shortDeg < 0 ? -half : half;
  const [x, y, z]: [number, number, number] = geometry.axis === "Y" ? [changeHalf, 0, half] : [0, -changeHalf, half];
  return `rotate${geometry.axis}(${shortDeg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
};
