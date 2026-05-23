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

## License

MIT
