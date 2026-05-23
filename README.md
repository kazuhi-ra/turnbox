# TURNBOX.js

CSS3 3D transform を使ったボックス反転アニメーションライブラリです。  
トグル・タブ・カードフリップなど、面を「めくる」ような UI に使えます。

## パッケージ

| パッケージ | 説明 | README |
| --- | --- | --- |
| `@turnbox/dom` | バニラJS用。`createTurnBox()` を提供 | [詳細](packages/dom/README.md) |
| `@turnbox/react` | React フック・compound component を提供 | [詳細](packages/react/README.md) |
| `@turnbox/vue` | Vue コンポーザブル・compound component を提供 | [詳細](packages/vue/README.md) |
| `@turnbox/core` | 純粋関数群（DOM依存なし）。カスタムレンダラー向け | [詳細](packages/core/README.md) |

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

## クイックスタート

### バニラJS

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

const box = createTurnBox(document.getElementById("box"), {
  faces: 4,
  duration: 400,
});

box.next();    // 次の面へ
box.prev();    // 前の面へ
box.goTo(3);   // 面3へ直接移動
```

### React

```tsx
import { TurnBox } from "@turnbox/react";

const FlipCard = () => (
  <TurnBox.Root faces={4} duration={400}>
    <TurnBox.Face>
      面 1<TurnBox.Button>次へ</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      <TurnBox.Button direction="prev">戻る</TurnBox.Button>面 2
    </TurnBox.Face>
    <TurnBox.Face>面 3</TurnBox.Face>
    <TurnBox.Face>面 4</TurnBox.Face>
  </TurnBox.Root>
);
```

### Vue

```vue
<template>
  <TurnBox.Root :faces="4" :duration="400">
    <TurnBox.Face>
      面 1<TurnBox.Button>次へ</TurnBox.Button>
    </TurnBox.Face>
    <TurnBox.Face>
      <TurnBox.Button direction="prev">戻る</TurnBox.Button>面 2
    </TurnBox.Face>
    <TurnBox.Face>面 3</TurnBox.Face>
    <TurnBox.Face>面 4</TurnBox.Face>
  </TurnBox.Root>
</template>

<script setup>
import { TurnBox } from "@turnbox/vue";
</script>
```

---

## オプション

`createTurnBox` / `useTurnBox` / `TurnBox.Root` に共通の `TurnBoxOptions` です。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `faces` | `2 \| 3 \| 4` | — | 面の枚数。**必須** |
| `axis` | `"X" \| "Y"` | `"X"` | 回転軸。`"X"` で縦回転、`"Y"` で横回転 |
| `direction` | `"positive" \| "negative"` | `"positive"` | 回転方向。`"negative"` で逆向きになる |
| `type` | `"real" \| "repeat" \| "skip"` | `"real"` | アニメーションの種類（後述） |
| `duration` | `number` | `200` | アニメーション時間（ms） |
| `delay` | `number` | `0` | アニメーション開始前の遅延（ms） |
| `easing` | `string` | `"linear"` | CSS easing 関数 |
| `perspective` | `number` | `800` | 透視距離（px） |
| `width` | `number` | `200` | ボックスの幅（px） |
| `height` | `number` | `50` | ボックスの高さ（px） |
| `even` | `number` | `height` または `width` と同値 | 偶数番目の面の回転軸方向サイズ（px）。省略時は全面同サイズ |
| `onChange` | `(face: number) => void` | — | 遷移開始時のコールバック。引数は遷移先の面番号 |
| `onAnimationEnd` | `(face: number) => void` | — | アニメーション完了時のコールバック。引数は遷移先の面番号 |

### `type` オプション

**`"real"`（デフォルト）**  
実際の箱のように90°ずつ回転します。4面の場合、面4→面1・面1→面4は折り返しアニメーションになります。

**`"repeat"`**  
面1↔面2のアニメーションを面3↔面4でも同じモーションで繰り返します。

**`"skip"`**  
現在の面と指定面が隣接していなくても、常に90°アニメーションで遷移します。`even` 指定時は `"real"` に強制されます。

### `even` オプション（非対称ボックス）

奇数番目の面と偶数番目の面でサイズが異なるボックスを作れます。  
`axis: "X"` なら高さ方向、`axis: "Y"` なら幅方向を偶数面だけ別サイズにします。

```js
createTurnBox(container, {
  faces: 4,
  axis: "X",
  height: 50,
  even: 30,
});
```

---

## ライセンス

MIT
