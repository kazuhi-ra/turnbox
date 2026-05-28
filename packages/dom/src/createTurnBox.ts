import {
  normalizeOptions,
  calcFaceTransform,
  FOCUSABLE,
  INITIAL_STATE,
  reducer,
  buildGoStepAction,
  buildGoInstantAction,
  resolveNavigation,
  buildDrainResult,
  type TurnBoxOptions,
  type NormalizedOptions,
  type ReduceAnimation,
  type TurnBoxState,
  type TurnBoxAction,
  type PendingNav,
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

// Animation state machine — shared with React and Vue via @kazuhi-ra/turnbox-core/internal.
// idle:      not animating; displayFace is the settled face.
// settling:  instant transition in-flight (doAnimate:false); timer fires to release isAnimating.
// animating: CSS transition in progress; from/to tracked in state.queue holds navigations
//            received while this animation is in flight.

const applyFaceTransforms = (faces: HTMLElement[], currentFace: number, opts: NormalizedOptions): void => {
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    const t = calcFaceTransform(currentFace, faceNum, opts);
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

  // Geometry-specific DOM operations, resolved once at init.
  // Fixed geometry: all methods are no-ops (faces are square; container needs no resizing).
  // Variable geometry: manages per-face sizing and container dimension/transition updates.
  const geoOps =
    geometry.kind === "variable"
      ? {
          initFace(face: HTMLElement, faceNum: number) {
            const isEven = faceNum % 2 === 0;
            face.style[geometry.axis === "X" ? "height" : "width"] = isEven
              ? `${geometry.even}px`
              : `${geometry.length}px`;
          },
          initContainer() {
            container.style[geometry.axis === "X" ? "height" : "left"] =
              geometry.axis === "X" ? `${geometry.length}px` : "0px";
          },
          onFaceChange(faceNum: number) {
            const isEven = faceNum % 2 === 0;
            if (geometry.axis === "X") {
              container.style.height = isEven ? `${geometry.even}px` : `${geometry.length}px`;
            } else {
              container.style.left = isEven ? `${(geometry.length - geometry.even) / 2}px` : "0px";
            }
          },
          applyTransition() {
            const prop = geometry.axis === "X" ? "height" : "left";
            container.style.transition = `${prop} ${opts.duration}ms ${opts.easing} ${opts.delay}ms`;
          },
          clearTransition() {
            container.style.transition = "";
          },
        }
      : {
          initFace(_face: HTMLElement, _faceNum: number) {},
          initContainer() {},
          onFaceChange(_faceNum: number) {},
          applyTransition() {},
          clearTransition() {},
        };

  // Mark face elements and set dimensions for variable geometry
  faces.forEach((face, i) => {
    const faceNum = i + 1;
    face.classList.add("turnBoxFace", `turnBoxFaceNum${faceNum}`);
    geoOps.initFace(face, faceNum);
  });

  let state: TurnBoxState = INITIAL_STATE;

  const dispatch = (action: TurnBoxAction): void => {
    state = reducer(state, action);
  };

  // Tracks which turnBoxCurrentFaceN CSS class is currently applied to the container.
  // Updated by setCurrentFace() inside step(); kept separate from state because it
  // reflects DOM-committed state rather than animation-phase state.
  let currentFace = 1;

  const pendingTimers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (fn: () => void, delay: number): void => {
    pendingTimers.push(setTimeout(fn, delay));
  };

  const setCurrentFace = (n: number): void => {
    if (currentFace === n) return;
    container.classList.remove(`turnBoxCurrentFace${currentFace}`);
    currentFace = n;
    container.classList.add(`turnBoxCurrentFace${n}`);
    geoOps.onFaceChange(n);
  };

  const showFaceVisual = (faceNum: number): void => {
    const face = faces[faceNum - 1];
    if (!face) return;
    // classList.add fires a MutationObserver record even when the token is already present
    // (Chrome and jsdom both exhibit this behavior). Guard to suppress no-op mutations.
    if (!face.classList.contains("turnBoxShow")) face.classList.add("turnBoxShow");
  };

  const showFaceA11y = (faceNum: number): void => {
    const face = faces[faceNum - 1];
    if (!face) return;
    face.removeAttribute("aria-hidden");
    face.inert = false;
  };

  const showFace = (faceNum: number): void => {
    showFaceVisual(faceNum);
    showFaceA11y(faceNum);
  };

  const hideFace = (faceNum: number): void => {
    const face = faces[faceNum - 1];
    if (!face) return;
    // classList.remove fires a MutationObserver record even when the token is absent
    // (Chrome and jsdom both exhibit this behavior). Guard to suppress no-op mutations.
    if (face.classList.contains("turnBoxShow")) face.classList.remove("turnBoxShow");
    if (face.getAttribute("aria-hidden") !== "true") face.setAttribute("aria-hidden", "true");
    if (!face.inert) face.inert = true;
  };

  // Reconcile DOM face visibility with state.shownFaces.
  const syncFaceVisibility = (): void => {
    faces.forEach((_, i) => {
      const faceNum = i + 1;
      if (state.shownFaces.has(faceNum)) showFace(faceNum);
      else hideFace(faceNum);
    });
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
  geoOps.initContainer();
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
      // Do NOT cancel WAAPI here. The new animation's CSS transition will use the current
      // compositor mid-value as its before-change style, enabling smooth reversal.
      // anim.cancel() belongs only in the completion cleanup timer (below in step()).
    });
    geoOps.clearTransition();
    container.classList.remove("turnBoxAdjust");
    const settleFace = state.displayFace;
    dispatch({ type: "ABORT", displayFace: settleFace });
    setCurrentFace(settleFace);
    applyFaceTransforms(faces, settleFace, opts);
    syncFaceVisibility();
  };

  // Processes pending navigations accumulated during the animation that just completed.
  // queue is a snapshot captured before COMPLETE/SETTLE dispatch (which drops the queue).
  const drainQueue = (settledFace: number, queue: PendingNav[]): void => {
    const result = buildDrainResult(settledFace, queue, opts);
    if (result.kind === "empty") return;
    animate(result.nav.face, result.nav.animation);
    if (state.kind !== "idle") {
      for (const item of result.enqueue) dispatch({ type: "ENQUEUE", nav: item });
    }
  };

  const animate = (rawTarget: number, animationFlag: boolean): void => {
    let decision = resolveNavigation(state, rawTarget, opts, animationFlag);
    if (decision.kind === "noop") return;
    if (decision.kind === "enqueue") {
      dispatch({ type: "ENQUEUE", nav: decision.nav });
      return;
    }
    if (decision.kind === "abort") {
      abortAnimation();
      decision = resolveNavigation(state, rawTarget, opts, animationFlag);
      if (decision.kind !== "go") return;
    }

    const { from, to, doAnimate } = decision;
    const time = opts.duration + opts.delay;
    options.onChange?.(to);

    if (doAnimate) {
      dispatch(buildGoStepAction(to, from)); // shownFaces = {from, to}
    } else {
      dispatch(buildGoInstantAction(to, from)); // shownFaces = {to}
    }
    if (doAnimate) {
      // turnBoxShow is added early to prevent a paint flash between this task and
      // step()'s setTimeout task. a11y (aria-hidden/inert) for the to-face is deferred
      // to step() — run atomically after applyFaceTransforms() places the face at
      // center — so screen readers never see a face at a side position, and both
      // from and to faces start the CSS transition from their side positions (bilateral).
      faces.forEach((_, i) => {
        const faceNum = i + 1;
        if (state.shownFaces.has(faceNum)) {
          showFaceVisual(faceNum);
          if (faceNum !== to) showFaceA11y(faceNum);
          // to-face: visual only; a11y deferred to step() after applyFaceTransforms
        } else {
          hideFace(faceNum);
        }
      });
    } else {
      syncFaceVisibility();
    }

    const step = (): void => {
      if (doAnimate) {
        faces.forEach((f) => {
          f.classList.add("turnBoxTransition");
          f.style.transition = `transform ${opts.duration}ms ${opts.easing} ${opts.delay}ms`;
        });
        geoOps.applyTransition();
      }

      setCurrentFace(to);
      applyFaceTransforms(faces, to, opts);
      if (doAnimate) showFaceA11y(to);

      schedule(() => {
        faces.forEach((f) => {
          f.classList.remove("turnBoxTransition");
          f.style.transition = "";
          // Cancel compositor transition: forces committed inline value as CSS "before-change style".
          for (const anim of f.getAnimations?.() ?? []) anim.cancel();
        });
        geoOps.clearTransition();

        // Capture queue before COMPLETE/SETTLE resets state to idle (dropping queue).
        const pendingQueue: PendingNav[] = state.kind !== "idle" ? [...state.queue] : [];
        if (doAnimate) {
          dispatch({ type: "COMPLETE", displayFace: to });
        } else {
          dispatch({ type: "SETTLE" });
        }
        syncFaceVisibility(); // hide from-face after animation completes

        options.onAnimationEnd?.(to);
        faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
        drainQueue(to, pendingQueue);
      }, time);
    };

    schedule(step, 0);
  };

  return {
    goTo(face, animation = true) {
      animate(face, animation);
    },
    next() {
      animate(state.displayFace + 1, true);
    },
    prev() {
      animate(state.displayFace - 1, true);
    },
    getCurrentFace: () => currentFace,
    isAnimating: () => state.kind !== "idle",
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
