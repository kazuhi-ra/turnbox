import { useCallback, useEffect, useRef, useState } from "react";
import { createTurnBox, type TurnBoxInstance } from "@kazuhi-ra/turnbox-dom";
import type { TurnBoxOptions } from "@kazuhi-ra/turnbox-core";
import { useTurnBoxConfig } from "./TurnBox/ConfigContext.js";

export type UseTurnBoxReturn = {
  containerRef: React.RefObject<HTMLElement | null>;
  currentFace: number;
  isAnimating: boolean;
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
};

export const useTurnBox = (options: TurnBoxOptions): UseTurnBoxReturn => {
  const config = useTurnBoxConfig();
  const { faces, axis, direction, type, duration, delay, easing, perspective, width, height, even } = options;

  const containerRef = useRef<HTMLElement>(null);
  const instanceRef = useRef<TurnBoxInstance | null>(null);
  const [currentFace, setCurrentFace] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Always call the latest callbacks without re-initializing the instance
  const onChangeRef = useRef(options.onChange);
  const onAnimationEndRef = useRef(options.onAnimationEnd);
  onChangeRef.current = options.onChange;
  onAnimationEndRef.current = options.onAnimationEnd;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = createTurnBox(el, {
      faces,
      axis,
      direction,
      type,
      duration,
      delay,
      easing,
      perspective,
      width,
      height,
      even,
      reduceAnimation: config.reduceAnimation,
      onChange: (face) => {
        setCurrentFace(face);
        setIsAnimating(true);
        onChangeRef.current?.(face);
      },
      onAnimationEnd: (face) => {
        setIsAnimating(false);
        onAnimationEndRef.current?.(face);
      },
    });
    instanceRef.current = instance;
    setCurrentFace(instance.getCurrentFace());

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, [faces, axis, direction, type, duration, delay, easing, perspective, width, height, even, config.reduceAnimation]);

  const goTo = useCallback((face: number, animation = true) => {
    instanceRef.current?.goTo(face, animation);
  }, []);

  const next = useCallback(() => {
    instanceRef.current?.next();
  }, []);

  const prev = useCallback(() => {
    instanceRef.current?.prev();
  }, []);

  return { containerRef, currentFace, isAnimating, goTo, next, prev };
};
