import { calcAdjustFaceTransform, calcFaceTransform } from "@turnbox/core";
import type { NormalizedOptions } from "@turnbox/core";
import { useTurnBoxContext } from "./context.js";
import type { AnimationPhase } from "./context.js";
import { toTransformString } from "./utils.js";

export type FaceProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type FaceInternalProps = FaceProps & { _faceIndex?: number };

const faceDimStyle = (faceIndex: number, opts: NormalizedOptions): React.CSSProperties => {
  const { geometry } = opts;
  if (geometry.kind !== "variable") return { inset: 0 };
  const isEven = faceIndex % 2 === 0;
  if (geometry.axis === "X") {
    return { width: "100%", height: isEven ? geometry.even : geometry.length };
  }
  return { width: isEven ? geometry.even : geometry.length, height: "100%" };
};

const hasTransition = (phase: AnimationPhase): boolean =>
  phase.kind === "animating" || phase.kind === "adjust-animating";

const usesFaceTransform = (phase: AnimationPhase): boolean =>
  phase.kind !== "adjusting" && phase.kind !== "adjust-animating";

export const Face = ({ children, className, style, _faceIndex = 0 }: FaceInternalProps) => {
  const { opts, displayFace, phase, shownFaces, faceOverrides } = useTurnBoxContext();

  const ft = usesFaceTransform(phase)
    ? calcFaceTransform(displayFace, _faceIndex, opts)
    : calcAdjustFaceTransform(displayFace, _faceIndex, opts);

  const override = faceOverrides.get(_faceIndex);
  const transformStr = override ?? toTransformString(ft);

  const faceStyle: React.CSSProperties = {
    // user styles first so component's required properties take precedence
    ...style,
    position: "absolute",
    ...faceDimStyle(_faceIndex, opts),
    transform: transformStr,
    transformOrigin: ft?.transformOrigin ?? "center",
    zIndex: ft?.zIndex ?? 0,
    opacity: shownFaces.has(_faceIndex) ? 1 : 0,
    backfaceVisibility: "visible",
    transition: hasTransition(phase)
      ? `transform ${opts.duration}ms ease ${opts.delay}ms`
      : undefined,
  };

  return (
    <div data-face-index={_faceIndex} className={className} style={faceStyle}>
      {children}
    </div>
  );
};
