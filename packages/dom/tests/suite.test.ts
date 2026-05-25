import { runSuites } from "../../../tests/suite/runner.js";
import { createJQueryAdapter } from "./adapters/jquery.js";
import { createDomAdapter } from "./adapters/dom.js";

const jQuery = ["jQuery", createJQueryAdapter] as const;
const dom = ["DOM", createDomAdapter] as const;

runSuites({
  all: [jQuery, dom],
  modern: [dom],
  shared: [jQuery, dom],
});
