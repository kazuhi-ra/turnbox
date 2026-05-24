# @kazuhi-ra/turnbox-dom

Vanilla JS adapter for TURNBOX.js.

## Installation

```bash
npm install @kazuhi-ra/turnbox-dom
```

## Usage

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
box.goTo(3);          // animated
box.goTo(2, false);   // no animation
```

## API

### createTurnBox(container, options)

| | Type | Description |
| --- | --- | --- |
| `container` | `HTMLElement` | The container element |
| `options` | `TurnBoxOptions` | See [shared options](../../README.md#options) |
| `options.reduceAnimation` | `"system setting" \| "never"` | Optional. Default: `"system setting"`. See [`reduceAnimation`](../../README.md#reduceanimation--accessibility-setting) |

Returns a `TurnBoxInstance`.

### TurnBoxInstance

| Method | Description |
| --- | --- |
| `next()` | Go to the next face |
| `prev()` | Go to the previous face |
| `goTo(face, animation?)` | Go to the specified face (`animation` defaults to `true`) |
| `getCurrentFace()` | Current face number (1-based) |
| `isAnimating()` | Whether an animation is in progress |
| `destroy()` | Remove all inline styles, classes, and timers |

## CSS Classes

### Container

| Class | Description |
| --- | --- |
| `turnBoxContainer` | Added on initialization |
| `turnBoxCurrentFace1` – `turnBoxCurrentFace4` | Reflects the current face |

### Face elements

| Class | Description |
| --- | --- |
| `turnBoxFace` | Added to all faces |
| `turnBoxFaceNum1` – `turnBoxFaceNum4` | Identifies each face by number |
| `turnBoxShow` | Added to the visible face |

```css
.turnBoxFaceNum1 { background: #ffffff; }
.turnBoxFaceNum2 { background: #f5f5f5; }

.turnBoxContainer.turnBoxCurrentFace2 .turnBoxFaceNum2 {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}
```

## License

MIT
