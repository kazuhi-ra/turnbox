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
  let observer: MutationObserver | null = null;

  const init = (): void => {
    const el = containerRef.value;
    if (!el) return;

    instance = createTurnBox(el, options);
    currentFace.value = instance.getCurrentFace();

    observer = new MutationObserver(() => {
      currentFace.value = instance?.getCurrentFace() ?? currentFace.value;
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  };

  const cleanup = (): void => {
    observer?.disconnect();
    observer = null;
    instance?.destroy();
    instance = null;
  };

  onMounted(init);
  onUnmounted(cleanup);

  // Recreate instance when options change
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
