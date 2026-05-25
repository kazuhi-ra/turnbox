import { runSuites } from "../../../tests/runner.js";
import { createJQueryAdapter } from "./adapters/jquery.js";
import { createDomAdapter } from "./adapters/dom.js";

const jQuery = ["jQuery", createJQueryAdapter] as const;
const dom = ["DOM", createDomAdapter] as const;

const all = [jQuery, dom] as const;
const modern = [dom] as const;

runSuites({
  basicNavigationSuite: all,
  animationTypesSuite: all,
  noAnimationSuite: all,
  edgeCasesSuite: all,
  turnBoxAdjustSuite: all,
  optionsSuite: all,
  styleOptionsSuite: modern,
  animationGuardSuite: modern,
  callbacksSuite: modern,
  isAnimatingSuite: modern,
  focusManagementSuite: modern,
  prefersReducedMotionSuite: modern,
  accessibilitySuite: modern,
  transformValuesSuite: all,
  variableGeometrySuite: modern,
  wrapAroundBasicSuite: all,
  wrapAroundSuite: modern,
  interruptSuite: all,
  interruptModernSuite: modern,
});
