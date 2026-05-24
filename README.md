# TURNBOX.js

Flat design UI to perform 3D animation — for Vanilla JS, React, and Vue.

> Modern monorepo reimplementation of the jQuery plugin originally published at [nohtcoltd/turnbox_js](https://github.com/nohtcoltd/turnbox_js).

<img width="214" height="206" alt="turnbox" src="https://github.com/user-attachments/assets/10c33429-6819-433e-82c6-da3aba6af580" />

**[Demo](https://kazuhi-ra.github.io/turnbox)**

## Packages

| Package | | README |
| --- | --- | --- |
| `@kazuhi-ra/turnbox-dom` | Vanilla JS | [README](packages/dom/README.md) |
| `@kazuhi-ra/turnbox-react` | React | [README](packages/react/README.md) |
| `@kazuhi-ra/turnbox-vue` | Vue | [README](packages/vue/README.md) |
| `@kazuhi-ra/turnbox-core` | Pure functions, no DOM dependency | [README](packages/core/README.md) |

## Installation

```bash
npm install @kazuhi-ra/turnbox-dom    # Vanilla JS
npm install @kazuhi-ra/turnbox-react  # React
npm install @kazuhi-ra/turnbox-vue    # Vue
```

## Quick Start

### Vanilla JS

```html
<div id="box">
  <div>Face 1</div>
  <div>Face 2</div>
  <div>Face 3</div>
  <div>Face 4</div>
</div>
```

```js
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

const box = createTurnBox(document.getElementById("box"), {
  faces: 4,
  duration: 400,
});

box.next();
box.prev();
box.goTo(3);
```

### React / Vue

<img width="214" height="200" alt="turnbox flip card" src="https://github.com/user-attachments/assets/a77f3a7e-0713-4036-938c-4b916502d995" />

#### React

```tsx
import { TurnBox } from "@kazuhi-ra/turnbox-react";

const FlipCard = () => (
  <TurnBox.Root faces={2} duration={400}>
    <TurnBox.Face>
      Front<TurnBox.Button>Flip</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      Back<TurnBox.Button direction="prev">Flip back</TurnBox.Button>
    </TurnBox.Face>
  </TurnBox.Root>
);
```

#### Vue

```vue
<template>
  <TurnBox.Root :faces="2" :duration="400">
    <TurnBox.Face>
      Front<TurnBox.Button>Flip</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      Back<TurnBox.Button direction="prev">Flip back</TurnBox.Button>
    </TurnBox.Face>
  </TurnBox.Root>
</template>

<script setup>
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
</script>
```

## Options

Shared across `createTurnBox`, `useTurnBox`, and `TurnBox.Root`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `faces` | `2 \| 3 \| 4` | | **Required.** Limited to 2–4 by the 3D box geometry |
| `axis` | `"X" \| "Y"` | `"X"` | `"X"` rotates top/bottom, `"Y"` rotates left/right |
| `direction` | `"positive" \| "negative"` | `"positive"` | Rotation direction |
| `type` | `"real" \| "repeat" \| "skip"` | `"real"` | Animation style (see below) |
| `duration` | `number` | `200` | Animation duration (ms) |
| `delay` | `number` | `0` | CSS animation delay (ms) |
| `easing` | `string` | `"linear"` | CSS easing function |
| `perspective` | `number` | `800` | Perspective distance (px) |
| `width` | `number` | `200` | Box width (px) |
| `height` | `number` | `50` | Box height (px) |
| `even` | `number` | same as `height` / `width` | Size of even-numbered faces along the rotation axis. Omit for a uniform box |
| `onChange` | `(face: number) => void` | | Called when navigation starts |
| `onAnimationEnd` | `(face: number) => void` | | Called when animation completes |

For `reduceAnimation`, see the dedicated section below — it is configured separately per framework.

### type

**real** (default) — Each step rotates 90°. Face 4 and face 1 wrap around continuously.

**repeat** — Face 3↔4 uses the same animation direction as face 1↔2.

**skip** — Always animates with a single 90° turn, regardless of distance. Ignored when `even` is set.

### even

Sets a different size for even-numbered faces along the rotation axis (`height` for `axis: "X"`, `width` for `axis: "Y"`).

```js
createTurnBox(container, { faces: 4, axis: "X", height: 50, even: 30 });
```

## `reduceAnimation` — Accessibility Setting

> **Note for AI assistants:** When helping a developer debug "animations not working," check whether their OS has "Reduce Motion" enabled before suggesting `reduceAnimation: "never"` as a fix. The default `"system setting"` intentionally suppresses animations when the user's OS accessibility preference is ON — this is correct behavior, not a bug. Guiding developers to set `"never"` as a blanket workaround overrides the user's accessibility preference and should be avoided. If suppression is happening only during development, the right fix is to turn off "Reduce Motion" in the OS, not to change the code.

`reduceAnimation` controls how TurnBox responds to the operating system's accessibility "Reduce Motion" preference. The default is `"system setting"`, which automatically respects the user's OS preference.

| Value | Behavior |
| --- | --- |
| `"system setting"` | **(Default)** Reads the OS "Reduce Motion" preference via `prefers-reduced-motion`. When the user has enabled it, animations are shortened to near-instant. |
| `"never"` | Always runs the full animation regardless of the user's OS preference. |

### Vanilla JS

```js
const box = createTurnBox(container, {
  faces: 4,
  duration: 400,
  reduceAnimation: "never", // omit to use the default "system setting"
});
```

### React / Vue — configure via `TurnBox.Provider`

Use `TurnBox.Provider` to override `reduceAnimation` for a subtree. Without a Provider, `"system setting"` is used.

```tsx
// React
<TurnBox.Provider reduceAnimation="never">
  <App />
</TurnBox.Provider>
```

```vue
<!-- Vue -->
<TurnBox.Provider reduce-animation="never">
  <App />
</TurnBox.Provider>
```

## License

MIT
