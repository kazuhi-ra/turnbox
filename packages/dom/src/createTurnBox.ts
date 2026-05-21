import {
  normalizeOptions,
  calcFaceTransform,
  calcAdjustFaceTransform,
  resolveTransition,
  VIRTUAL_PREV_WRAP,
  VIRTUAL_NEXT_WRAP,
  type TurnBoxOptions,
  type NormalizedOptions,
  type VirtualWrapFace,
} from "@turnbox/core/internal";
import { toTransformString } from "./css.js";

export type TurnBoxInstance = {
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
  getCurrentFace(): number;
  destroy(): void;
};

const ADJUST_TIME = 20;

const applyFaceTransforms = (
  faces: HTMLElement[],
  currentFace: number,
  opts: NormalizedOptions,
): void => {
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    const t = calcFaceTransform(currentFace, faceNum, opts);
    face.style.transform = toTransformString(t);
    face.style.zIndex = String(t.zIndex);
    face.style.transformOrigin = t.transformOrigin;
  });
};

const applyAdjustTransforms = (
  faces: HTMLElement[],
  currentFace: number,
  opts: NormalizedOptions,
): void => {
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    const t = calcAdjustFaceTransform(currentFace, faceNum, opts);
    face.style.transform = toTransformString(t);
    face.style.zIndex = String(t.zIndex);
    face.style.transformOrigin = t.transformOrigin;
  });
};

export const createTurnBox = (container: HTMLElement, options: TurnBoxOptions): TurnBoxInstance => {
  const opts = normalizeOptions(options);
  const { geometry } = opts;
  const faces = Array.from(container.children).slice(0, opts.facePcs) as HTMLElement[];

  // Mark face elements and set dimensions for variable geometry
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    face.classList.add("turnBoxFace", `turnBoxFaceNum${faceNum}`);
    if (geometry.kind === "variable") {
      const isEven = faceNum % 2 === 0;
      if (geometry.axis === "X") {
        face.style.height = isEven ? `${geometry.even}px` : `${geometry.length}px`;
      } else {
        face.style.width = isEven ? `${geometry.even}px` : `${geometry.length}px`;
      }
    }
  });

  let currentFace = 1;
  let isAnimating = false;
  const pendingTimers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (fn: () => void, delay: number): void => {
    pendingTimers.push(setTimeout(fn, delay));
  };

  const setCurrentFace = (n: number): void => {
    container.classList.remove(`turnBoxCurrentFace${currentFace}`);
    currentFace = n;
    container.classList.add(`turnBoxCurrentFace${n}`);
    if (geometry.kind === "variable") {
      const isEven = n % 2 === 0;
      if (geometry.axis === "X") {
        container.style.height = isEven ? `${geometry.even}px` : `${geometry.length}px`;
      } else {
        container.style.left = isEven ? `${(geometry.length - geometry.even) / 2}px` : "0px";
      }
    }
  };

  const resolveRealFace = (faceNum: number): number => {
    if (faceNum === VIRTUAL_PREV_WRAP) return 4;
    if (faceNum === VIRTUAL_NEXT_WRAP) return 1;
    return faceNum;
  };

  const showFace = (faceNum: number): void => {
    faces[resolveRealFace(faceNum) - 1]?.classList.add("turnBoxShow");
  };

  const hideFace = (faceNum: number): void => {
    faces[resolveRealFace(faceNum) - 1]?.classList.remove("turnBoxShow");
  };

  // Initialize
  container.classList.add("turnBoxContainer", `turnBoxCurrentFace${currentFace}`);
  if (geometry.kind === "variable") {
    container.style[geometry.axis === "X" ? "height" : "left"] =
      geometry.axis === "X" ? `${geometry.length}px` : "0px";
  }
  applyFaceTransforms(faces, currentFace, opts);
  faces[0]?.classList.add("turnBoxShow");

  // Fixed-geometry wrap: incoming face sits at ±270° which CSS would interpolate
  // as a 270° arc in the wrong direction. Pre-position it at the equivalent ±90°
  // so the transition sweeps the correct 90° arc with connected edges.
  const prePositionIncomingFace = (via: VirtualWrapFace): void => {
    const incomingNum = via === VIRTUAL_NEXT_WRAP ? 1 : 4;
    const incomingFaceEl = faces[incomingNum - 1];
    if (!incomingFaceEl) return;
    const dirSign = opts.direction === "negative" ? -1 : 1;
    const shortDeg = (via === VIRTUAL_NEXT_WRAP ? 90 : -90) * dirSign;
    const half = geometry.length / 2;
    const changeHalf = shortDeg < 0 ? -half : half;
    const [x, y, z]: [number, number, number] =
      geometry.axis === "Y" ? [changeHalf, 0, half] : [0, -changeHalf, half];
    incomingFaceEl.style.transform =
      `rotate${geometry.axis}(${shortDeg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
  };

  // Fixed-geometry wrap: override incoming face to 0° so transition goes
  // from the pre-positioned ±90° to 0°, not from ±90° to ±360°.
  const overrideIncomingFaceToResting = (landAt: 1 | 4): void => {
    const incomingFaceEl = faces[landAt - 1];
    if (!incomingFaceEl) return;
    const t = calcFaceTransform(landAt, landAt, opts);
    incomingFaceEl.style.transform = toTransformString(t);
  };

  const animate = (rawTarget: number, animationFlag: boolean): void => {
    if (isAnimating) return;

    const transition = resolveTransition(currentFace, rawTarget, opts, animationFlag);
    if (transition.kind === "noop") return;

    isAnimating = true;
    const time = opts.duration + opts.delay;
    const from = currentFace;
    const hasAdjust = transition.kind === "step" && transition.hasAdjust;

    if (hasAdjust) {
      container.classList.add("turnBoxAdjust");
      applyAdjustTransforms(faces, from, opts);
      schedule(
        () => {
          container.classList.remove("turnBoxAdjust");
          applyFaceTransforms(faces, currentFace, opts);
          isAnimating = false;
        },
        time + ADJUST_TIME * 2,
      );
    }

    if (transition.kind === "virtual-wrap") {
      prePositionIncomingFace(transition.via);
    }

    const targetFace = transition.kind === "virtual-wrap" ? transition.via : transition.to;

    schedule(() => {
      if (transition.doAnimate) {
        faces.forEach((f) => {
          f.classList.add("turnBoxTransition");
        });
        if (geometry.kind === "variable") {
          const prop = geometry.axis === "X" ? "height" : "left";
          container.style.transition = `${prop} ${opts.duration}ms ease ${opts.delay}ms`;
        }
      }

      showFace(targetFace);
      setCurrentFace(targetFace);

      if (hasAdjust) {
        applyAdjustTransforms(faces, targetFace, opts);
      } else {
        applyFaceTransforms(faces, targetFace, opts);
        if (transition.kind === "virtual-wrap") {
          overrideIncomingFaceToResting(transition.landAt);
        }
      }

      schedule(() => {
        faces.forEach((f) => {
          f.classList.remove("turnBoxTransition");
        });
        if (geometry.kind === "variable") {
          container.style.transition = "";
        }
        hideFace(from);

        if (transition.kind === "virtual-wrap") {
          container.classList.remove(`turnBoxCurrentFace${transition.via}`);
          container.classList.add(`turnBoxCurrentFace${transition.landAt}`);
          currentFace = transition.landAt;
          applyFaceTransforms(faces, transition.landAt, opts);
        }

        if (!hasAdjust) isAnimating = false;
      }, time);
    }, ADJUST_TIME);
  };

  const getCurrentFace = (): number => currentFace;

  return {
    goTo(face, animation = true) {
      animate(face, animation);
    },
    next() {
      animate(currentFace + 1, true);
    },
    prev() {
      animate(currentFace - 1, true);
    },
    getCurrentFace,
    destroy() {
      for (const id of pendingTimers) clearTimeout(id);
      pendingTimers.length = 0;
      faces.forEach((face) => {
        face.classList.remove(
          "turnBoxFace",
          ...Array.from(face.classList).filter((c) => c.startsWith("turnBoxFaceNum")),
        );
        face.style.transform = "";
        face.style.zIndex = "";
        face.style.transformOrigin = "";
        face.style.height = "";
        face.style.width = "";
      });
      container.classList.remove(
        "turnBoxContainer",
        ...Array.from(container.classList).filter(
          (c) => c.startsWith("turnBoxCurrentFace") || c === "turnBoxAdjust",
        ),
      );
      container.style.height = "";
      container.style.left = "";
    },
  };
};
