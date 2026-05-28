# @kazuhi-ra/turnbox-core

Pure geometry and navigation functions for TURNBOX.js. No DOM dependency.

For most use cases, prefer `@kazuhi-ra/turnbox-dom`, `@kazuhi-ra/turnbox-react`, or `@kazuhi-ra/turnbox-vue`.

## Installation

```bash
npm install @kazuhi-ra/turnbox-core
```

## API

### normalizeOptions(options)

Fills in defaults and returns a `NormalizedOptions` object.

```ts
import { normalizeOptions } from "@kazuhi-ra/turnbox-core";

const opts = normalizeOptions({ faces: 4, duration: 400 });
```

### calcFaceTransform(currentFace, faceNum, opts)

Returns the CSS transform values for `faceNum` relative to `currentFace`.

```ts
import { normalizeOptions, calcFaceTransform } from "@kazuhi-ra/turnbox-core";

const opts = normalizeOptions({ faces: 4 });
const t = calcFaceTransform(1, 2, opts);
// { axis: "X", deg: 90, x: 0, y: -25, z: 25, zIndex: 10, transformOrigin: "50% 50%" }

const css = `rotate${t.axis}(${t.deg}deg) translate3d(${t.x}px, ${t.y}px, ${t.z}px)`;
```

### DEFAULT_SIZE / DEFAULT_HEIGHT

```ts
import { DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
// DEFAULT_SIZE = 200
// DEFAULT_HEIGHT = 50
```

## Internal API

`@kazuhi-ra/turnbox-core/internal` is used across the `@kazuhi-ra/turnbox-*` packages and may have breaking changes in minor releases. Direct use from outside the monorepo is not recommended.

### State machine

Shared reducer for `@kazuhi-ra/turnbox-dom`, `-react`, and `-vue`.

```ts
import {
  INITIAL_STATE,
  reducer,
  toPhase,
  buildGoStepAction,
  buildGoInstantAction,
  type TurnBoxState,
  type TurnBoxAction,
  type AnimationPhase,
  type PendingNav,
} from "@kazuhi-ra/turnbox-core/internal";
```

| Export | Kind | Description |
| --- | --- | --- |
| `TurnBoxState` | type | Union of `IdleState \| SettlingState \| AnimatingState` |
| `TurnBoxAction` | type | Union of all dispatchable action types |
| `AnimationPhase` | type | `{ kind: "idle" } \| { kind: "animating" }` — coarser view of state for `isAnimating` |
| `PendingNav` | type | `{ face: number; animation: boolean }` — item stored in the queue |
| `INITIAL_STATE` | const | Initial `TurnBoxState` (face 1, idle) |
| `reducer` | function | `(state, action) => TurnBoxState` |
| `toPhase` | function | `(state) => AnimationPhase` — collapses `settling` into `idle` |
| `buildGoStepAction` | function | `(to, from) => TurnBoxAction` — animated step |
| `buildGoInstantAction` | function | `(displayFace, from) => TurnBoxAction` — no-animation jump |

### Navigation orchestration

Decision layer that sits above the state machine, shared by all adapters.

```ts
import {
  resolveNavigation,
  buildDrainResult,
  type NavigationDecision,
  type DrainResult,
} from "@kazuhi-ra/turnbox-core/internal";
```

| Export | Kind | Description |
| --- | --- | --- |
| `NavigationDecision` | type | `"noop" \| "enqueue" \| "abort" \| "go"` — what the caller should do |
| `DrainResult` | type | `"empty" \| { navigate, enqueue }` — result of draining the queue after settle |
| `resolveNavigation` | function | `(state, rawTarget, opts, animation) => NavigationDecision` |
| `buildDrainResult` | function | `(settledFace, queue, opts) => DrainResult` |

### Other internal exports

| Export | Description |
| --- | --- |
| `shouldAnimate` | Whether a transition should run with animation |
| `resolveTransition` | Resolves `rawTarget` to a canonical face + `doAnimate` flag |
| `getFaceParity` | Returns `"odd" \| "even"` for a face number |
| `MAX_FACE_PCS` | Maximum supported face count (`4`) |
| `FOCUSABLE` | CSS selector string for focusable elements inside a face |
| `Transition`, `RotationDeg`, `FaceVisibility`, `FaceParity` | Shared geometry/navigation types |

## License

MIT
