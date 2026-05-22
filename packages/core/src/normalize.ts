import type { FaceCount, Geometry, NormalizedOptions, TurnBoxOptions } from "./types.js";

export const MAX_FACE_PCS = 4;
export const DEFAULT_DURATION = 800;
export const DEFAULT_DELAY = 50;
export const DEFAULT_SIZE = 200;

export const normalizeOptions = (options: TurnBoxOptions): NormalizedOptions => {
  const facePcs = Math.min(options.facePcs, MAX_FACE_PCS) as FaceCount;
  const axis = options.axis ?? "X";
  const direction = options.direction ?? "positive";
  const duration = options.duration ?? DEFAULT_DURATION;
  const delay = options.delay ?? DEFAULT_DELAY;
  const width = options.width ?? DEFAULT_SIZE;
  const height = options.height ?? DEFAULT_SIZE;
  const even = options.even ?? (axis === "Y" ? width : height);
  const length = axis === "Y" ? width : height;
  const fixed = even === length;

  // type:skip is forced to type:real when fixed=false
  const rawType = options.type ?? "real";
  const type = !fixed && rawType === "skip" ? "real" : rawType;

  const geometry: Geometry = fixed
    ? { kind: "fixed", axis, length }
    : { kind: "variable", axis, length, even };

  return { facePcs, direction, type, duration, delay, geometry };
};
