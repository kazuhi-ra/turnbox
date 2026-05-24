# @kazuhi-ra/turnbox-react

React adapter for TURNBOX.js. Compound component and `useTurnBox` hook.

Requires React 18 or later.

## Installation

```bash
npm install @kazuhi-ra/turnbox-react
```

## Compound Component

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
| `goTo(face, animation?)` | Go to the specified face (`animation` defaults to `true`) |
| `getCurrentFace()` | Current face number (1-based) |

### TurnBox.Button props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"next" \| "prev"` | `"next"` | Go to the next or previous face |
| `to` | `number` | | Jump to a specific face (takes priority over `direction`) |

Forwards standard props (`className`, `style`, etc.) to the native `<button>`.

## useTurnBox hook

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

## TurnBox.Provider

Use `TurnBox.Provider` to override [`reduceAnimation`](../../README.md#reduceanimation--accessibility-setting) for a subtree. Without a Provider the default is `"system setting"`.

```tsx
<TurnBox.Provider reduceAnimation="never">
  <App />
</TurnBox.Provider>
```

## Options

See [shared options](../../README.md#options).

## License

MIT
