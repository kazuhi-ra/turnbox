# @kazuhi-ra/turnbox-vue

Vue package for TURNBOX.js.  
Provides two APIs: a declarative **compound component** (`TurnBox.Root / Face / Button`) and a headless **`useTurnBox` composable**.

## Installation

```bash
npm install @kazuhi-ra/turnbox-vue
```

Requires Vue 3 or later.

---

## Compound Component

Place `TurnBox.Button` inside faces to wire up navigation declaratively.

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

### External control via ref

Use a ref to control navigation programmatically.

```vue
<template>
  <TurnBox.Root :faces="4" :duration="400" :ref="handle">
    <TurnBox.Face>Face 1</TurnBox.Face>
    <TurnBox.Face>Face 2</TurnBox.Face>
    <TurnBox.Face>Face 3</TurnBox.Face>
    <TurnBox.Face>Face 4</TurnBox.Face>
  </TurnBox.Root>
  <button @click="handle?.next()">Next</button>
  <button @click="handle?.prev()">Back</button>
</template>

<script setup>
import { ref } from "vue";
import { TurnBox, type TurnBoxRootHandle } from "@kazuhi-ra/turnbox-vue";

const handle = ref<TurnBoxRootHandle | null>(null);
</script>
```

### TurnBoxRootHandle

| Method | Description |
| --- | --- |
| `next()` | Go to the next face |
| `prev()` | Go to the previous face |
| `goTo(face, animation?)` | Go to the specified face. Pass `false` to skip animation (default: `true`) |
| `getCurrentFace()` | Returns the current face number (1-based) |

### TurnBox.Button props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"next" \| "prev"` | `"next"` | Go to the next or previous face |
| `to` | `number` | | Jump directly to the specified face number (takes priority over direction) |

`TurnBox.Button` renders a native `<button>` element. Standard attrs like `class` and `style` are forwarded.

---

## useTurnBox composable

Binds a DOM element via ref and controls animation imperatively.  
Use this when you want full control over styling or prefer not to use the compound component.

```vue
<script setup>
import { useTurnBox } from "@kazuhi-ra/turnbox-vue";

const { containerRef, currentFace, isAnimating, next, prev, goTo } = useTurnBox({
  faces: 2,
  duration: 400,
});
</script>

<template>
  <div ref="containerRef">
    <div>Front</div>
    <div>Back</div>
  </div>
</template>
```

### UseTurnBoxReturn

| Field | Type | Description |
| --- | --- | --- |
| `containerRef` | `Ref<HTMLElement \| null>` | Attach to the container element |
| `currentFace` | `Ref<number>` | Current face number (1-based) |
| `isAnimating` | `Ref<boolean>` | Whether an animation is in progress |
| `next()` | `() => void` | Go to the next face |
| `prev()` | `() => void` | Go to the previous face |
| `goTo(face, animation?)` | `(face: number, animation?: boolean) => void` | Go to the specified face |

---

## Options

`TurnBox.Root` and `useTurnBox` share the same `TurnBoxOptions`.  
See [shared options](../../README.md#options) for the full reference.

---

## License

MIT
