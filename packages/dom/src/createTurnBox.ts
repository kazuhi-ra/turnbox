import {
  normalizeOptions,
  calcFaceTransform,
  calcAdjustFaceTransform,
  resolveTransition,
  FOCUSABLE,
  type TurnBoxOptions,
  type NormalizedOptions,
  type ReduceAnimation,
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

type DomOptions = TurnBoxOptions & { ariaLabel?: string; reduceAnimation?: ReduceAnimation };

const ADJUST_TIME = 20;

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
    options.reduceAnimation !== "never" &&
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
  let animatingFromFace: number | null = null;
  let animatingDisplayFace: number | null = null;
  const pendingTimers: ReturnType<typeof setTimeout>[] = [];
  const pendingNavigations: Array<{ face: number; animation: boolean }> = [];

  const schedule = (fn: () => void, delay: number): void => {
    pendingTimers.push(setTimeout(fn, delay));
  };

  const getDisplayFace = (): number =>
    isAnimating && animatingDisplayFace !== null ? animatingDisplayFace : currentFace;

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

  const showFace = (faceNum: number): void => {
    const face = faces[faceNum - 1];
    if (!face) return;
    face.classList.add("turnBoxShow");
    face.removeAttribute("aria-hidden");
    face.inert = false;
  };

  const hideFace = (faceNum: number): void => {
    const face = faces[faceNum - 1];
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

  const abortAnimation = (): void => {
    for (const id of pendingTimers) clearTimeout(id);
    pendingTimers.length = 0;
    faces.forEach((f) => {
      f.classList.remove("turnBoxTransition");
      f.style.transition = "";
    });
    container.style.transition = "";
    container.classList.remove("turnBoxAdjust");
    const settleFace = animatingDisplayFace ?? currentFace;
    setCurrentFace(settleFace);
    applyFaceTransforms(faces, settleFace, opts);
    faces.forEach((_, i) => {
      const faceNum = i + 1;
      if (faceNum === settleFace) showFace(faceNum);
      else hideFace(faceNum);
    });
    isAnimating = false;
    animatingFromFace = null;
    animatingDisplayFace = null;
  };

  const animate = (rawTarget: number, animationFlag: boolean, startDelay = ADJUST_TIME): void => {
    if (isAnimating) {
      const displayFace = getDisplayFace();
      const checkTransition = resolveTransition(displayFace, rawTarget, opts, animationFlag);
      if (checkTransition.kind === "noop") return;

      const isImmediate = !animationFlag || checkTransition.to === animatingFromFace;

      if (!isImmediate) {
        pendingNavigations.push({ face: rawTarget, animation: animationFlag });
        return;
      }

      abortAnimation();
      pendingNavigations.length = 0;
    }

    const from = getDisplayFace();
    const transition = resolveTransition(from, rawTarget, opts, animationFlag);
    if (transition.kind === "noop") return;

    isAnimating = true;
    animatingFromFace = from;
    animatingDisplayFace = transition.to;

    const time = opts.duration + opts.delay;
    const hasAdjust = transition.kind === "step" && transition.hasAdjust;
    const finalFace = transition.to;
    options.onChange?.(finalFace);

    const drainQueue = (): void => {
      const pending = pendingNavigations.shift();
      if (pending) animate(pending.face, pending.animation, 0);
    };

    if (hasAdjust) {
      container.classList.add("turnBoxAdjust");
      applyAdjustTransforms(faces, from, opts);
      schedule(
        () => {
          container.classList.remove("turnBoxAdjust");
          applyFaceTransforms(faces, currentFace, opts);
          isAnimating = false;
          animatingFromFace = null;
          animatingDisplayFace = null;
          options.onAnimationEnd?.(finalFace);
          faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
          drainQueue();
        },
        time + ADJUST_TIME * 2,
      );
    }

    const targetFace = transition.to;

    const step = (): void => {
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
      }

      schedule(() => {
        faces.forEach((f) => {
          f.classList.remove("turnBoxTransition");
          f.style.transition = "";
          // Cancel compositor transition: forces committed inline value as CSS "before-change style".
          for (const anim of f.getAnimations?.() ?? []) anim.cancel();
        });
        if (geometry.kind === "variable") {
          container.style.transition = "";
        }
        hideFace(from);

        if (!hasAdjust) {
          isAnimating = false;
          animatingFromFace = null;
          animatingDisplayFace = null;
          options.onAnimationEnd?.(finalFace);
          faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
          drainQueue();
        }
      }, time);
    };

    schedule(step, startDelay);
  };

  const getCurrentFace = (): number => currentFace;

  return {
    goTo(face, animation = true) {
      animate(face, animation);
    },
    next() {
      animate(getDisplayFace() + 1, true);
    },
    prev() {
      animate(getDisplayFace() - 1, true);
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
