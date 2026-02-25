/* ========================================
   Block Editor - メインエントリー
   ======================================== */

import { createToolsConfig, INITIAL_DATA } from './config.js';
import { load, save, clear, setStatusCallback, exportJSON, importJSON } from './storage.js';
import { initToolbar, updateSaveStatus, showModal, showToast } from './toolbar.js';

let editor = null;

/**
 * エディターを初期化
 * @param {object|null} data - 初期データ（nullなら空のエディター）
 */
async function initEditor(data) {
  // 既存のエディターがあれば破棄
  if (editor) {
    await editor.destroy();
    editor = null;
  }

  const tools = createToolsConfig();
  const initialData = data || INITIAL_DATA;

  editor = new window.EditorJS({
    holder: 'editor',
    tools,
    data: initialData,
    placeholder: 'ここに書き始める...',
    autofocus: true,
    onChange: handleChange,
    i18n: {
      messages: {
        ui: {
          blockTunes: {
            toggler: {
              'Click to tune': 'ブロック設定',
              'or drag to move': 'ドラッグで移動'
            }
          },
          inlineToolbar: {
            converter: {
              'Convert to': '変換'
            }
          },
          toolbar: {
            toolbox: {
              Add: '追加',
              Filter: '検索'
            }
          },
          popover: {
            Filter: '検索',
            'Nothing found': '見つかりません',
            'Convert to': '変換'
          }
        },
        toolNames: {
          Text: 'テキスト',
          Heading: '見出し',
          List: 'リスト',
          Code: 'コード',
          Table: 'テーブル',
          Image: '画像',
          Quote: '引用',
          Delimiter: '区切り線',
          Warning: 'コールアウト',
          Toggle: 'トグル',
          Bold: '太字',
          Italic: '斜体',
          Link: 'リンク',
          InlineCode: 'インラインコード',
          Marker: 'ハイライト'
        },
        blockTunes: {
          delete: {
            Delete: '削除',
            'Click to delete': 'クリックで削除'
          },
          moveUp: {
            'Move up': '上に移動'
          },
          moveDown: {
            'Move down': '下に移動'
          }
        }
      }
    }
  });

  await editor.isReady;
}

/**
 * エディター変更時のハンドラ
 */
async function handleChange() {
  if (!editor) return;
  try {
    const data = await editor.save();
    save(data);
  } catch (e) {
    console.error('データ保存エラー:', e);
  }
}

/**
 * JSONエクスポート
 */
async function handleExport() {
  if (!editor) return;
  try {
    const data = await editor.save();
    const json = exportJSON(data);
    await showModal('JSON エクスポート', json, {
      readonly: true,
      confirmLabel: 'コピー'
    });
    // クリップボードにコピー
    await navigator.clipboard.writeText(json);
    showToast('クリップボードにコピーしました');
  } catch (e) {
    showToast('エクスポートに失敗しました', 'error');
  }
}

/**
 * JSONインポート
 */
async function handleImport() {
  const json = await showModal('JSON インポート', '', {
    readonly: false,
    confirmLabel: 'インポート'
  });

  if (json === null) return;

  try {
    const data = importJSON(json);
    await initEditor(data);
    save(data);
    showToast('インポートしました');
  } catch (e) {
    showToast('無効なJSON形式です', 'error');
  }
}

/**
 * 新規ドキュメント作成
 */
async function handleNew() {
  // 確認ダイアログ
  const result = await showModal(
    '新規ドキュメント',
    '現在の内容をクリアして新しいドキュメントを作成しますか？\nこの操作は元に戻せません。',
    {
      readonly: true,
      confirmLabel: '作成'
    }
  );

  if (result === null) return;

  clear();
  await initEditor(null);
  showToast('新しいドキュメントを作成しました');
}

/**
 * アプリケーション起動
 */
async function main() {
  // 保存ステータスのコールバック設定
  setStatusCallback(updateSaveStatus);

  // ツールバーの初期化
  initToolbar({
    onExport: handleExport,
    onImport: handleImport,
    onNew: handleNew
  });

  // 保存データがあれば読み込み
  const savedData = load();
  await initEditor(savedData);

  updateSaveStatus(savedData ? 'saved' : 'idle');
}

// DOM読み込み完了後に起動
document.addEventListener('DOMContentLoaded', main);
