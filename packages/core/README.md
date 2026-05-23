# @kazuhi-ra/turnbox-core

Core logic package for TURNBOX.js.  
Contains only pure functions with no DOM dependency — use this when building a custom renderer.

For most use cases, prefer `@kazuhi-ra/turnbox-dom`, `@kazuhi-ra/turnbox-react`, or `@kazuhi-ra/turnbox-vue`.

---

## Installation

```bash
npm install @kazuhi-ra/turnbox-core
```

---

## Public API

### normalizeOptions(options)

Accepts a `TurnBoxOptions` object and returns a `NormalizedOptions` with all defaults filled in.

```ts
import { normalizeOptions } from "@kazuhi-ra/turnbox-core";

const opts = normalizeOptions({ faces: 4, duration: 400 });
```

### calcFaceTransform(currentFace, faceNum, opts)

Calculates the CSS transform values for a given face (`faceNum`) relative to the currently visible face (`currentFace`).

```ts
import { normalizeOptions, calcFaceTransform } from "@kazuhi-ra/turnbox-core";

const opts = normalizeOptions({ faces: 4 });
const transform = calcFaceTransform(1, 2, opts);
// { axis: "X", deg: 90, x: 0, y: -25, z: 25, zIndex: 10, transformOrigin: "50% 50%" }
```

To convert the returned `FaceTransform` into a CSS string:

```ts
const cssTransform = `rotate${transform.axis}(${transform.deg}deg) translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px)`;
```

### DEFAULT_SIZE / DEFAULT_HEIGHT

Default box size constants.

```ts
import { DEFAULT_SIZE, DEFAULT_HEIGHT } from "@kazuhi-ra/turnbox-core";
// DEFAULT_SIZE = 200  (default width)
// DEFAULT_HEIGHT = 50 (default height)
```

---

## Internal API

`@kazuhi-ra/turnbox-core/internal` is a shared internal API used across `@kazuhi-ra/turnbox-*` packages.  
It may have breaking changes in minor releases — direct use from outside the monorepo is not recommended.

---

## License

MIT
