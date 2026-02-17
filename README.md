# Ideas Lab

日々のアイデアをカタチにするプロトタイプ・モック集。  
GitHub Pages で自動デプロイされ、ギャラリーから一覧で閲覧可能。

## 構成

```
ideas/
├── index.html              ← ギャラリートップ（自動生成されたmanifest.jsonを読む）
├── manifest.json            ← GitHub Actionsで自動生成
├── hello-world/             ← プロジェクト例
│   ├── index.html
│   └── meta.json
├── _scripts/                ← ビルドスクリプト
├── _samples/                ← テンプレート
└── .github/workflows/       ← CI/CD
```

## 新規プロジェクトの追加方法

1. ルート直下にディレクトリを作成（例: `my-project/`）
2. `index.html` を配置
3. `meta.json` を配置（任意だが推奨）
4. `main` ブランチに push → 自動でギャラリーに反映

### meta.json の書式

```json
{
  "title": "プロジェクト名",
  "description": "簡単な説明",
  "tags": ["react", "animation"],
  "date": "2025-02-17",
  "type": "spa"
}
```

| フィールド | 必須 | 説明 |
|---|---|---|
| `title` | - | 表示タイトル（省略時はディレクトリ名） |
| `description` | - | ギャラリーに表示する説明文 |
| `tags` | - | フィルター用タグ |
| `date` | - | 作成日（省略時はgitコミット日） |
| `type` | - | `static` / `spa` / `react` / `vue` 等 |
| `thumbnail` | - | サムネイル画像パス（将来用） |

## SPA プロジェクトの注意点

GitHub Pages は静的ホスティングのため、SPA のクライアントサイドルーティングで  
ブラウザリロード時に 404 になる場合があります。

対処法:
- **ハッシュルーター**（`#/about` 形式）を使用（推奨）
- `404.html` にリダイレクトスクリプトを設置

## 除外ルール

以下のディレクトリはギャラリーに表示されません:
- `_` で始まるディレクトリ（`_scripts`, `_samples` 等）
- `.` で始まるディレクトリ（`.github` 等）
- `assets` ディレクトリ（ギャラリー共通アセット用）
