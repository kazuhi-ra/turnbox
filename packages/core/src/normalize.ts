import type { FaceCount, Geometry, NormalizedOptions, TurnBoxOptions } from "./types.js";

export const MAX_FACE_PCS = 4;
export const DEFAULT_DURATION = 200;
export const DEFAULT_DELAY = 0;
export const DEFAULT_EASING = "linear";
export const DEFAULT_PERSPECTIVE = 800;
export const DEFAULT_SIZE = 200;
export const DEFAULT_HEIGHT = 50;

export const normalizeOptions = (options: TurnBoxOptions): NormalizedOptions => {
  const faces = Math.min(options.faces, MAX_FACE_PCS) as FaceCount;
  const axis = options.axis ?? "X";
  const direction = options.direction ?? "positive";
  const duration = options.duration ?? DEFAULT_DURATION;
  const delay = options.delay ?? DEFAULT_DELAY;
  const easing = options.easing ?? DEFAULT_EASING;
  const perspective = options.perspective ?? DEFAULT_PERSPECTIVE;
  const width = options.width ?? DEFAULT_SIZE;
  const height = options.height ?? DEFAULT_HEIGHT;
  const even = options.even ?? (axis === "Y" ? width : height);
  const length = axis === "Y" ? width : height;
  const fixed = even === length;

  // type:skip is forced to type:real when fixed=false
  const rawType = options.type ?? "real";
  const type = !fixed && rawType === "skip" ? "real" : rawType;

  const geometry: Geometry = fixed ? { kind: "fixed", axis, length } : { kind: "variable", axis, length, even };
  const reduceMotion = options.reduceMotion ?? "user";

  return { faces, direction, type, duration, delay, easing, perspective, geometry, reduceMotion };
};
