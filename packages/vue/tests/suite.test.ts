import { runSuites } from "../../../tests/runner.js";
import { createVueAdapter } from "./adapters/vue.js";
import { createVueComponentAdapter } from "./adapters/vue-component.js";

const vue = ["Vue", createVueAdapter] as const;
const vueComponent = ["Vue (Component)", createVueComponentAdapter] as const;

const adapters = [vue, vueComponent] as const;

runSuites({
  basicNavigationSuite: adapters,
  animationTypesSuite: adapters,
  noAnimationSuite: adapters,
  edgeCasesSuite: adapters,
  turnBoxAdjustSuite: [],
  optionsSuite: adapters,
  styleOptionsSuite: adapters,
  animationGuardSuite: adapters,
  callbacksSuite: adapters,
  isAnimatingSuite: adapters,
  focusManagementSuite: adapters,
  prefersReducedMotionSuite: adapters,
  accessibilitySuite: adapters,
  transformValuesSuite: adapters,
  variableGeometrySuite: adapters,
  wrapAroundBasicSuite: adapters,
  wrapAroundSuite: adapters,
  interruptSuite: adapters,
  interruptModernSuite: adapters,
});
