import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { createTurnBox, type TurnBoxInstance } from "@kazuhi-ra/turnbox-dom";
import type { TurnBoxOptions } from "@kazuhi-ra/turnbox-core";
import { injectTurnBoxConfig } from "./TurnBox/configContext.js";

export type UseTurnBoxReturn = {
  containerRef: Ref<HTMLElement | null>;
  currentFace: Ref<number>;
  isAnimating: Ref<boolean>;
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
};

export const useTurnBox = (options: TurnBoxOptions): UseTurnBoxReturn => {
  const config = injectTurnBoxConfig();
  const containerRef = ref<HTMLElement | null>(null);
  const currentFace = ref(1);
  const isAnimating = ref(false);
  let instance: TurnBoxInstance | null = null;

  const init = (): void => {
    const el = containerRef.value;
    if (!el) return;

    instance = createTurnBox(el, {
      ...options,
      reduceMotion: options.reduceMotion ?? config.reduceMotion,
      onChange: (face) => {
        currentFace.value = face;
        isAnimating.value = true;
        options.onChange?.(face);
      },
      onAnimationEnd: (face) => {
        isAnimating.value = false;
        options.onAnimationEnd?.(face);
      },
    });
    currentFace.value = instance.getCurrentFace();
  };

  const cleanup = (): void => {
    instance?.destroy();
    instance = null;
  };

  onMounted(init);
  onUnmounted(cleanup);

  watch(
    () => [
      options.faces,
      options.axis,
      options.direction,
      options.type,
      options.duration,
      options.delay,
      options.easing,
      options.perspective,
      options.width,
      options.height,
      options.even,
      options.reduceMotion ?? config.reduceMotion,
    ],
    () => {
      cleanup();
      init();
    },
  );

  return {
    containerRef,
    currentFace,
    isAnimating,
    goTo: (face, animation = true) => instance?.goTo(face, animation),
    next: () => instance?.next(),
    prev: () => instance?.prev(),
  };
};
