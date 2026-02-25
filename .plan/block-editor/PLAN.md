# Block Editor - 実装計画

## 概要

Notionライクなブロックエディター。Editor.jsをベースに、CMSへの組み込みを想定した実用的なWYSIWYGエディターをデモとして構築する。

## 技術スタック

| ライブラリ | バージョン | 用途 |
|---|---|---|
| Editor.js | 2.30+ | コアエディター |
| @editorjs/header | CDN | 見出しブロック (H1-H3) |
| @editorjs/nested-list | CDN | リスト（箇条書き・番号付き） |
| @editorjs/code | CDN | コードブロック |
| @editorjs/table | CDN | テーブル |
| @editorjs/image | CDN | 画像（Base64 / URL） |
| @editorjs/quote | CDN | 引用 |
| @editorjs/delimiter | CDN | 区切り線 |
| @editorjs/warning | CDN | コールアウト |
| @editorjs/toggle-block | CDN | トグル |
| @editorjs/inline-code | CDN | インラインコード |
| @editorjs/marker | CDN | ハイライト |
| CSS変数 | - | テーマ管理 |

### 選定理由

- **Editor.js**: ブロックベース設計がNotionの概念に最も近い
- **CDNのみ**: ビルドステップ不要、Ideas Labの原則に合致
- **CSS変数**: カスタムテーマが主体のためTailwind不要

## ファイル構成

```
block-editor/
├── index.html                  ← HTML構造
├── assets/
│   ├── css/
│   │   └── editor.css          ← エディタースタイル
│   └── js/
│       ├── editor.js           ← メインエントリー
│       ├── config.js           ← Editor.jsツール設定
│       ├── storage.js          ← localStorage保存/読込
│       └── toolbar.js          ← カスタムツールバーUI
└── meta.json
```

## 機能一覧

### ブロックタイプ

| ブロック | プラグイン | 説明 |
|---|---|---|
| 段落 | 組み込み | デフォルトテキスト |
| 見出し | @editorjs/header | H1, H2, H3 |
| リスト | @editorjs/nested-list | 箇条書き・番号付き（ネスト対応） |
| コードブロック | @editorjs/code | シンタックスハイライトなし（シンプル） |
| テーブル | @editorjs/table | 行列追加可能 |
| 画像 | @editorjs/image | URL指定 or Base64エンコード |
| 引用 | @editorjs/quote | 引用テキスト |
| 区切り線 | @editorjs/delimiter | 水平線 |
| コールアウト | @editorjs/warning | 注意・情報ボックス |
| トグル | @editorjs/toggle-block | 折りたたみコンテンツ |

### インラインツール

- **太字** / *斜体* / `インラインコード` / ==ハイライト== / リンク

### データ管理

- localStorage自動保存（デバウンス付き）
- JSON エクスポート / インポート機能
- 新規ドキュメント作成

### UI

- Notionライクなミニマルデザイン
- ダークテーマ（CSS変数ベース）
- ブロック追加ボタン（`+`メニュー）
- サイドバーツールバー（エクスポート、インポート、クリア）
- レスポンシブ対応（モバイルでも編集可能）

## 実装フェーズ

### Phase 1: 基盤構築
1. ディレクトリ・ファイル作成
2. Editor.js + 基本プラグイン（段落、見出し、リスト）のCDN読み込み
3. 基本的なエディター初期化
4. ダークテーマCSS

### Phase 2: ブロック拡張
1. コードブロック、テーブル、引用、区切り線の追加
2. コールアウト（Warning）、トグルの追加
3. インラインツール（インラインコード、ハイライト）

### Phase 3: データ管理
1. localStorage自動保存（デバウンス 1秒）
2. JSONエクスポート機能
3. JSONインポート機能
4. 新規ドキュメント作成

### Phase 4: UI仕上げ
1. ヘッダー（タイトル + ツールバー）
2. レスポンシブ調整
3. meta.json作成
4. 動作確認

## 懸念点と対策

| 懸念 | 対策 |
|---|---|
| 画像ブロックのアップロード先がない（静的ホスティング） | Base64 or 外部URL貼り付けで対応 |
| Editor.jsプラグインのCDNバージョン互換性 | バージョンを固定（`@latest`は避ける） |
| モバイルでの編集体験 | Editor.jsのモバイル対応は比較的良好。CSS側で調整 |
| localStorageの容量制限（約5MB） | エクスポート機能でバックアップを促すUI |

## デザイン方針

- 背景: ダーク (`#191919` Notionダーク風)
- テキスト: `#e0e0e0`
- アクセント: `#37a0eb`（Notion風ブルー）
- フォント: システムフォント + Noto Sans JP
- エディター幅: max `720px`、中央寄せ（Notion風）
- ブロック間のスペーシング: ゆったりめ
