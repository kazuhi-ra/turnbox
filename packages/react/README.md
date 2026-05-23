# @kazuhi-ra/turnbox-react

React package for TURNBOX.js.  
Provides two APIs: a declarative **compound component** (`TurnBox.Root / Face / Button`) and a headless **`useTurnBox` hook**.

## Installation

```bash
npm install @kazuhi-ra/turnbox-react
```

Requires React 18 or later.

---

## Compound Component

Place `TurnBox.Button` inside faces to wire up navigation declaratively.

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

### External control via ref

Use a ref to control navigation programmatically.

```tsx
import { useRef } from "react";
import { TurnBox, type TurnBoxRootHandle } from "@kazuhi-ra/turnbox-react";

const FlipCard = () => {
  const ref = useRef<TurnBoxRootHandle>(null);

  return (
    <>
      <TurnBox.Root faces={4} duration={400} ref={ref}>
        <TurnBox.Face>Face 1</TurnBox.Face>
        <TurnBox.Face>Face 2</TurnBox.Face>
        <TurnBox.Face>Face 3</TurnBox.Face>
        <TurnBox.Face>Face 4</TurnBox.Face>
      </TurnBox.Root>
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => ref.current?.prev()}>Back</button>
    </>
  );
};
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

`TurnBox.Button` renders a native `<button>` element. Standard props like `className` and `style` are forwarded.

---

## useTurnBox hook

Binds a DOM element via ref and controls animation imperatively.  
Use this when you want full control over styling or prefer not to use the compound component.

```tsx
import { useTurnBox } from "@kazuhi-ra/turnbox-react";

const FlipCard = () => {
  const { containerRef, currentFace, isAnimating, next, prev, goTo } = useTurnBox({
    faces: 2,
    duration: 400,
  });

  return (
    <div ref={containerRef}>
      <div>Front</div>
      <div>Back</div>
    </div>
  );
};
```

### UseTurnBoxReturn

| Field | Type | Description |
| --- | --- | --- |
| `containerRef` | `RefObject<HTMLElement>` | Attach to the container element |
| `currentFace` | `number` | Current face number (1-based) |
| `isAnimating` | `boolean` | Whether an animation is in progress |
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
