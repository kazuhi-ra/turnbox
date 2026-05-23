# TURNBOX.js

> This repository is a modern monorepo reimplementation of the jQuery plugin originally published at [nohtcoltd/turnbox_js](https://github.com/nohtcoltd/turnbox_js).

A CSS3 3D transform library for box-flip animations.  
Perfect for toggles, tabs, card flips, and any UI that "turns" between faces.

## Packages

| Package | Description | README |
| --- | --- | --- |
| `@kazuhi-ra/turnbox-dom` | Vanilla JS. Provides `createTurnBox()` | [Details](packages/dom/README.md) |
| `@kazuhi-ra/turnbox-react` | React hook and compound component | [Details](packages/react/README.md) |
| `@kazuhi-ra/turnbox-vue` | Vue composable and compound component | [Details](packages/vue/README.md) |
| `@kazuhi-ra/turnbox-core` | Pure functions (no DOM dependency). For custom renderers | [Details](packages/core/README.md) |

---

## Installation

```bash
# Vanilla JS
npm install @kazuhi-ra/turnbox-dom

# React
npm install @kazuhi-ra/turnbox-react

# Vue
npm install @kazuhi-ra/turnbox-vue
```

---

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

box.next();    // go to next face
box.prev();    // go to previous face
box.goTo(3);   // jump to face 3
```

### React

```tsx
import { TurnBox } from "@kazuhi-ra/turnbox-react";

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

```vue
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

---

## Options

These options are shared across all adapters (createTurnBox, useTurnBox, TurnBox.Root).

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `faces` | `2 \| 3 \| 4` | | Number of faces. **Required** |
| `axis` | `"X" \| "Y"` | `"X"` | Rotation axis. "X" rotates vertically, "Y" horizontally |
| `direction` | `"positive" \| "negative"` | `"positive"` | Rotation direction. "negative" reverses it |
| `type` | `"real" \| "repeat" \| "skip"` | `"real"` | Animation style (see below) |
| `duration` | `number` | `200` | Animation duration (ms) |
| `delay` | `number` | `0` | Delay before animation starts (ms) |
| `easing` | `string` | `"linear"` | CSS easing function |
| `perspective` | `number` | `800` | Perspective distance (px) |
| `width` | `number` | `200` | Box width (px) |
| `height` | `number` | `50` | Box height (px) |
| `even` | `number` | same as height or width | Size of even-numbered faces along the rotation axis (px). Omit for uniform faces |
| `onChange` | `(face: number) => void` | | Called when a transition starts. Argument is the destination face number |
| `onAnimationEnd` | `(face: number) => void` | | Called when the animation completes. Argument is the destination face number |

### type

**real** (default)  
Rotates like a physical box, 90° per step. With 4 faces, transitions between face 4 and face 1 wrap around.

**repeat**  
The face 1↔2 animation motion is repeated for face 3↔4.

**skip**  
Always animates with a single 90° turn regardless of how far apart the faces are. Forced to "real" when `even` is specified.

### even (asymmetric box)

Allows odd-numbered and even-numbered faces to have different sizes.  
With `axis: "X"`, the height of even faces differs; with `axis: "Y"`, the width differs.

```js
createTurnBox(container, {
  faces: 4,
  axis: "X",
  height: 50,
  even: 30,
});
```

---

## License

MIT
