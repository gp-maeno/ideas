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
 * 初期データ（空のエディター用）
 */
export const INITIAL_DATA = {
  time: Date.now(),
  blocks: [
    {
      type: 'header',
      data: {
        text: '',
        level: 1
      }
    },
    {
      type: 'paragraph',
      data: {
        text: ''
      }
    }
  ],
  version: '2.31.3'
};
