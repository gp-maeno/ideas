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

### ディレクトリ構成

```
<project-name>/
├── index.html              ← HTML構造のみ
├── assets/
│   ├── css/<name>.css      ← スタイル
│   └── js/<name>.js        ← ロジック
└── meta.json               ← メタ情報
```

### 実装手順

1. `<project-name>/` ディレクトリを作成（ケバブケース）
2. `<project-name>/assets/css/` と `<project-name>/assets/js/` を作成
3. CSS ファイルを作成（CSS変数でテーマ管理、日本語コメント）
4. JS ファイルを作成（日本語コメント）
5. `index.html` を作成（HTML構造のみ、CSS/JSは外部参照）
6. `meta.json` を作成
7. 動作確認

### ライブラリ選定

プロジェクトの特性に応じて適切なものを選ぶ:

| 種類 | 推奨 | いつ使うか |
|---|---|---|
| UI/フォーム系 | Tailwind CSS (CDN) + Alpine.js | フィルター、リアクティブUIが必要な場合 |
| 3D/WebGL | Three.js + CSS変数 | フルスクリーン3D（Tailwind不要） |
| Canvas/2D | 素のCanvas API or p5.js | 2Dアニメーション |
| シンプル | CSS変数 + Vanilla JS | 最小構成でよい場合 |

**重要:** Tailwind CSSはUI要素が多いページで有効。カスタムCSSが主体の場合（Three.jsフルスクリーンアプリ等）はCSS変数ベースが適切。

### meta.json テンプレート

```json
{
  "title": "プロジェクト名",
  "description": "ギャラリーに表示する説明",
  "tags": [],
  "date": "YYYY-MM-DD（作業日の日本時間）",
  "type": "static | spa | three.js"
}
```

### index.html 必須要素

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>プロジェクト名</title>
<link rel="stylesheet" href="./assets/css/<name>.css">
</head>
<body>
<a href="../">← Gallery</a>
<!-- コンテンツ -->
<script src="./assets/js/<name>.js"></script>
</body>
</html>
```

### コードスタイル

- `innerHTML` は使用しない（`textContent` + DOM API を使う）
- CSS変数でテーマ管理、ダークテーマがデフォルト
- JSコメントは日本語
- `var` 禁止、`const`/`let`のみ

### 自己完結の原則

- プロジェクト内のファイルはそのディレクトリ内で自己完結させる
- ルートの `assets/` は参照しない
- CDNライブラリは直接参照OK

## Step 4: commit & push

```bash
git config http.proxy "$https_proxy"
git config http.proxyAuthMethod basic
git add <project-name>/
git commit -m "feat: <project-name> - <説明>"
git push
```

## Step 5: デプロイ確認

- GitHub Actions: https://github.com/gp-maeno/ideas/actions
- ギャラリー: https://gp-maeno.github.io/ideas/
- コンテンツ: https://gp-maeno.github.io/ideas/<project-name>/
