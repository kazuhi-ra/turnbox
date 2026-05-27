import {
  normalizeOptions,
  calcFaceTransform,
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

type PendingNav = { face: number; animation: boolean };

// Animation state machine.
// idle:      not animating; face is the settled face.
// animating: CSS transition in progress; from/to are the origin and destination faces;
//            queue holds navigations received while this animation is in flight.
type AnimState = { kind: "idle"; face: number } | { kind: "animating"; from: number; to: number; queue: PendingNav[] };

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

  let state: AnimState = { kind: "idle", face: 1 };

  // Tracks which turnBoxCurrentFaceN CSS class is currently applied to the container.
  // Updated by setCurrentFace() inside step(); kept separate from AnimState because it
  // reflects DOM-committed state rather than animation-phase state.
  let currentFace = 1;

  const pendingTimers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (fn: () => void, delay: number): void => {
    pendingTimers.push(setTimeout(fn, delay));
  };

  const getDisplayFace = (): number => (state.kind === "animating" ? state.to : state.face);

  const setCurrentFace = (n: number): void => {
    container.classList.remove(`turnBoxCurrentFace${currentFace}`);
    currentFace = n;
    container.classList.add(`turnBoxCurrentFace${n}`);
    geoOps.onFaceChange(n);
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
    const settleFace = state.kind === "animating" ? state.to : state.face;
    setCurrentFace(settleFace);
    applyFaceTransforms(faces, settleFace, opts);
    faces.forEach((_, i) => {
      const faceNum = i + 1;
      if (faceNum === settleFace) showFace(faceNum);
      else hideFace(faceNum);
    });
    // Transitioning to idle drops the queue — the animating state object (and its queue)
    // is discarded. Callers that want to clear the queue can rely on this implicitly.
    state = { kind: "idle", face: settleFace };
  };

  // Processes pending navigations accumulated during the animation that just completed.
  // queue is extracted from the animating state before transitioning to idle, then passed
  // here so that state is already idle when animate() is called for the next item.
  // After animate() establishes a new animating state, any remaining queue items are
  // transferred into it so they survive subsequent drain cycles.
  const drainQueue = (queue: PendingNav[]): void => {
    while (queue.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: shift() is safe inside while(length>0)
      const pending = queue.shift()!;
      const t = resolveTransition(getDisplayFace(), pending.face, opts, pending.animation);
      if (t.kind !== "noop") {
        animate(pending.face, pending.animation);
        if (state.kind === "animating" && queue.length > 0) {
          state.queue.unshift(...queue);
          queue.length = 0;
        }
        return;
      }
    }
  };

  const animate = (rawTarget: number, animationFlag: boolean): void => {
    if (state.kind === "animating") {
      const checkTransition = resolveTransition(state.to, rawTarget, opts, animationFlag);
      if (checkTransition.kind === "noop") return;

      const isImmediate = !animationFlag || checkTransition.to === state.from;

      if (!isImmediate) {
        state.queue.push({ face: checkTransition.to, animation: animationFlag });
        return;
      }

      // abortAnimation transitions state to idle, implicitly dropping the queue.
      abortAnimation();
    }

    const from = getDisplayFace();
    const transition = resolveTransition(from, rawTarget, opts, animationFlag);
    if (transition.kind === "noop") return;

    state = { kind: "animating", from, to: transition.to, queue: [] };

    const time = opts.duration + opts.delay;
    const finalFace = transition.to;
    const targetFace = transition.to;
    options.onChange?.(finalFace);

    const step = (): void => {
      if (transition.doAnimate) {
        faces.forEach((f) => {
          f.classList.add("turnBoxTransition");
          f.style.transition = `transform ${opts.duration}ms ${opts.easing} ${opts.delay}ms`;
        });
        geoOps.applyTransition();
      }

      showFace(targetFace);
      setCurrentFace(targetFace);
      applyFaceTransforms(faces, targetFace, opts);

      schedule(() => {
        faces.forEach((f) => {
          f.classList.remove("turnBoxTransition");
          f.style.transition = "";
          // Cancel compositor transition: forces committed inline value as CSS "before-change style".
          for (const anim of f.getAnimations?.() ?? []) anim.cancel();
        });
        geoOps.clearTransition();
        hideFace(from);
        // Extract queue before transitioning to idle so drainQueue can process it.
        const pendingQueue = state.kind === "animating" ? state.queue : [];
        state = { kind: "idle", face: finalFace };
        options.onAnimationEnd?.(finalFace);
        faces[currentFace - 1]?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
        drainQueue(pendingQueue);
      }, time);
    };

    // Show targetFace now so a paint between this task and step()'s setTimeout
    // task doesn't flash it invisible. At this point targetFace is at its
    // rotated idle position (≈90° edge-on) — geometrically invisible due to
    // backface-visibility:hidden — so showing it early causes no visual glitch.
    showFace(targetFace);
    schedule(step, 0);
  };

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
    getCurrentFace: () => currentFace,
    isAnimating: () => state.kind === "animating",
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
