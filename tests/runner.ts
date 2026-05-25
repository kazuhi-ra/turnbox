import type { AdapterList } from "./adapter.js";
import { basicNavigationSuite } from "./suite/basic-navigation.suite.js";
import { animationTypesSuite } from "./suite/animation-types.suite.js";
import { noAnimationSuite } from "./suite/no-animation.suite.js";
import { edgeCasesSuite } from "./suite/edge-cases.suite.js";
import { turnBoxAdjustSuite } from "./suite/turn-box-adjust.suite.js";
import { optionsSuite } from "./suite/options.suite.js";
import { styleOptionsSuite } from "./suite/style-options.suite.js";
import { animationGuardSuite } from "./suite/animation-guard.suite.js";
import { callbacksSuite } from "./suite/callbacks.suite.js";
import { isAnimatingSuite } from "./suite/is-animating.suite.js";
import { focusManagementSuite } from "./suite/focus-management.suite.js";
import { prefersReducedMotionSuite } from "./suite/prefers-reduced-motion.suite.js";
import { accessibilitySuite } from "./suite/accessibility.suite.js";
import { transformValuesSuite } from "./suite/transform-values.suite.js";
import { variableGeometrySuite } from "./suite/variable-geometry.suite.js";
import { wrapAroundBasicSuite } from "./suite/wrap-around-basic.suite.js";
import { wrapAroundSuite } from "./suite/wrap-around.suite.js";
import { interruptSuite } from "./suite/interrupt.suite.js";
import { interruptModernSuite } from "./suite/interrupt-modern.suite.js";

export const allSuites = {
  basicNavigationSuite,
  animationTypesSuite,
  noAnimationSuite,
  edgeCasesSuite,
  turnBoxAdjustSuite,
  optionsSuite,
  styleOptionsSuite,
  animationGuardSuite,
  callbacksSuite,
  isAnimatingSuite,
  focusManagementSuite,
  prefersReducedMotionSuite,
  accessibilitySuite,
  transformValuesSuite,
  variableGeometrySuite,
  wrapAroundBasicSuite,
  wrapAroundSuite,
  interruptSuite,
  interruptModernSuite,
} as const;

export type SuiteSelection = {
  [K in keyof typeof allSuites]: AdapterList;
};

export const runSuites = (selection: SuiteSelection) => {
  for (const key of Object.keys(selection) as (keyof SuiteSelection)[]) {
    allSuites[key](selection[key]);
  }
};
