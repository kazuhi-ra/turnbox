import { runSuites } from "../../../tests/runner.js";
import { createReactAdapter } from "./adapters/react.js";
import { createReactComponentAdapter } from "./adapters/react-component.js";

const react = ["React", createReactAdapter] as const;
const reactComponent = ["React (Component)", createReactComponentAdapter] as const;

const adapters = [react, reactComponent] as const;

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
