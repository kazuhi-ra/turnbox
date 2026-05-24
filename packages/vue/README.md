# @kazuhi-ra/turnbox-vue

Vue adapter for TURNBOX.js. Compound component and `useTurnBox` composable.

Requires Vue 3 or later.

## Installation

```bash
npm install @kazuhi-ra/turnbox-vue
```

## Compound Component

Wrap your app (or the section that uses TurnBox) with `TurnBox.Provider`. This is required — `TurnBox.Root` will throw if no Provider is present.

```vue
<!-- App.vue -->
<template>
  <TurnBox.Provider reduceAnimation="system setting">
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

### External control via ref

```vue
<!-- App.vue -->
<template>
  <TurnBox.Provider reduceAnimation="system setting">
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
| `goTo(face, animation?)` | Go to the specified face (`animation` defaults to `true`) |
| `getCurrentFace()` | Current face number (1-based) |

### TurnBox.Button props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"next" \| "prev"` | `"next"` | Go to the next or previous face |
| `to` | `number` | | Jump to a specific face (takes priority over `direction`) |

Forwards standard attrs (`class`, `style`, etc.) to the native `<button>`.

## useTurnBox composable

`useTurnBox` also requires a `TurnBox.Provider` ancestor.

```vue
<!-- App.vue -->
<template>
  <TurnBox.Provider reduceAnimation="system setting">
    <FlipCard />
  </TurnBox.Provider>
</template>

<script setup>
import { TurnBox } from "@kazuhi-ra/turnbox-vue";
</script>
```

```vue
<!-- FlipCard.vue -->
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

## Options

See [shared options](../../README.md#options).

## License

MIT
