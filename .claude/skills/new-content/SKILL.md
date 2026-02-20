---
name: new-content
description: 新規コンテンツをIdeas Labに追加するワークフロー。新しいプロジェクトを作りたい、アイデアを形にしたい、と言われた時に使用。
---

# 新規コンテンツ追加ワークフロー

以下の手順でユーザーと進める。

## Step 1: 要件ヒアリング

ユーザーに以下を確認:
- 何を作りたいか（概要・目的）
- 想定する技術（Three.js, Canvas, 純粋HTML/CSS等）
- デザインの方向性
- 不明点があれば質問する

## Step 2: 実装計画作成

`.plan/<project-name>/PLAN.md` に以下を記述:
- 概要・目的
- 技術スタック選定理由
- データソース（あれば）
- 実装フェーズ（段階分割）
- 懸念点と対策

**ユーザーの承認を得てから Step 3 に進む。**

## Step 3: 実装

1. `<project-name>/` ディレクトリを作成（ケバブケース）
2. `index.html` を作成（単一ファイル完結、CSS/JSインライン）
3. `meta.json` を作成
4. `README.md` を作成（技術詳細・操作方法）
5. 動作確認

### meta.json テンプレート

```json
{
  "title": "プロジェクト名",
  "description": "ギャラリーに表示する説明",
  "tags": [],
  "date": "YYYY-MM-DD",
  "type": "static | spa | three.js"
}
```

### index.html 必須要素

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<html lang="ja">
<a href="../">← Gallery</a>
```

## Step 4: commit & push

```bash
git config http.proxy "$https_proxy"
git config http.proxyAuthMethod basic
git add -A
git commit -m "Add <project-name> - <説明>"
git push
```

## Step 5: デプロイ確認

- GitHub Actions: https://github.com/gp-maeno/ideas/actions
- ギャラリー: https://gp-maeno.github.io/ideas/
- コンテンツ: https://gp-maeno.github.io/ideas/<project-name>/
