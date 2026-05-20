import type { FaceTransform, NormalizedOptions } from "./types.js";

const calcDeg = (currentFace: number, faceNum: number, options: NormalizedOptions): number => {
  const { type, direction } = options;
  let deg = (currentFace - faceNum) * -90;

  if (type === "skip") {
    if (deg < 0) deg = -90;
    else if (deg > 0) deg = 90;
    // wrap edges: currentFace4+faceNum1 or currentFace1+faceNum4 flip sign
    if ((currentFace === 4 && faceNum === 1) || (currentFace === 1 && faceNum === 4)) {
      deg = deg * -1;
    }
  }

  if (type === "repeat") {
    const currentOdd = currentFace % 2 !== 0;
    const faceEven = faceNum % 2 === 0;
    if (currentOdd && faceEven) deg = 90;
    if (!currentOdd && !faceEven) deg = -90;
  }

  if (direction === "negative") {
    deg = deg * -1;
    if (Object.is(deg, -0)) deg = 0;
  }

  return deg;
};

const calcZIndex = (deg: number): number => {
  const abs = Math.abs(deg);
  if (abs === 0 || abs === 360) return 20;
  if (abs === 90 || abs === 270) return 10;
  return 0;
};

// translate3d for fixed geometry (even === length)
const calcFixedTranslate = (
  deg: number,
  axis: "X" | "Y",
  length: number,
): [number, number, number] => {
  const changeLength = deg < 0 ? -length : length;
  const half = length / 2;
  const changeHalf = changeLength / 2;

  if (deg === 0 || Math.abs(deg) === 360) return [0, 0, 0];

  if (axis === "Y") {
    if (Math.abs(deg) === 90) return [changeHalf, 0, half];
    if (Math.abs(deg) === 180) return [0, 0, length];
    if (Math.abs(deg) === 270) return [changeHalf, 0, half];
  } else {
    if (Math.abs(deg) === 90) return [0, -changeHalf, half];
    if (Math.abs(deg) === 180) return [0, 0, length];
    if (Math.abs(deg) === 270) return [0, changeHalf, half];
  }
  return [0, 0, 0];
};

// translate3d for variable geometry (even !== length)
const calcVariableTranslate = (
  deg: number,
  faceNum: number,
  axis: "X" | "Y",
  length: number,
  even: number,
): [number, number, number] => {
  if (deg === 0 || Math.abs(deg) === 360) return [0, 0, 0];

  const faceOdd = faceNum % 2 !== 0;

  if (axis === "Y") {
    if (faceOdd) {
      if (deg === 90 || deg === -270) return [even, 0, 0];
      if (Math.abs(deg) === 180) return [even * 2 - length, 0, even];
      if (deg === 270 || deg === -90) return [even - length, 0, even];
    } else {
      if (deg === 90 || deg === -270) return [even, 0, -(even - length)];
      if (Math.abs(deg) === 180) return [even, 0, length];
      if (deg === 270 || deg === -90) return [0, 0, even];
    }
  } else {
    if (faceOdd) {
      if (deg === 90 || deg === -270) return [0, even - length, even];
      if (Math.abs(deg) === 180) return [0, even * 2 - length, even];
      if (deg === 270 || deg === -90) return [0, even, 0];
    } else {
      if (deg === 90 || deg === -270) return [0, 0, even];
      if (Math.abs(deg) === 180) return [0, even, length];
      if (deg === 270 || deg === -90) return [0, even, -(even - length)];
    }
  }
  return [0, 0, 0];
};

// translate3d for turnBoxAdjust (variable, adjust=true)
const calcAdjustTranslate = (
  deg: number,
  faceNum: number,
  axis: "X" | "Y",
  length: number,
  even: number,
): [number, number, number] => {
  if (deg === 0 || Math.abs(deg) === 360) return [0, 0, 0];

  const faceOdd = faceNum % 2 !== 0;

  if (axis === "Y") {
    if (faceOdd) {
      if (deg === 90 || deg === -270) return [0, 0, even];
      if (Math.abs(deg) === 180) return [-length, 0, even];
      if (deg === 270 || deg === -90) return [-length, 0, 0];
    } else {
      if (deg === 90 || deg === -270) return [0, 0, length];
      if (Math.abs(deg) === 180) return [-even, 0, length];
      if (deg === 270 || deg === -90) return [-even, 0, 0];
    }
  } else {
    if (faceOdd) {
      if (deg === 90 || deg === -270) return [0, -length, 0];
      if (Math.abs(deg) === 180) return [0, -length, even];
      if (deg === 270 || deg === -90) return [0, 0, even];
    } else {
      if (deg === 90 || deg === -270) return [0, -even, 0];
      if (Math.abs(deg) === 180) return [0, -even, length];
      if (deg === 270 || deg === -90) return [0, 0, length];
    }
  }
  return [0, 0, 0];
};

export const calcFaceTransform = (
  currentFace: number,
  faceNum: number,
  options: NormalizedOptions,
): FaceTransform => {
  const { axis, fixed, even } = options;
  const length = axis === "Y" ? options.width : options.height;
  const deg = calcDeg(currentFace, faceNum, options);
  const [x, y, z] = fixed
    ? calcFixedTranslate(deg, axis, length)
    : calcVariableTranslate(deg, faceNum, axis, length, even);
  const transformOrigin = fixed ? "50% 50%" : axis === "X" ? `50% ${even}px` : `${even}px 50%`;

  return { axis, deg, x, y, z, zIndex: calcZIndex(deg), transformOrigin };
};

export const calcAdjustFaceTransform = (
  currentFace: number,
  faceNum: number,
  options: NormalizedOptions,
): FaceTransform => {
  const { axis, even } = options;
  const length = axis === "Y" ? options.width : options.height;
  const deg = calcDeg(currentFace, faceNum, options);
  const [x, y, z] = calcAdjustTranslate(deg, faceNum, axis, length, even);
  const transformOrigin = axis === "X" ? "50% 0px" : "0px 50%";

  return { axis, deg, x, y, z, zIndex: calcZIndex(deg), transformOrigin };
};
