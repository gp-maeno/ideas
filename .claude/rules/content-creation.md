# コンテンツ制作ルール

## 新規コンテンツ追加の手順

1. ルート直下にケバブケースのディレクトリを作成（例: `my-project/`）
2. `index.html` を配置（必須）
3. `meta.json` を配置（推奨）
4. 実装計画がある場合は `.plan/<project-name>/PLAN.md` に配置
5. `main` ブランチに push → 自動でギャラリーに反映

## ファイル構成の原則

- **単一HTML優先**: 各コンテンツは可能な限り `index.html` 1ファイルで完結させる
- **外部依存はCDN**: ライブラリはCDN（cdnjs, jsdelivr等）から読み込む。npm/ビルドステップは不要にする
- **データ埋め込み or CDN取得**: 小さなデータはインライン、大きなデータはCDNからランタイム取得
- **GitHub Pages互換**: サーバーサイド処理不可。静的ファイルのみ

## meta.json の書式

```json
{
  "title": "プロジェクト名",
  "description": "ギャラリーに表示する簡単な説明",
  "tags": ["tag1", "tag2"],
  "date": "YYYY-MM-DD",
  "type": "static | spa | react | vue | three.js"
}
```

- `title`: 省略時はディレクトリ名がタイトルになる
- `date`: 省略時は git コミット日が使われる
- `tags`: ギャラリーのフィルター機能で使用される

## ギャラリーから除外されるディレクトリ

- `_` で始まるディレクトリ（`_scripts`, `_samples`）
- `.` で始まるディレクトリ（`.github`, `.claude`, `.plan`）
- `assets` ディレクトリ

## ナビゲーション

各コンテンツの index.html には、ギャラリーに戻るリンクを含める:
```html
<a href="../">← Gallery</a>
```
