# @turnbox/vue

Vue 向けの TURNBOX.js パッケージです。  
宣言的な **compound component**（`TurnBox.Root / Face / Button`）と、DOM を直接操作する **`useTurnBox` コンポーザブル**の2つのAPIを提供します。

## インストール

```bash
npm install @turnbox/vue
```

Vue 3 以上が必要です。

---

## Compound Component

`TurnBox.Button` を面の中に置くことで、ナビゲーションを宣言的に記述できます。

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

### 外部から制御する（`ref`）

プログラムからナビゲーションを操作したい場合は `ref` を使います。

```vue
<template>
  <TurnBox.Root :faces="4" :duration="400" :ref="handle">
    <TurnBox.Face>面 1</TurnBox.Face>
    <TurnBox.Face>面 2</TurnBox.Face>
    <TurnBox.Face>面 3</TurnBox.Face>
    <TurnBox.Face>面 4</TurnBox.Face>
  </TurnBox.Root>
  <button @click="handle?.next()">次へ</button>
  <button @click="handle?.prev()">戻る</button>
</template>

<script setup>
import { ref } from "vue";
import { TurnBox, type TurnBoxRootHandle } from "@turnbox/vue";

const handle = ref<TurnBoxRootHandle | null>(null);
</script>
```

### `TurnBoxRootHandle`

| メソッド | 説明 |
| --- | --- |
| `next()` | 次の面へ移動する |
| `prev()` | 前の面へ移動する |
| `goTo(face, animation?)` | 指定した面へ移動する。`animation` を `false` にするとアニメーションなし（デフォルト `true`） |
| `getCurrentFace()` | 現在の面番号を返す（1始まり） |

### `TurnBox.Button` props

| props | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `direction` | `"next" \| "prev"` | `"next"` | 次の面へ進む・前の面へ戻る |
| `to` | `number` | — | 指定した面番号へ直接移動する（`direction` より優先） |

`TurnBox.Button` はネイティブ `<button>` 要素です。`class` や `style` などの標準 attrs を渡せます。

---

## `useTurnBox` コンポーザブル

DOM 要素を `ref` でバインドし、命令的にアニメーションを制御します。  
スタイルを自由に組みたい場合や、ライブラリの UI コンポーネントを使わない場合に使います。

```vue
<script setup>
import { useTurnBox } from "@turnbox/vue";

const { containerRef, currentFace, isAnimating, next, prev, goTo } = useTurnBox({
  faces: 2,
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

### `UseTurnBoxReturn`

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `containerRef` | `Ref<HTMLElement \| null>` | コンテナ要素にバインドする ref |
| `currentFace` | `Ref<number>` | 現在の面番号（1始まり） |
| `isAnimating` | `Ref<boolean>` | アニメーション中かどうか |
| `next()` | `() => void` | 次の面へ移動する |
| `prev()` | `() => void` | 前の面へ移動する |
| `goTo(face, animation?)` | `(face: number, animation?: boolean) => void` | 指定した面へ移動する |

---

## オプション

`TurnBox.Root` と `useTurnBox` で共通の `TurnBoxOptions` です。  
詳細は[共通オプション](../../README.md#オプション)を参照してください。

---

## ライセンス

MIT
