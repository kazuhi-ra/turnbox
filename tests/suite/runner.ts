import type { AdapterList } from "./adapter.js";
import { basicNavigationSuite } from "./basic-navigation.suite.js";
import { animationTypesSuite } from "./animation-types.suite.js";
import { noAnimationSuite } from "./no-animation.suite.js";
import { animationGuardSuite } from "./animation-guard.suite.js";
import { callbacksSuite } from "./callbacks.suite.js";
import { isAnimatingSuite } from "./is-animating.suite.js";
import { accessibilitySuite } from "./accessibility.suite.js";
import { edgeCasesSuite } from "./edge-cases.suite.js";
import { turnBoxAdjustSuite } from "./turnbox-adjust.suite.js";
import { focusManagementSuite } from "./focus-management.suite.js";
import { optionsSuite } from "./options.suite.js";
import { styleOptionsSuite } from "./style-options.suite.js";
import { prefersReducedMotionSuite } from "./prefers-reduced-motion.suite.js";
import { transformValuesSuite } from "./transform-values.suite.js";
import { variableGeometrySuite } from "./variable-geometry.suite.js";
import { wrapAroundCompatSuite } from "./wrap-around-compat.suite.js";
import { wrapAroundSuite } from "./wrap-around.suite.js";

export type AdapterSets = {
  all: AdapterList;
  modern: AdapterList;
  shared: AdapterList;
};

export const runSuites = (sets: AdapterSets) => {
  basicNavigationSuite(sets.all);
  animationTypesSuite(sets.all);
  noAnimationSuite(sets.all);
  edgeCasesSuite(sets.all);
  turnBoxAdjustSuite(sets.shared);
  optionsSuite(sets.all);
  styleOptionsSuite(sets.modern);
  animationGuardSuite(sets.modern);
  callbacksSuite(sets.modern);
  isAnimatingSuite(sets.modern);
  focusManagementSuite(sets.modern);
  prefersReducedMotionSuite(sets.modern);
  accessibilitySuite(sets.modern);
  transformValuesSuite(sets.shared);
  variableGeometrySuite(sets.modern);
  wrapAroundCompatSuite(sets.shared);
  wrapAroundSuite(sets.modern);
};
