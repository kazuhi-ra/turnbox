import { createJQueryAdapter } from "./jquery.js";
import { createDomAdapter } from "./dom.js";
import { createReactAdapter } from "./react.js";
import { createVueAdapter } from "./vue.js";
import type { AdapterFactory } from "../suite/adapter.js";

// 全アダプター: shared テストで使用
export const adapters: [string, AdapterFactory][] = [
  ["jQuery", createJQueryAdapter],
  ["DOM", createDomAdapter],
];

// 正しい実装アダプター（jQuery/turnBox.js の制約を持たない）
export const implAdapters: [string, AdapterFactory][] = [
  ["DOM", createDomAdapter],
  ["React", createReactAdapter],
  ["Vue", createVueAdapter],
];
