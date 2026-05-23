import { createJQueryAdapter } from "./jquery.js";
import { createDomAdapter } from "./dom.js";
import { createReactAdapter } from "./react.js";
import { createVueAdapter } from "./vue.js";
import { createReactComponentAdapter } from "./react-component.js";
import { createVueComponentAdapter } from "./vue-component.js";
import type { AdapterFactory } from "../suite/adapter.js";

// jQuery + DOM: 旧実装と新実装の振る舞いが一致することを検証するテスト用
export const sharedAdapters: [string, AdapterFactory][] = [
  ["jQuery", createJQueryAdapter],
  ["DOM", createDomAdapter],
];

// DOM + React + Vue: jQuery の制約を持たない新実装固有の振る舞いを検証するテスト用
export const modernAdapters: [string, AdapterFactory][] = [
  ["DOM", createDomAdapter],
  ["React", createReactAdapter],
  ["Vue", createVueAdapter],
  ["React (Component)", createReactComponentAdapter],
  ["Vue (Component)", createVueComponentAdapter],
];

// DOM + React hook + Vue hook: isAnimating を公開するアダプターのみ
export const animatingAdapters: [string, AdapterFactory][] = [
  ["DOM", createDomAdapter],
  ["React", createReactAdapter],
  ["Vue", createVueAdapter],
];
