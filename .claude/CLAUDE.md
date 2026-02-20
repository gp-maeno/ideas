# Ideas Lab

日々のアイデアをWebプロトタイプとして形にする実験場。GitHub Pagesで自動デプロイ。

## 構成

```
ideas/
├── index.html            ← ギャラリートップ（manifest.jsonを動的読み込み）
├── manifest.json          ← 自動生成（.gitignore対象）
├── <project>/index.html   ← 各コンテンツのエントリーポイント
├── <project>/meta.json    ← メタ情報（任意）
├── _scripts/              ← ビルドスクリプト
├── .plan/                 ← 実装計画書
└── .github/workflows/     ← CI/CD
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

## コンテンツ制作ルール

- 各コンテンツは `index.html` 1ファイルで完結させる（CSS/JSもインライン）
- ライブラリはCDN読み込み。npm/ビルドステップ不要
- GitHub Pages互換（静的ファイルのみ、サーバー処理不可）
- SPAのルーティングはハッシュルーター推奨
- `← Gallery` への戻りリンクを必ず含める

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

## コードスタイル

- `lang="ja"`、viewport meta 必須
- CSS変数でテーマ管理、ダークテーマがデフォルト
- モバイルファースト、レスポンシブ必須
- ES2020+、`const`/`let`のみ、async/await
- `var` 禁止

## デザイン

- ギャラリーのデザインは確定済（変更時はユーザー確認）
- 各コンテンツは独自のデザインで自由に。汎用的・無個性なデザインは避ける
- スマホでの動作を最優先、初回ロード3秒以内目標
- 重いアセットにはローディング表示を入れる

## ワークフロー

新規コンテンツ制作時は `/new-content` スキルを参照。
実装計画は `.plan/<project>/PLAN.md` に保存し、承認を得てから着手する。
