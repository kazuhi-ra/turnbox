import {
  normalizeOptions,
  calcFaceTransform,
  calcAdjustFaceTransform,
  calcPrePositionTransform,
  resolveTransition,
  VIRTUAL_PREV_WRAP,
  VIRTUAL_NEXT_WRAP,
  type TurnBoxOptions,
  type NormalizedOptions,
} from "@kazuhi-ra/turnbox-core/internal";
import { toTransformString } from "./css.js";

export type TurnBoxInstance = {
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
  getCurrentFace(): number;
  isAnimating(): boolean;
  destroy(): void;
};

type DomOptions = TurnBoxOptions & { ariaLabel?: string };

const ADJUST_TIME = 20;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const applyFaceTransforms = (faces: HTMLElement[], currentFace: number, opts: NormalizedOptions): void => {
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    const t = calcFaceTransform(currentFace, faceNum, opts);
    face.style.transform = toTransformString(t);
    face.style.zIndex = String(t.zIndex);
    face.style.transformOrigin = t.transformOrigin;
  });
};

const applyAdjustTransforms = (faces: HTMLElement[], currentFace: number, opts: NormalizedOptions): void => {
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    const t = calcAdjustFaceTransform(currentFace, faceNum, opts);
    face.style.transform = toTransformString(t);
    face.style.zIndex = String(t.zIndex);
    face.style.transformOrigin = t.transformOrigin;
  });
};

export const createTurnBox = (container: HTMLElement, options: DomOptions): TurnBoxInstance => {
  const rawOpts = normalizeOptions(options);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const opts = prefersReducedMotion ? { ...rawOpts, duration: 0, delay: 0 } : rawOpts;
  const { geometry } = opts;
  const faces = Array.from(container.children).slice(0, opts.faces) as HTMLElement[];

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
    const face = faces[resolveRealFace(faceNum) - 1];
    if (!face) return;
    face.classList.add("turnBoxShow");
    face.removeAttribute("aria-hidden");
    face.inert = false;
  };

  const hideFace = (faceNum: number): void => {
    const face = faces[resolveRealFace(faceNum) - 1];
    if (!face) return;
    face.classList.remove("turnBoxShow");
    face.setAttribute("aria-hidden", "true");
    face.inert = true;
  };

  // Initialize
  // role="region" makes TurnBox a landmark for screen reader navigation (e.g. "R" key jump).
  // Only set when ariaLabel is provided — an unlabelled landmark is worse than no landmark.
  if (options.ariaLabel) {
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", options.ariaLabel);
  }
  container.style.perspective = `${opts.perspective}px`;
  container.classList.add("turnBoxContainer", `turnBoxCurrentFace${currentFace}`);
  if (geometry.kind === "variable") {
    container.style[geometry.axis === "X" ? "height" : "left"] = geometry.axis === "X" ? `${geometry.length}px` : "0px";
  }
  applyFaceTransforms(faces, currentFace, opts);
  faces[0]?.classList.add("turnBoxShow");
  for (const face of faces.slice(1)) {
    face.setAttribute("aria-hidden", "true");
    face.inert = true;
  }

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
    const finalFace: number = transition.kind === "virtual-wrap" ? transition.landAt : transition.to;
    options.onChange?.(finalFace);

    if (hasAdjust) {
      container.classList.add("turnBoxAdjust");
      applyAdjustTransforms(faces, from, opts);
      schedule(
        () => {
          container.classList.remove("turnBoxAdjust");
          applyFaceTransforms(faces, currentFace, opts);
          isAnimating = false;
          options.onAnimationEnd?.(finalFace);
          faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
        },
        time + ADJUST_TIME * 2,
      );
    }

    if (transition.kind === "virtual-wrap") {
      const incomingNum = transition.via === VIRTUAL_NEXT_WRAP ? 1 : 4;
      const incomingFaceEl = faces[incomingNum - 1];
      if (incomingFaceEl) incomingFaceEl.style.transform = calcPrePositionTransform(transition.via, opts);
    }

    const targetFace = transition.kind === "virtual-wrap" ? transition.via : transition.to;

    schedule(() => {
      if (transition.doAnimate) {
        faces.forEach((f) => {
          f.classList.add("turnBoxTransition");
          f.style.transition = `transform ${opts.duration}ms ${opts.easing} ${opts.delay}ms`;
        });
        if (geometry.kind === "variable") {
          const prop = geometry.axis === "X" ? "height" : "left";
          container.style.transition = `${prop} ${opts.duration}ms ${opts.easing} ${opts.delay}ms`;
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
          f.style.transition = "";
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

        if (!hasAdjust) {
          isAnimating = false;
          options.onAnimationEnd?.(finalFace);
          faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
        }
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
    isAnimating: () => isAnimating,
    destroy() {
      for (const id of pendingTimers) clearTimeout(id);
      pendingTimers.length = 0;
      faces.forEach((face) => {
        face.classList.remove(
          "turnBoxFace",
          "turnBoxShow",
          ...Array.from(face.classList).filter((c) => c.startsWith("turnBoxFaceNum")),
        );
        face.style.transform = "";
        face.style.zIndex = "";
        face.style.transformOrigin = "";
        face.style.transition = "";
        face.style.height = "";
        face.style.width = "";
        face.removeAttribute("aria-hidden");
        face.inert = false;
      });
      container.classList.remove(
        "turnBoxContainer",
        ...Array.from(container.classList).filter((c) => c.startsWith("turnBoxCurrentFace") || c === "turnBoxAdjust"),
      );
      container.style.height = "";
      container.style.left = "";
      container.style.transition = "";
      container.style.perspective = "";
      if (options.ariaLabel) {
        container.removeAttribute("role");
        container.removeAttribute("aria-label");
      }
    },
  };
};
