/* ========================================
   Editor.js ツール設定
   ======================================== */

/**
 * Editor.jsのツール構成を返す
 * 各プラグインはグローバル変数として読み込み済みの前提
 */
export function createToolsConfig() {
  const tools = {};

  // 見出し（H1-H3）
  if (window.Header) {
    tools.header = {
      class: window.Header,
      inlineToolbar: true,
      config: {
        placeholder: '見出しを入力...',
        levels: [1, 2, 3],
        defaultLevel: 2
      }
    };
  }

  // ネストリスト（箇条書き・番号付き）
  if (window.NestedList) {
    tools.list = {
      class: window.NestedList,
      inlineToolbar: true,
      config: {
        defaultStyle: 'unordered'
      }
    };
  }

  // コードブロック
  if (window.CodeTool) {
    tools.code = {
      class: window.CodeTool,
      config: {
        placeholder: 'コードを入力...'
      }
    };
  }

  // テーブル
  if (window.Table) {
    tools.table = {
      class: window.Table,
      inlineToolbar: true,
      config: {
        rows: 2,
        cols: 3
      }
    };
  }

  // 画像（URL入力 or Base64）
  if (window.ImageTool) {
    tools.image = {
      class: window.ImageTool,
      config: {
        // サーバーなしのためURL入力のみ
        endpoints: {
          byFile: '',
          byUrl: ''
        },
        // URL入力で画像を埋め込む
        uploader: {
          uploadByUrl(url) {
            return Promise.resolve({
              success: 1,
              file: { url }
            });
          },
          uploadByFile(file) {
            // Base64変換
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  success: 1,
                  file: { url: e.target.result }
                });
              };
              reader.readAsDataURL(file);
            });
          }
        }
      }
    };
  }

  // 引用
  if (window.Quote) {
    tools.quote = {
      class: window.Quote,
      inlineToolbar: true,
      config: {
        quotePlaceholder: '引用テキスト...',
        captionPlaceholder: '引用元...'
      }
    };
  }

  // 区切り線
  if (window.Delimiter) {
    tools.delimiter = {
      class: window.Delimiter
    };
  }

  // コールアウト（Warning）
  if (window.Warning) {
    tools.warning = {
      class: window.Warning,
      inlineToolbar: true,
      config: {
        titlePlaceholder: 'タイトル',
        messagePlaceholder: 'メッセージ'
      }
    };
  }

  // トグル
  if (window.ToggleBlock) {
    tools.toggle = {
      class: window.ToggleBlock,
      inlineToolbar: true
    };
  }

  // インラインコード
  if (window.InlineCode) {
    tools.inlineCode = {
      class: window.InlineCode
    };
  }

  // マーカー（ハイライト）
  if (window.Marker) {
    tools.marker = {
      class: window.Marker
    };
  }

  return tools;
}

/**
 * 初期データ（サンプルコンテンツ付き）
 */
export const INITIAL_DATA = {
  time: Date.now(),
  blocks: [
    {
      type: 'header',
      data: {
        text: 'Block Editor へようこそ',
        level: 1
      }
    },
    {
      type: 'paragraph',
      data: {
        text: 'Notionライクなブロックエディターです。テキストを選択してインラインツールを使ったり、<code class="inline-code">+</code> ボタンからブロックを追加できます。'
      }
    },
    {
      type: 'header',
      data: {
        text: '対応ブロック',
        level: 2
      }
    },
    {
      type: 'list',
      data: {
        style: 'unordered',
        items: [
          { content: '見出し（H1〜H3）', items: [] },
          { content: 'リスト（箇条書き・番号付き・ネスト対応）', items: [] },
          { content: 'コードブロック', items: [] },
          { content: 'テーブル', items: [] },
          { content: '画像（URL入力 / ファイルアップロード）', items: [] },
          { content: '引用・区切り線・コールアウト・トグル', items: [] }
        ]
      }
    },
    {
      type: 'header',
      data: {
        text: 'コードブロックの例',
        level: 2
      }
    },
    {
      type: 'code',
      data: {
        code: 'const editor = new EditorJS({\n  holder: "editor",\n  tools: { /* ... */ }\n});'
      }
    },
    {
      type: 'header',
      data: {
        text: '引用',
        level: 2
      }
    },
    {
      type: 'quote',
      data: {
        text: 'シンプルであることは、複雑であることよりも難しい。',
        caption: 'Steve Jobs',
        alignment: 'left'
      }
    },
    {
      type: 'delimiter',
      data: {}
    },
    {
      type: 'header',
      data: {
        text: 'テーブル',
        level: 2
      }
    },
    {
      type: 'table',
      data: {
        withHeadings: true,
        content: [
          ['機能', '説明', 'ショートカット'],
          ['太字', 'テキストを太字に', 'Ctrl+B'],
          ['斜体', 'テキストを斜体に', 'Ctrl+I'],
          ['リンク', 'URLを挿入', 'Ctrl+K']
        ]
      }
    },
    {
      type: 'warning',
      data: {
        title: 'ヒント',
        message: 'エディターの内容は自動的にブラウザに保存されます。右上のボタンからJSONエクスポート・インポートも可能です。'
      }
    },
    {
      type: 'paragraph',
      data: {
        text: '自由に編集してお試しください。'
      }
    }
  ],
  version: '2.31.3'
};
