import type { FaceTransform } from "@turnbox/core";

export const toTransformString = (ft: FaceTransform): string =>
  `rotate${ft.axis}(${ft.deg}deg) translate3d(${ft.x}px, ${ft.y}px, ${ft.z}px)`;
