# TURNBOX.js

CSS3 3D transform を使ったボックス反転アニメーションライブラリです。  
トグル・タブ・カードフリップなど、面を「めくる」ような UI に使えます。

## パッケージ

| パッケージ       | 説明                                              |
| ---------------- | ------------------------------------------------- |
| `@turnbox/core`  | 純粋関数群（DOM依存なし）。カスタムレンダラー向け |
| `@turnbox/dom`   | バニラJS用。`createTurnBox()` を提供              |
| `@turnbox/react` | React フック。`useTurnBox()` を提供               |
| `@turnbox/vue`   | Vue コンポーザブル。`useTurnBox()` を提供         |

---

## インストール

```bash
# バニラJS
npm install @turnbox/dom

# React
npm install @turnbox/react

# Vue
npm install @turnbox/vue
```

---

## 使い方

### バニラJS (`@turnbox/dom`)

```html
<div id="box">
  <div>面 1</div>
  <div>面 2</div>
  <div>面 3</div>
  <div>面 4</div>
</div>
```

```js
import { createTurnBox } from "@turnbox/dom";

const container = document.getElementById("box");
const box = createTurnBox(container, { facePcs: 4, duration: 400 });

box.next(); // 次の面へ
box.prev(); // 前の面へ
box.goTo(3); // 面3へ（アニメーションあり）
box.goTo(2, false); // 面2へ（アニメーションなし）
box.getCurrentFace(); // 現在の面番号を返す（1始まり）
box.destroy(); // クリーンアップ
```

### React (`@turnbox/react`)

```tsx
import { useRef } from "react";
import { useTurnBox } from "@turnbox/react";

const FlipCard = () => {
  const { containerRef, currentFace, next, prev, goTo } = useTurnBox({
    facePcs: 2,
    duration: 400,
  });

  return (
    <div ref={containerRef}>
      <div>表</div>
      <div>裏</div>
    </div>
  );
};
```

### Vue (`@turnbox/vue`)

```vue
<script setup>
import { useTurnBox } from "@turnbox/vue";

const { containerRef, currentFace, next, prev, goTo } = useTurnBox({
  facePcs: 2,
  duration: 400,
});
</script>

<template>
  <div ref="containerRef">
    <div>表</div>
    <div>裏</div>
  </div>
</template>
```

---

## オプション

`createTurnBox` / `useTurnBox` に渡す `TurnBoxOptions` の一覧です。

| オプション  | 型                             | デフォルト                     | 説明                                                                           |
| ----------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| `facePcs`   | `number`                       | —                              | 面の枚数（2〜4、5以上は4に丸められる）。**必須**                               |
| `axis`      | `"X" \| "Y"`                   | `"X"`                          | 回転軸。`"X"` で縦回転、`"Y"` で横回転                                         |
| `direction` | `"positive" \| "negative"`     | `"positive"`                   | 回転方向。`"negative"` で逆向きになる                                          |
| `type`      | `"real" \| "repeat" \| "skip"` | `"real"`                       | アニメーションの種類（後述）                                                   |
| `duration`  | `number`                       | `800`                          | アニメーション時間（ms）                                                       |
| `delay`     | `number`                       | `50`                           | アニメーション開始前の遅延（ms）                                               |
| `width`     | `number`                       | `200`                          | ボックスの幅（px）                                                             |
| `height`    | `number`                       | `200`                          | ボックスの高さ（px）                                                           |
| `even`      | `number`                       | `height` または `width` と同値 | 偶数番目の面の回転軸方向のサイズ（px）。省略時は奇数番目と同じ正方形断面になる |

### `type` オプション詳細

**`"real"`（デフォルト）**  
実際の箱のように90°ずつ回転します。4面の場合、面4→面1・面1→面4は折り返しアニメーションになります。`even` オプションと組み合わせ可能。

**`"repeat"`**  
面1↔面2のアニメーションを面3↔面4でも同じモーションで繰り返します。

**`"skip"`**  
現在の面と指定面が隣接していなくても、常に90°アニメーションで遷移します。`even` 指定時は `"real"` に強制されます。

### `even` オプション（非対称ボックス）

`axis: "X"` なら `height` を、`axis: "Y"` なら `width` を偶数番目の面だけ別のサイズにできます。

```js
// axis:X で高さが奇数面50px / 偶数面30px の非対称ボックス
createTurnBox(container, {
  facePcs: 4,
  axis: "X",
  height: 50,
  even: 30,
});
```

---

## CSS

ライブラリが付与するクラスを使って自由にスタイルを当てられます。

| クラス                  | 付与対象 | 説明                                                 |
| ----------------------- | -------- | ---------------------------------------------------- |
| `turnBoxContainer`      | コンテナ | 初期化時に付与                                       |
| `turnBoxCurrentFace{N}` | コンテナ | 現在の面番号（N=1〜4）。CSS でのステート管理に使用可 |
| `turnBoxFace`           | 各面要素 | 全面に付与                                           |
| `turnBoxFaceNum{N}`     | 各面要素 | 面番号（N=1〜4）ごとのスタイリングに使用可           |
| `turnBoxShow`           | 各面要素 | 現在表示中の面に付与                                 |

```css
/* 面番号ごとのスタイリング例 */
.turnBoxFaceNum1 {
  background: #fff;
}
.turnBoxFaceNum2 {
  background: #f0f0f0;
}

/* コンテナの状態に応じたスタイリング例 */
.turnBoxContainer.turnBoxCurrentFace2 .turnBoxFaceNum2 {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}
```
