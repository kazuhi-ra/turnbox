import { runSuites } from "../../../tests/suite/runner.js";
import { createReactAdapter } from "./adapters/react.js";
import { createReactComponentAdapter } from "./adapters/react-component.js";

const react = ["React", createReactAdapter] as const;
const reactComponent = ["React (Component)", createReactComponentAdapter] as const;

runSuites({
  all:    [react, reactComponent],
  modern: [react, reactComponent],
  shared: [],
});
