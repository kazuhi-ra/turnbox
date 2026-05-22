import { useCallback, useEffect, useRef, useState } from "react";
import { createTurnBox, type TurnBoxInstance } from "@turnbox/dom";
import type { TurnBoxOptions } from "@turnbox/core";

export type UseTurnBoxReturn = {
  containerRef: React.RefObject<HTMLElement | null>;
  currentFace: number;
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
};

export const useTurnBox = (options: TurnBoxOptions): UseTurnBoxReturn => {
  const { facePcs, axis, direction, type, duration, delay, width, height, even } = options;

  const containerRef = useRef<HTMLElement>(null);
  const instanceRef = useRef<TurnBoxInstance | null>(null);
  const [currentFace, setCurrentFace] = useState(1);

  // Always call the latest callbacks without re-initializing the instance
  const onChangeRef = useRef(options.onChange);
  const onAnimationEndRef = useRef(options.onAnimationEnd);
  onChangeRef.current = options.onChange;
  onAnimationEndRef.current = options.onAnimationEnd;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = createTurnBox(el, {
      facePcs,
      axis,
      direction,
      type,
      duration,
      delay,
      width,
      height,
      even,
      onChange: (face) => {
        setCurrentFace(face);
        onChangeRef.current?.(face);
      },
      onAnimationEnd: (face) => {
        onAnimationEndRef.current?.(face);
      },
    });
    instanceRef.current = instance;
    setCurrentFace(instance.getCurrentFace());

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, [facePcs, axis, direction, type, duration, delay, width, height, even]);

  const goTo = useCallback((face: number, animation = true) => {
    instanceRef.current?.goTo(face, animation);
  }, []);

  const next = useCallback(() => {
    instanceRef.current?.next();
  }, []);

  const prev = useCallback(() => {
    instanceRef.current?.prev();
  }, []);

  return { containerRef, currentFace, goTo, next, prev };
};
