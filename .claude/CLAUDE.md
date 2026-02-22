# Ideas Lab

日々のアイデアをWebプロトタイプとして形にする実験場。GitHub Pagesで自動デプロイ。

## 構成

```
ideas/
├── index.html              ← ギャラリートップ（Tailwind CSS + Alpine.js）
├── manifest.json            ← 自動生成（.gitignore対象）
├── assets/                  ← ギャラリー共通アセット
│   ├── css/gallery.css
│   └── js/gallery.js
├── <project>/               ← 各プロジェクト（自己完結型）
│   ├── index.html           ← エントリーポイント（HTML構造のみ）
│   ├── assets/              ← プロジェクト固有のCSS/JS
│   │   ├── css/<name>.css
│   │   └── js/<name>.js
│   └── meta.json            ← メタ情報
├── _scripts/                ← ビルドスクリプト
├── .plan/                   ← 実装計画書
└── .github/workflows/       ← CI/CD
```

## デプロイ

- URL: `https://gp-maeno.github.io/ideas/`
- トリガー: `main` push → GitHub Actions → `build-manifest.sh` → Pages デプロイ

## push手順

この環境ではプロキシ設定が必要:
```bash
git config http.proxy "$https_proxy"
git config http.proxyAuthMethod basic
```

---

## コンテンツ制作ルール

### ファイル構成

- `index.html` はHTML構造のみ。CSS/JSは `assets/` 配下に分離する
  - CSS → `<project>/assets/css/<name>.css`
  - JS → `<project>/assets/js/<name>.js`
- プロジェクト内のファイルは **そのディレクトリ内で自己完結** させる（ルートの `assets/` は参照しない）
- ライブラリはCDN読み込み。npm/ビルドステップ不要
- GitHub Pages互換（静的ファイルのみ、サーバー処理不可）
- SPAのルーティングはハッシュルーター推奨

### 必須要素

- `← Gallery` への戻りリンク（`<a href="../">` 形式）
- `lang="ja"` 属性
- viewport meta タグ

### ライブラリ選定の指針

プロジェクトの特性に応じて適切なライブラリを選ぶ:

| 種類 | 推奨 | 用途 |
|---|---|---|
| UI/フォーム系 | Tailwind CSS (CDN) + Alpine.js | フィルター、リアクティブUI |
| 3D/WebGL | Three.js + CSS変数 | 3D描画（Tailwind不要） |
| Canvas/2D | 素のCanvas API or p5.js | 2Dアニメーション |
| シンプルな静的 | CSS変数 + Vanilla JS | 最小構成 |

**注意:** Tailwind CSSはUI要素が多いページで有効。Three.jsフルスクリーンアプリ等、カスタムCSSが主体の場合はCSS変数ベースの方が適切。

### meta.json

```json
{
  "title": "表示名",
  "description": "説明",
  "tags": ["tag1", "tag2"],
  "date": "YYYY-MM-DD",
  "type": "static | spa | three.js"
}
```

- `date`: 作業日の日付（日本時間 JST）を設定する。省略しない
- `title`: 省略時はディレクトリ名

### ギャラリー除外対象

`_` `.` で始まるディレクトリ、`assets`

---

## ギャラリートップ（確定済み）

ギャラリーのデザイン・構成は確定済み。変更時はユーザー確認が必要。

### 技術スタック

| ライブラリ | 用途 |
|---|---|
| Tailwind CSS (CDN) | スタイリング |
| Alpine.js 3.14 | リアクティブUI・フィルター |
| Inter + Noto Sans JP | 見出し・本文フォント |
| DM Mono | メタ情報用等幅フォント |

### デザイン仕様

- 正方形グリッドカード（`aspect-ratio: 1/1`、モバイルでは `auto`）
- ダークテーマ（`#0a0a0a` ベース）
- アクセントカラー: `#c4f042`
- レスポンシブ: 3段階（デスクトップ auto-fill / タブレット 2列 / モバイル 1列）

---

## コードスタイル

- CSS変数でテーマ管理、ダークテーマがデフォルト
- モバイルファースト、レスポンシブ必須
- ES2020+、`const`/`let`のみ、async/await
- `var` 禁止
- `innerHTML` は使用しない（`textContent` + DOM API を使う）
- JSコメントは日本語

---

## デザイン

- 各コンテンツは独自のデザインで自由に。汎用的・無個性なデザインは避ける
- スマホでの動作を最優先、初回ロード3秒以内目標
- 重いアセットにはローディング表示を入れる

---

## ワークフロー

新規コンテンツ制作時は `/new-content` スキルを参照。
実装計画は `.plan/<project>/PLAN.md` に保存し、承認を得てから着手する。
