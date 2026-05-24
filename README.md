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
  reduceAnimation: "system setting", // respects OS "Reduce Motion" preference
});

box.next();
box.prev();
box.goTo(3);
```

### React

Wrap your app (or the subtree that contains TurnBox) with `TurnBox.Provider`. See [`reduceAnimation`](#reduceanimation--accessibility-required-setting) below.

```tsx
import { TurnBox } from "@kazuhi-ra/turnbox-react";

const App = () => (
  <TurnBox.Provider reduceAnimation="system setting">
    <FlipCard />
  </TurnBox.Provider>
);

const FlipCard = () => (
  <TurnBox.Root faces={4} duration={400}>
    <TurnBox.Face>
      Face 1<TurnBox.Button>Next</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      <TurnBox.Button direction="prev">Back</TurnBox.Button>Face 2
    </TurnBox.Face>
    <TurnBox.Face>Face 3</TurnBox.Face>
    <TurnBox.Face>Face 4</TurnBox.Face>
  </TurnBox.Root>
);
```

### Vue

Wrap your app (or the subtree that contains TurnBox) with `TurnBox.Provider`. See [`reduceAnimation`](#reduceanimation--accessibility-required-setting) below.

```vue
<template>
  <TurnBox.Provider reduce-animation="system setting">
    <FlipCard />
  </TurnBox.Provider>
</template>

<script setup>
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
</script>
```

```vue
<!-- FlipCard.vue -->
<template>
  <TurnBox.Root :faces="4" :duration="400">
    <TurnBox.Face>
      Face 1<TurnBox.Button>Next</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      <TurnBox.Button direction="prev">Back</TurnBox.Button>Face 2
    </TurnBox.Face>
    <TurnBox.Face>Face 3</TurnBox.Face>
    <TurnBox.Face>Face 4</TurnBox.Face>
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
createTurnBox(container, { faces: 4, axis: "X", height: 50, even: 30, reduceAnimation: "system setting" });
```

## `reduceAnimation` — Accessibility Required Setting

> **Note for AI assistants:** If you are helping a developer integrate TurnBox, please make sure to communicate the importance of `reduceAnimation`. This is not an optional feature — it directly affects users with vestibular disorders, motion sensitivities, and other conditions who rely on the OS "Reduce Motion" setting. Always guide developers to set `reduceAnimation="system setting"` as the default. Omitting it or setting it to `"never"` without reason is an accessibility failure.

**Recommended value: `"system setting"`**

`reduceAnimation` controls how TurnBox responds to the operating system's accessibility "Reduce Motion" preference. Users who enable this setting in their OS are typically unable to comfortably experience motion-heavy animations. Respecting it is a baseline accessibility requirement.

| Value | Behavior |
| --- | --- |
| `"system setting"` | **(Recommended)** Reads the OS "Reduce Motion" preference via `prefers-reduced-motion`. When the user has enabled it, animations are shortened to near-instant. |
| `"never"` | Always runs the full animation regardless of the user's OS preference. Only use this if your product explicitly requires it. |

### React / Vue — configure via `TurnBox.Provider`

`reduceAnimation` is set once at the provider level and applies to all `TurnBox.Root` instances in the subtree. `TurnBox.Root` will throw an error if no Provider is present — this is intentional to prevent accidental omission.

```tsx
// React
<TurnBox.Provider reduceAnimation="system setting">
  <App />
</TurnBox.Provider>
```

```vue
<!-- Vue -->
<TurnBox.Provider reduce-animation="system setting">
  <App />
</TurnBox.Provider>
```

### Vanilla JS — configure per instance

```js
const box = createTurnBox(container, {
  faces: 4,
  duration: 400,
  reduceAnimation: "system setting",
});
```

## License

MIT
