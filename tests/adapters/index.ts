import { createJQueryAdapter } from "./jquery.js";
import { createDomAdapter } from "./dom.js";
import { createReactAdapter } from "./react.js";
import { createVueAdapter } from "./vue.js";
import { createReactComponentAdapter } from "./react-component.js";
import { createVueComponentAdapter } from "./vue-component.js";
import type { AdapterFactory } from "../suite/adapter.js";

// jQuery + DOM: verifies behavioral parity between the legacy and modern implementations
export const sharedAdapters: [string, AdapterFactory][] = [
  ["jQuery", createJQueryAdapter],
  ["DOM", createDomAdapter],
];

// DOM + React + Vue: verifies modern-implementation-specific behavior not constrained by jQuery
export const modernAdapters: [string, AdapterFactory][] = [
  ["DOM", createDomAdapter],
  ["React", createReactAdapter],
  ["Vue", createVueAdapter],
  ["React (Component)", createReactComponentAdapter],
  ["Vue (Component)", createVueComponentAdapter],
];

// DOM + React hook + Vue hook: only adapters that expose isAnimating
export const animatingAdapters: [string, AdapterFactory][] = [
  ["DOM", createDomAdapter],
  ["React", createReactAdapter],
  ["Vue", createVueAdapter],
];
