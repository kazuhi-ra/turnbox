import type { FaceTransform } from "@turnbox/core";

export const toTransformString = ({ axis, deg, x, y, z }: FaceTransform): string =>
  `rotate${axis}(${deg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
