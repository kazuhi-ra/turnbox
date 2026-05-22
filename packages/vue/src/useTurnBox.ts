import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { createTurnBox, type TurnBoxInstance } from "@turnbox/dom";
import type { TurnBoxOptions } from "@turnbox/core";

export type UseTurnBoxReturn = {
  containerRef: Ref<HTMLElement | null>;
  currentFace: Ref<number>;
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
};

export const useTurnBox = (options: TurnBoxOptions): UseTurnBoxReturn => {
  const containerRef = ref<HTMLElement | null>(null);
  const currentFace = ref(1);
  let instance: TurnBoxInstance | null = null;

  const init = (): void => {
    const el = containerRef.value;
    if (!el) return;

    instance = createTurnBox(el, {
      ...options,
      onChange: (face) => {
        currentFace.value = face;
        options.onChange?.(face);
      },
      onAnimationEnd: (face) => {
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
      options.facePcs,
      options.axis,
      options.direction,
      options.type,
      options.duration,
      options.delay,
      options.width,
      options.height,
      options.even,
    ],
    () => {
      cleanup();
      init();
    },
  );

  return {
    containerRef,
    currentFace,
    goTo: (face, animation = true) => instance?.goTo(face, animation),
    next: () => instance?.next(),
    prev: () => instance?.prev(),
  };
};
