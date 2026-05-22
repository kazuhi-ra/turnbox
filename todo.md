# TURNBOX.js モダン化 TODO

## 設計方針メモ

### はじめに

まずはじめに `turnBox.js` に対する自動テストを作成する。
パラメータの主要パターン全てを網羅するように作成し、振る舞いを徹底的に洗い出す。
このテストはプロジェクトにおける最重要事項である。

作成したテストは、この後に作成する、dom, react, vueにも適用し、100%のpassをもって、そのpackageの完成とする。
つまり、テストは振る舞いに対して行うものであり、元の `turnBox.js` のjQueryでの実装に依存しない形で記述する必要がある。
同じパターンのテストを、各パッケージに重複して作成するわけではない。
テスト対象の要素を任意に入れ替えられるよう、柔軟に記述することで、どのpackageに対してもテスト可能にするわけである。

### テストの見直し

テストが完成したら、さらに追い込む。
今一度、元の仕様書である `README.md`、そして`turnBox.js`の実装をよく分析し、足りていないテストパターンがないか、
また、テストをより良く構造化できないか(describeの入れ子構造など)を徹底検証する。
改めて強調するが、ここで作成するテストが、今後のプロセスのバグの発生率を左右する。
最重要事項である。

### モノレポ作成

packages/\* に作成

### packages/core 実装

ここ更新。いい感じにdoc書いて

### packages/dom 実装

ここ更新。いい感じにdoc書いて

### packages/react 実装

ここ更新。いい感じにdoc書いて

---

## フェーズ1: テスト基盤（現行 turnBox.js に対して）

- [x] 目的達成のために、どのテストツールを仕様するかplan（Vitest + jsdom + アダプターパターン）
- [x] テスト作成開始
  - [x] `tests/suite/adapter.ts` — TurnBoxTestAdapter 型定義
  - [x] `tests/adapters/jquery.ts` — jQuery アダプター実装
  - [x] `tests/suite/basic-navigation.test.ts` — goTo/next/prev の状態遷移 (16テスト)
  - [x] `tests/suite/wrap-around.test.ts` — face4↔face1 wrap 全 type (10テスト)
  - [x] `tests/suite/animation-types.test.ts` — real/repeat/skip の振る舞い (10テスト)
  - [x] `tests/suite/options.test.ts` — axis/direction オプション (12テスト)
  - [x] `tests/suite/no-animation.test.ts` — animation=false・非隣接 goTo (8テスト)
- [x] テストの見直し（README・turnBox.js と照合、describeの入れ子構造など）第1回
  - [x] `basic-navigation.test.ts` — nested describe 構造に整理、goTo クランプ・not-only-one-shown テスト追加
  - [x] `tests/suite/edge-cases.test.ts` — facePcs>4 キャップ・out-of-range goTo・even オプション・type:skip→real 強制・shown 不変条件 (11テスト)
- [x] テストの見直し第2回（transform値・wrap CSS生成・全振る舞い対応表で漏れ確認）
  - [x] jsdom が `getComputedStyle` でCSS注入transformを読めることを確認
  - [x] `tests/suite/transform-values.test.ts` — axis:X/Y の具体的 transform 値・wrap 時の仮想 currentFace0/5 の CSS 値 (22テスト)
  - **重要**: axis:Y wrap で face4 の translate3d が `-100px`（負）になることを明示テスト化 — これが元のバグ原因
- [x] テストの見直し第3回（type:repeat/skip/even の transform 値・double-init CSS リーク・2/3-face CSS ルール検証）
  - [x] `tests/suite/transform-values.test.ts` — type:repeat/skip/even の transform 値を追加（face4=90°not270°・no180°・variable translate3d）
  - [x] `tests/suite/edge-cases.test.ts` — double-init guard・2/3/4-face CSS rule 構造検証を追加
  - [x] `tests/adapters/jquery.ts` `destroy()` を `querySelectorAll` に修正（複数 style 要素のリーク防止）
  - 合計: 122テスト ALL GREEN（direction:negative+axis:Y / even+axis:Y transform 値追加）

## フェーズ2: モノレポ骨格

- [x] `pnpm-workspace.yaml` 確認（packages/* 設定済み）
- [x] `typescript` / `tsup` を root devDependencies に追加
- [x] `packages/core/package.json` / `tsconfig.json` 作成
- [x] `packages/dom/package.json` / `tsconfig.json` 作成
- [x] `vitest.config.js` に `@turnbox/core` / `@turnbox/dom` alias 追加
- [x] `biome.json` / `package.json` scripts に `tests/` を追加

## フェーズ3: packages/core 実装 (@turnbox/core)

- [x] `src/types.ts` — TurnBoxOptions / NormalizedOptions / FaceTransform 型定義
- [x] `src/normalize.ts` — normalizeOptions（facePcs cap・fixed 判定・type:skip 強制）
- [x] `src/transform.ts` — calcFaceTransform / calcAdjustFaceTransform（fixed/variable/adjust 3パス）
- [x] `src/navigation.ts` — resolveTargetFace / shouldAnimate
- [x] ビルド確認（tsup ESM + DTS）

## フェーズ4: packages/dom 実装 (@turnbox/dom)

- [x] `src/css.ts` — toTransformString（FaceTransform → CSS 文字列）
- [x] `src/createTurnBox.ts` — createTurnBox（init・goTo/next/prev・animate lifecycle・destroy）
- [x] `tests/adapters/dom.ts` — DOM アダプター実装
- [x] 全テストスイートに DOM adapter 追加
- [x] 200テスト ALL GREEN（jQuery 100 + DOM 100）

---

## フェーズ5: packages/react 実装 (@turnbox/react)

- [x] `src/useTurnBox.ts` — useTurnBox フック実装
- [x] `tests/adapters/react.ts` — React アダプター実装
- [x] 全テストスイートに React adapter 追加
- [x] 435テスト ALL GREEN（jQuery + DOM + React + Vue）

---

## フェーズ6: packages/vue 実装 (@turnbox/vue)

- [x] `src/useTurnBox.ts` — useTurnBox コンポーザブル実装
- [x] `tests/adapters/vue.ts` — Vue アダプター実装
- [x] 全テストスイートに Vue adapter 追加
- [x] 435テスト ALL GREEN（jQuery + DOM + React + Vue）

---

## パッケージテスト追加

- [x] 474テスト ALL GREEN（jQuery + DOM + React + Vue）

---

## TODO

- [x] React compound component（`TurnBox.Root / Face`）にアクセシビリティテストを追加
  - `accessibility.test.ts` を `describe.each(modernAdapters)` に統合し、DOM / React / Vue / React (Component) の全 4 アダプターで検証

---

## Storybook バグ修正

### Storybook opacity フェード除去

- [x] `packages/dom/stories/TurnBox.stories.ts` — `.turnBoxFace.turnBoxTransition` の transition から `opacity` を除去
- [x] `packages/react/stories/TurnBox.stories.tsx` — 同上
- [x] `packages/vue/stories/TurnBox.stories.ts` — 同上
- **原因**: 元の jQuery の face transition は `transform, z-index, background` のみで opacity は含まない。Storybook に誤って `opacity ${duration}ms ease` を含めていたため、face1 がフェードインしながら face4 と交差し、ぼやけて見えていた。

### axis:Y face1↔face4 エッジ離れ修正（type:real 固定ジオメトリ）

- [x] `packages/dom/src/createTurnBox.ts` — 固定ジオメトリ wrap 時のインカミング face をアニメーション前に ±90° へプレ配置し、ADJUST_TIME でターゲットを 0° に上書き
- [x] `tests/suite/wrap-around.test.ts` — 回帰テスト追加（axis:Y, 全 direction/wrap ケースの t=0 プレ配置・ADJUST_TIME ターゲット・完了後状態）
- **原因**: CSS 固定ジオメトリでは incoming face が ±270° の resting 位置にいる。CSS は ±270°→±360° を 90° 補間するが、translate3d の符号が axis:Y では ±90° と ±270° で逆になるため、補間経路がエッジから離れた側を通っていた。±90° に事前配置することで translate3d も正しい値になり、CSS が正しい 90° 弧を描く。
