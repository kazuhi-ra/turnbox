import type { FaceTransform } from "@kazuhi-ra/turnbox-core";

export const toTransformString = (ft: FaceTransform): string =>
  `rotate${ft.axis}(${ft.deg}deg) translate3d(${ft.x}px, ${ft.y}px, ${ft.z}px)`;
