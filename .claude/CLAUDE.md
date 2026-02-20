# Ideas Lab

日々のWebコンテンツのアイデアを形にするプロトタイプ・モック集。
GitHub Pages で自動デプロイ、ギャラリーから一覧閲覧可能。

## プロジェクト構成

```
ideas/
├── index.html              ← ギャラリートップ（manifest.jsonを読む）
├── manifest.json            ← GitHub Actionsで自動生成（gitignore対象）
├── <project-dir>/           ← 各コンテンツ（ディレクトリ名がスラッグ）
│   ├── index.html           ← エントリーポイント（必須）
│   └── meta.json            ← メタ情報（推奨）
├── _scripts/                ← ビルドスクリプト
├── _samples/                ← テンプレート
├── .plan/                   ← 実装計画書
├── .claude/                 ← Claude Code ルール
└── .github/workflows/       ← CI/CD
```

## デプロイ

- ホスティング: GitHub Pages（GitHub Actions経由）
- URL: `https://gp-maeno.github.io/ideas/`
- トリガー: `main` ブランチへの push
- ワークフロー: `.github/workflows/deploy.yml`
  - `_scripts/build-manifest.sh` で manifest.json を生成
  - GitHub Pages にデプロイ

## Git 運用

- リモート: `https://github.com/gp-maeno/ideas.git`
- ブランチ: `main`（単一ブランチ運用）
- push時にプロキシ設定が必要:
  ```
  git config http.proxy "$https_proxy"
  git config http.proxyAuthMethod basic
  ```
