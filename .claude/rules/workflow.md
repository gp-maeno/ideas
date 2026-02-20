# ワークフロー

## 実装計画

新規コンテンツの制作前に、必ず実装計画を立てる。

1. 要件の確認（不明点はユーザーに質問）
2. `.plan/<project-name>/PLAN.md` に実装計画を記述
3. ユーザーの承認を得てから実装に着手

計画書には以下を含める:
- 概要・目的
- 技術スタック選定理由
- データソース
- 実装フェーズ（段階的に分割）
- 懸念点と対策

## コミットメッセージ

- 日本語 or 英語どちらでもOK（混在も可）
- 新規コンテンツ追加: `Add <project-name> - <short description>`
- 修正: `Fix <project-name>: <what was fixed>`
- ギャラリー更新: `Update gallery: <what changed>`

## push 手順

この環境からの push にはプロキシ設定が必要:
```bash
cd /home/claude/ideas
git config http.proxy "$https_proxy"
git config http.proxyAuthMethod basic
git add -A
git commit -m "メッセージ"
git push
```

## デプロイ確認

push 後、GitHub Actions の実行状況を確認:
- https://github.com/gp-maeno/ideas/actions
- デプロイ先: https://gp-maeno.github.io/ideas/
