# @kazuhi-ra/turnbox-dom

Vanilla JS package for TURNBOX.js.  
A single `createTurnBox()` function adds CSS3 3D box-flip animation to any container element.

## Installation

```bash
npm install @kazuhi-ra/turnbox-dom
```

---

## Basic Usage

### HTML

Place face elements as direct children of the container.

```html
<div id="box">
  <div>Face 1</div>
  <div>Face 2</div>
  <div>Face 3</div>
  <div>Face 4</div>
</div>
```

### JavaScript

```js
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

const box = createTurnBox(document.getElementById("box"), {
  faces: 4,
  duration: 400,
});

box.next();           // go to next face
box.prev();           // go to previous face
box.goTo(3);          // go to face 3 (animated)
box.goTo(2, false);   // go to face 2 (no animation)
```

---

## API

### createTurnBox(container, options)

| Argument | Type | Description |
| --- | --- | --- |
| `container` | `HTMLElement` | The container element |
| `options` | `TurnBoxOptions` | Options (see [shared options](../../README.md#options)) |

Returns a `TurnBoxInstance`.

### TurnBoxInstance

| Method | Description |
| --- | --- |
| `next()` | Go to the next face |
| `prev()` | Go to the previous face |
| `goTo(face, animation?)` | Go to the specified face. Pass `false` as the second argument to skip animation (default: `true`) |
| `getCurrentFace()` | Returns the current face number (1-based) |
| `isAnimating()` | Returns whether an animation is in progress |
| `destroy()` | Remove all inline styles, classes, and timers |

---

## CSS Classes

In addition to inline styles, `@kazuhi-ra/turnbox-dom` applies the following CSS classes.  
Use them for styling or state-driven logic.

### Container classes

| Class | Description |
| --- | --- |
| `turnBoxContainer` | Added on initialization |
| `turnBoxCurrentFace1` – `turnBoxCurrentFace4` | Reflects the currently visible face number |

### Face element classes

| Class | Description |
| --- | --- |
| `turnBoxFace` | Added to all faces |
| `turnBoxFaceNum1` – `turnBoxFaceNum4` | Identifies each face by number |
| `turnBoxShow` | Added to the currently visible face |

### Example

```css
/* different background per face */
.turnBoxFaceNum1 { background: #ffffff; }
.turnBoxFaceNum2 { background: #f5f5f5; }

/* shadow on the active face */
.turnBoxContainer.turnBoxCurrentFace2 .turnBoxFaceNum2 {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}
```

---

## License

MIT
