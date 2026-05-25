import type { AdapterFactory } from "./adapter.js";
import { basicNavigationSuite } from "./basic-navigation.suite.js";
import { animationTypesSuite } from "./animation-types.suite.js";
import { noAnimationSuite } from "./no-animation.suite.js";
import { animationGuardSuite } from "./animation-guard.suite.js";
import { callbacksSuite } from "./callbacks.suite.js";
import { isAnimatingSuite } from "./is-animating.suite.js";
import { accessibilitySuite } from "./accessibility.suite.js";
import { edgeCasesSuite } from "./edge-cases.suite.js";
import { focusManagementSuite } from "./focus-management.suite.js";
import { optionsSuite } from "./options.suite.js";
import { prefersReducedMotionSuite } from "./prefers-reduced-motion.suite.js";
import { transformValuesSuite } from "./transform-values.suite.js";
import { wrapAroundSuite } from "./wrap-around.suite.js";

export type AdapterSets = {
  all: [string, AdapterFactory][];
  modern: [string, AdapterFactory][];
  shared: [string, AdapterFactory][];
};

export const runSuites = (sets: AdapterSets) => {
  basicNavigationSuite(sets.all);
  animationTypesSuite(sets.all);
  noAnimationSuite(sets.all);
  edgeCasesSuite(sets.all, sets.shared);
  optionsSuite(sets.all, sets.modern);
  animationGuardSuite(sets.modern);
  callbacksSuite(sets.modern);
  isAnimatingSuite(sets.modern);
  focusManagementSuite(sets.modern);
  prefersReducedMotionSuite(sets.modern);
  accessibilitySuite(sets.modern);
  transformValuesSuite(sets.shared, sets.modern);
  wrapAroundSuite(sets.shared, sets.modern);
};
