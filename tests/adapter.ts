export type FaceState = {
  shown: boolean;
  transform: string;
  transformOrigin: string;
  inlineHeight: string;
  inlineWidth: string;
  inlineTransition: string;
};

export type ContainerState = {
  inlineHeight: string;
  inlineLeft: string;
  inlineTransition: string;
  perspective: string;
};

export type CreateAdapterOptions = {
  faces: number;
  type?: "real" | "repeat" | "skip";
  axis?: "X" | "Y";
  direction?: "positive" | "negative";
  duration?: number;
  delay?: number;
  easing?: string;
  perspective?: number;
  width?: number;
  height?: number;
  even?: number;
  reduceAnimation?: "system setting" | "never";
  onChange?: (face: number) => void;
  onAnimationEnd?: (face: number) => void;
  withFocusableChildren?: boolean;
};

export type TurnBoxTestAdapter = {
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
  getCurrentFace(): number;
  isAnimating(): boolean;
  isFaceShown(faceNum: number): boolean;
  getFaceState(faceNum: number): FaceState;
  getContainerState(): ContainerState;
  getAriaHidden(faceNum: number): string | null;
  getInert(faceNum: number): boolean;
  getFocusedFaceIndex(): number | null;
  waitForRender(): Promise<void>;
  advanceTime(ms: number): Promise<void>;
  destroy(): void;
};

export type AdapterFactory = (options: CreateAdapterOptions) => TurnBoxTestAdapter;

export type AdapterList = ReadonlyArray<readonly [string, AdapterFactory]>;
