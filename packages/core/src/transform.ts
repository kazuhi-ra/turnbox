import type { Axis, FaceParity, FaceTransform, FaceVisibility, NormalizedOptions, RotationDeg } from "./types.js";
import { MAX_FACE_PCS } from "./normalize.js";

export const getFaceParity = (faceNum: number): FaceParity => (faceNum % 2 !== 0 ? "odd" : "even");

// ── Degree calculation ────────────────────────────────────────────────────────

const calcBaseDeg = (currentFace: number, faceNum: number): number => (currentFace - faceNum) * -90;

const isWrapEdge = (currentFace: number, faceNum: number): boolean =>
  (currentFace === MAX_FACE_PCS && faceNum === 1) || (currentFace === 1 && faceNum === MAX_FACE_PCS);

// skip: all faces clamped to ±90° (no face ever passes through 180°).
// At the wrap edge (face1↔face4), the sign flips so the face approaches from the
// opposite side — consistent with the wrap direction.
const calcDegSkip = (base: number, currentFace: number, faceNum: number): number => {
  const clamped = Math.sign(base) * 90;
  return isWrapEdge(currentFace, faceNum) ? -clamped : clamped;
};

// real: sequential rotation; wrap edges clamped to ±90° to prevent 270° backward spin.
// Without clamping, face4 at currentFace=1 would be at -270° (visually same as 90°,
// but animates backward through 180° when transitioning).
const calcDegReal = (base: number, currentFace: number, faceNum: number): number => {
  if (!isWrapEdge(currentFace, faceNum)) return base;
  return Math.sign(base) * -90;
};

// repeat: parity determines side — odd current→even face = +90°, even current→odd face = -90°.
// Non-parity pairs (odd→odd, even→even) fall through to sequential rotation.
const calcDegRepeat = (base: number, currentFace: number, faceNum: number): number => {
  if (getFaceParity(currentFace) === "odd" && getFaceParity(faceNum) === "even") return 90;
  if (getFaceParity(currentFace) === "even" && getFaceParity(faceNum) === "odd") return -90;
  return base;
};

const applyDirection = (deg: number, direction: NormalizedOptions["direction"]): number => {
  if (direction !== "negative") return deg;
  const flipped = deg * -1;
  // deg=0 (currentFace===faceNum) yields -0, which would render as "-0deg" in CSS
  return Object.is(flipped, -0) ? 0 : flipped;
};

const calcDeg = (currentFace: number, faceNum: number, options: NormalizedOptions): RotationDeg => {
  const base = calcBaseDeg(currentFace, faceNum);
  const typed =
    options.type === "skip"
      ? calcDegSkip(base, currentFace, faceNum)
      : options.type === "repeat"
        ? calcDegRepeat(base, currentFace, faceNum)
        : calcDegReal(base, currentFace, faceNum);
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

// ── Translate calculation ─────────────────────────────────────────────────────

// Unified translate for fixed (pivot=length/2, evenSize=length) and variable
// (pivot=even, evenSize=even) geometries.  Geometric constraint: adjacent faces
// share their connecting edge in world coordinates.
//
// For ±90°, isPos===isY groups the axis/direction pairs that share a formula:
//   Y.odd.pos90 ≡ X.odd.neg90  and  Y.odd.neg90 ≡ X.odd.pos90
//   Y.even.pos90 ≡ X.even.neg90  and  Y.even.neg90 ≡ X.even.pos90
const calcTranslate = (
  deg: RotationDeg,
  faceNum: number,
  axis: Axis,
  length: number,
  pivot: number,
  evenSize: number,
): [number, number, number] => {
  const abs = Math.abs(deg);
  if (abs === 0 || abs === 360) return [0, 0, 0];

  const parity = getFaceParity(faceNum);

  if (abs === 180) {
    const lateral = parity === "odd" ? 2 * pivot - length : 2 * pivot - evenSize;
    const tz = parity === "odd" ? evenSize : length;
    return axis === "Y" ? [lateral, 0, tz] : [0, lateral, tz];
  }

  const isPos = deg > 0;
  const isY = axis === "Y";
  let lateral: number;
  let tz: number;

  if (parity === "odd") {
    if (isPos === isY) {
      lateral = pivot;
      tz = evenSize - pivot;
    } else {
      lateral = pivot - length;
      tz = pivot;
    }
  } else {
    if (isPos === isY) {
      lateral = pivot;
      tz = length - pivot;
    } else {
      lateral = pivot - evenSize;
      tz = pivot;
    }
  }

  return axis === "Y" ? [lateral, 0, tz] : [0, lateral, tz];
};

// ── Public API ────────────────────────────────────────────────────────────────

export const calcFaceTransform = (currentFace: number, faceNum: number, options: NormalizedOptions): FaceTransform => {
  const { geometry } = options;
  const deg = calcDeg(currentFace, faceNum, options);
  const pivot = geometry.kind === "fixed" ? geometry.length / 2 : geometry.even;
  const evenSize = geometry.kind === "fixed" ? geometry.length : geometry.even;
  const [x, y, z] = calcTranslate(deg, faceNum, geometry.axis, geometry.length, pivot, evenSize);
  const transformOrigin = geometry.axis === "X" ? `50% ${pivot}px` : `${pivot}px 50%`;

  return { axis: geometry.axis, deg, x, y, z, zIndex: calcZIndex(deg), transformOrigin };
};
