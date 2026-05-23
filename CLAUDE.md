# CLAUDE.md

## プロジェクト概要

TURNBOX.js は CSS3 3D transform を使ったボックスアニメーション jQuery プラグイン（848行 IIFE）。
現在、以下の目標でモダン化作業を進めている。

1. **フェーズ1**: 現行 `turnBox.js` に対してテストを追加し、振る舞いを仕様として固定する
2. **フェーズ2以降**: モノレポとして再構築（`@kazuhi-ra/turnbox-core` / `@kazuhi-ra/turnbox-dom` / `@kazuhi-ra/turnbox-react` / `@kazuhi-ra/turnbox-vue`）

作業の詳細なチェックリストは `todo.md` を参照すること。

---

## 絶対に守るルール

- `tests/turnBox.test.js` は **一行も変更しない**（再構築後も 100% pass させる）
- `turnBox.js`（ルート）はフェーズ1の間は **読み取り専用**

---

## コーディング原則

- **イミュータブル優先**: `const` をデフォルト。`let`/`var` は本当に再代入が必要な場合のみ
- **破壊的変更の前に自問**: 「新しい値を返すだけでは駄目か？」
- **スプレッド・`map/filter/reduce` を積極活用**
- **副作用は境界に閉じ込める**: DOM操作・スタイル適用は `@kazuhi-ra/turnbox-dom` の責務
- **関数はアロー関数で書く**（`const foo = () => ...`）
- **型は `type` エイリアスで書く**（`interface` は使わない）

## リント（Biome）

```bash
pnpm lint        # biome lint packages/
pnpm lint:fix    # 自動修正
pnpm format      # biome format --write packages/
```

- `useConsistentTypeDefinitions: "type"` → `interface` は lint error
- アロー関数はコーディング規約として運用（Biome 2.x に `useArrowFunction` ルールなし）

---

## アーキテクチャ方針

### パッケージ構成（`@floating-ui` パターン）

| パッケージ       | 役割                                             |
| ---------------- | ------------------------------------------------ |
| `@kazuhi-ra/turnbox-core`  | 純粋関数群（DOM依存なし）: CSS計算・状態ロジック |
| `@kazuhi-ra/turnbox-dom`   | バニラJS用: DOM操作 + core をバンドル            |
| `@kazuhi-ra/turnbox-react` | React コンポーネント（core を依存）              |
| `@kazuhi-ra/turnbox-vue`   | Vue SFC（core を依存）                           |

### スタイル適用方針

- **インラインスタイル**（`element.style.*`）で適用。`<head>` への style injection は廃止
- `@kazuhi-ra/turnbox-core` は CSS文字列ではなく **計算済みの値**（deg, translate3d, zIndex）を返す
- React/Vue は返り値をそのまま `style` prop / `:style` binding に渡せる

---

## テスト環境

```bash
pnpm test             # vitest run
pnpm test:watch       # vitest (watch mode)
pnpm test:coverage    # vitest run --coverage
```

- **Vitest + jsdom + jQuery 1.12.4**
- `tests/setup.js`: `global.jQuery` / `global.$` を設定後、`vm.runInThisContext()` で `turnBox.js` をスクリプトとして実行（ESMのstrict mode回避のため）
- jsdom は `transition-duration` を解釈しない → `vi.useFakeTimers()` + `vi.advanceTimersByTime()` で制御

---

## 既知の挙動・注意点

- `turnBox.js` は `box.selector`（jQuery 3.x で削除済み）を style ID 生成に使用。テスト時は注意
- `face_pcs` は `create_style()` 内で副作用的に変更される（4→6, 3→4, 2→3）が、`animate_box` は `target_box.children().length` で上書きする
- 2フェイス境界: face 2 から NEXT、face 1 から PREV は no-op
- 4フェイス `type:"real"` の折り返し: face 4 NEXT → virtual face 5 → face 1、face 1 PREV → virtual face 0 → face 4
