import {
  normalizeOptions,
  calcFaceTransform,
  calcAdjustFaceTransform,
  shouldAnimate,
  type TurnBoxOptions,
  type NormalizedOptions,
} from "@turnbox/core";
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

const shouldAddAdjust = (
  currentFace: number,
  targetFace: number,
  opts: NormalizedOptions,
): boolean => {
  if (opts.fixed || opts.type !== "real") return false;
  const pairs =
    opts.direction === "negative"
      ? [
          [0, 5],
          [1, 2],
          [2, 1],
          [3, 4],
          [4, 3],
          [5, 0],
        ]
      : [
          [0, 1],
          [1, 0],
          [2, 3],
          [3, 2],
          [4, 5],
          [5, 4],
        ];
  return pairs.some(([c, t]) => c === currentFace && t === targetFace);
};

export const createTurnBox = (container: HTMLElement, options: TurnBoxOptions): TurnBoxInstance => {
  const opts = normalizeOptions(options);
  const faces = Array.from(container.children).slice(0, opts.facePcs) as HTMLElement[];

  // Mark face elements and set dimensions for variable geometry
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    face.classList.add("turnBoxFace", `turnBoxFaceNum${faceNum}`);
    if (!opts.fixed) {
      const isEven = faceNum % 2 === 0;
      if (opts.axis === "X") {
        face.style.height = isEven ? `${opts.even}px` : `${opts.height}px`;
      } else {
        face.style.width = isEven ? `${opts.even}px` : `${opts.width}px`;
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
    if (!opts.fixed) {
      const isEven = n % 2 === 0;
      if (opts.axis === "X") {
        container.style.height = isEven ? `${opts.even}px` : `${opts.height}px`;
      } else {
        container.style.left = isEven ? `${(opts.width - opts.even) / 2}px` : "0px";
      }
    }
  };

  const showFace = (faceNum: number): void => {
    const realNum = faceNum === 0 ? 4 : faceNum === 5 ? 1 : faceNum;
    faces[realNum - 1]?.classList.add("turnBoxShow");
  };

  const hideFace = (faceNum: number): void => {
    const realNum = faceNum === 0 ? 4 : faceNum === 5 ? 1 : faceNum;
    faces[realNum - 1]?.classList.remove("turnBoxShow");
  };

  // Initialize
  container.classList.add("turnBoxContainer", `turnBoxCurrentFace${currentFace}`);
  if (!opts.fixed) {
    if (opts.axis === "X") {
      container.style.height = `${opts.height}px`;
    } else {
      container.style.left = "0px";
    }
  }
  applyFaceTransforms(faces, currentFace, opts);
  faces[0]?.classList.add("turnBoxShow");

  const animate = (rawTarget: number, animationFlag: boolean): void => {
    if (isAnimating) return;
    let targetFace = rawTarget;
    let isWrap = false;

    if (opts.facePcs === 4) {
      if (opts.type === "real") {
        // type:real: virtual face 0/5 are valid; clamp anything further out
        if (targetFace > 5) targetFace = opts.facePcs;
        if (targetFace < 0) return;
      } else if (opts.type === "repeat" || opts.type === "skip") {
        // repeat/skip: direct remap at boundary (no virtual face)
        if (targetFace === opts.facePcs + 1) {
          targetFace = 1;
          isWrap = true;
        } else if (targetFace === 0) {
          targetFace = opts.facePcs;
          isWrap = true;
        } else if (targetFace < 1 || targetFace > opts.facePcs) {
          return;
        }
      } else {
        if (targetFace < 1 || targetFace > opts.facePcs) return;
      }
    } else {
      // non-4-face: clamp to valid range, no wrap
      if (targetFace < 1) return;
      if (targetFace > opts.facePcs) targetFace = opts.facePcs;
    }

    if (currentFace === targetFace) return;

    // For repeat wrap, shouldAnimate returns false (diff=3>1, not skip), so force it
    const doAnimate =
      isWrap && opts.type === "repeat"
        ? animationFlag
        : shouldAnimate(currentFace, targetFace, opts, animationFlag);
    const time = opts.duration + opts.delay;
    const from = currentFace;
    const hasAdjust = shouldAddAdjust(from, targetFace, opts);

    isAnimating = true;

    if (hasAdjust) {
      container.classList.add("turnBoxAdjust");
      applyAdjustTransforms(faces, from, opts);
      schedule(
        () => {
          container.classList.remove("turnBoxAdjust");
          applyFaceTransforms(faces, currentFace, opts);
          isAnimating = false;
        },
        time + ADJUST_TIME + 20,
      );
    }

    // Fixed-geometry wrap: incoming face sits at ±270° which CSS would interpolate
    // as a 270° arc in the wrong direction. Pre-position it at the equivalent ±90°
    // so the transition sweeps the correct 90° arc with connected edges.
    if (opts.fixed && (targetFace === 5 || targetFace === 0)) {
      const isNextWrap = targetFace === 5;
      const incomingNum = isNextWrap ? 1 : 4;
      const incomingFaceEl = faces[incomingNum - 1];
      if (incomingFaceEl) {
        const dirSign = opts.direction === "negative" ? -1 : 1;
        const shortDeg = (isNextWrap ? 90 : -90) * dirSign;
        const len = opts.axis === "Y" ? opts.width : opts.height;
        const changeHalf = shortDeg < 0 ? -(len / 2) : len / 2;
        const half = len / 2;
        const [x, y, z]: [number, number, number] =
          opts.axis === "Y" ? [changeHalf, 0, half] : [0, -changeHalf, half];
        incomingFaceEl.style.transform = `rotate${opts.axis}(${shortDeg}deg) translate3d(${x}px, ${y}px, ${z}px)`;
      }
    }

    schedule(() => {
      if (doAnimate) {
        faces.forEach((f) => {
          f.classList.add("turnBoxTransition");
        });
        if (!opts.fixed) {
          const prop = opts.axis === "X" ? "height" : "left";
          container.style.transition = `${prop} ${opts.duration}ms ease ${opts.delay}ms`;
        }
      }

      showFace(targetFace);
      setCurrentFace(targetFace);

      // When hasAdjust, transition must go from adjust(from) to adjust(target),
      // keeping origin "50% 0px" throughout — matching the original jQuery CSS rule
      // behavior (.box.turnBoxCurrentFaceN.turnBoxAdjust selector activates for
      // the new face). Regular transforms apply in the cleanup after animation.
      if (hasAdjust) {
        applyAdjustTransforms(faces, targetFace, opts);
      } else {
        applyFaceTransforms(faces, targetFace, opts);
        // Fixed-geometry wrap: override incoming face to 0° so transition goes
        // from the pre-positioned ±90° to 0°, not from ±90° to ±360°.
        if (opts.fixed && (targetFace === 5 || targetFace === 0)) {
          const incomingNum = targetFace === 5 ? 1 : 4;
          const incomingFaceEl = faces[incomingNum - 1];
          if (incomingFaceEl) {
            const t = calcFaceTransform(incomingNum, incomingNum, opts);
            incomingFaceEl.style.transform = toTransformString(t);
          }
        }
      }

      // Resolve virtual faces after animation
      const realTarget = targetFace === 0 ? 4 : targetFace === 5 ? 1 : targetFace;

      schedule(() => {
        faces.forEach((f) => {
          f.classList.remove("turnBoxTransition");
        });
        if (!opts.fixed) {
          container.style.transition = "";
        }
        hideFace(from);

        if (targetFace === 0 || targetFace === 5) {
          container.classList.remove(`turnBoxCurrentFace${targetFace}`);
          container.classList.add(`turnBoxCurrentFace${realTarget}`);
          currentFace = realTarget;
          applyFaceTransforms(faces, realTarget, opts);
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
