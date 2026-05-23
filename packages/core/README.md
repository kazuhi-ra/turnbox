# @turnbox/core

TURNBOX.js のコアロジックパッケージです。  
DOM に依存しない純粋関数のみで構成されており、独自のレンダラーを実装したい場合に使います。

通常は `@turnbox/dom` / `@turnbox/react` / `@turnbox/vue` を使ってください。

---

## インストール

```bash
npm install @turnbox/core
```

---

## Public API

### `normalizeOptions(options)`

`TurnBoxOptions` を受け取り、デフォルト値を補完した `NormalizedOptions` を返します。

```ts
import { normalizeOptions } from "@turnbox/core";

const opts = normalizeOptions({ faces: 4, duration: 400 });
```

### `calcFaceTransform(currentFace, faceNum, opts)`

現在の表示面（`currentFace`）から見た、各面（`faceNum`）の CSS transform 値を計算します。

```ts
import { normalizeOptions, calcFaceTransform } from "@turnbox/core";

const opts = normalizeOptions({ faces: 4 });
const transform = calcFaceTransform(1, 2, opts);
// { axis: "X", deg: -90, x: 0, y: 45, z: 25, zIndex: 10, transformOrigin: "50% 50%" }
```

戻り値の `FaceTransform` をそのままスタイルに変換する場合は、以下の形式で組み立てます。

```ts
const cssTransform = `rotate${transform.axis}(${transform.deg}deg) translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px)`;
```

### `DEFAULT_SIZE` / `DEFAULT_HEIGHT`

デフォルトのボックスサイズ定数です。

```ts
import { DEFAULT_SIZE, DEFAULT_HEIGHT } from "@turnbox/core";
// DEFAULT_SIZE = 200  (幅のデフォルト値)
// DEFAULT_HEIGHT = 50 (高さのデフォルト値)
```

---

## Internal API

`@turnbox/core/internal` は `@turnbox/*` パッケージ間で共有する内部 API です。  
マイナーバージョンで破壊的変更が入る可能性があるため、外部からの直接利用は推奨しません。

---

## ライセンス

MIT
