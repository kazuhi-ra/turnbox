import { runSuites } from "../../../tests/suite/runner.js";
import { createVueAdapter } from "./adapters/vue.js";
import { createVueComponentAdapter } from "./adapters/vue-component.js";

const vue = ["Vue", createVueAdapter] as const;
const vueComponent = ["Vue (Component)", createVueComponentAdapter] as const;

runSuites({
  all:    [vue, vueComponent],
  modern: [vue, vueComponent],
  shared: [],
});
