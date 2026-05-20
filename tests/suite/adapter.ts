export type FaceState = {
  shown: boolean;
  transform: string;
  transformOrigin: string;
  inlineHeight: string;
  inlineWidth: string;
};

export type ContainerState = {
  inlineHeight: string;
  inlineLeft: string;
  inlineTransition: string;
};

export type CreateAdapterOptions = {
  facePcs: number;
  type?: "real" | "repeat" | "skip";
  axis?: "X" | "Y";
  direction?: "positive" | "negative";
  duration?: number;
  delay?: number;
  width?: number;
  height?: number;
  even?: number;
};

export type TurnBoxTestAdapter = {
  goTo(face: number, animation?: boolean): void;
  next(): void;
  prev(): void;
  getCurrentFace(): number;
  isFaceShown(faceNum: number): boolean;
  getFaceState(faceNum: number): FaceState;
  getContainerState(): ContainerState;
  advanceTime(ms: number): Promise<void>;
  destroy(): void;
};

export type AdapterFactory = (options: CreateAdapterOptions) => TurnBoxTestAdapter;
