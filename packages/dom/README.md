# @kazuhi-ra/turnbox-dom

バニラJS（フレームワークなし）向けの TURNBOX.js パッケージです。  
`createTurnBox()` 1関数で、CSS3 3D transform によるボックス反転アニメーションを実装できます。

## インストール

```bash
npm install @kazuhi-ra/turnbox-dom
```

---

## 基本的な使い方

### HTML

コンテナ要素の直下に面要素を並べます。

```html
<div id="box">
  <div>面 1</div>
  <div>面 2</div>
  <div>面 3</div>
  <div>面 4</div>
</div>
```

### JavaScript

```js
import { createTurnBox } from "@kazuhi-ra/turnbox-dom";

const box = createTurnBox(document.getElementById("box"), {
  faces: 4,
  duration: 400,
});

box.next();           // 次の面へ
box.prev();           // 前の面へ
box.goTo(3);          // 面3へ（アニメーションあり）
box.goTo(2, false);   // 面2へ（アニメーションなし）
```

---

## API

### `createTurnBox(container, options)`

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `container` | `HTMLElement` | ボックスのコンテナ要素 |
| `options` | `TurnBoxOptions` | オプション（[共通オプション参照](../../README.md#オプション)） |

戻り値は `TurnBoxInstance` です。

### `TurnBoxInstance`

| メソッド | 説明 |
| --- | --- |
| `next()` | 次の面へ移動する |
| `prev()` | 前の面へ移動する |
| `goTo(face, animation?)` | 指定した面へ移動する。`animation` を `false` にするとアニメーションなし（デフォルト `true`） |
| `getCurrentFace()` | 現在の面番号を返す（1始まり） |
| `isAnimating()` | アニメーション中かどうかを返す |
| `destroy()` | すべてのスタイル・クラス・タイマーを削除してクリーンアップする |

---

## CSS クラス

`@kazuhi-ra/turnbox-dom` はインラインスタイルに加え、以下の CSS クラスを付与します。  
スタイリングやステート管理に活用できます。

### コンテナに付与されるクラス

| クラス | 説明 |
| --- | --- |
| `turnBoxContainer` | 初期化時に付与 |
| `turnBoxCurrentFace1` 〜 `turnBoxCurrentFace4` | 現在表示中の面番号に対応するクラス |

### 各面要素に付与されるクラス

| クラス | 説明 |
| --- | --- |
| `turnBoxFace` | 全面に付与 |
| `turnBoxFaceNum1` 〜 `turnBoxFaceNum4` | 面番号ごとのクラス |
| `turnBoxShow` | 現在表示中の面に付与 |

### 使用例

```css
/* 面ごとに背景色を変える */
.turnBoxFaceNum1 { background: #ffffff; }
.turnBoxFaceNum2 { background: #f5f5f5; }

/* 現在の面に影をつける */
.turnBoxContainer.turnBoxCurrentFace2 .turnBoxFaceNum2 {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}
```

---

## ライセンス

MIT
