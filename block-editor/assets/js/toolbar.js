/* ========================================
   ツールバーUI操作
   ======================================== */

/**
 * ツールバーを初期化
 * @param {object} params
 * @param {() => Promise<void>} params.onExport - エクスポートボタン押下時
 * @param {() => void} params.onImport - インポートボタン押下時
 * @param {() => void} params.onNew - 新規作成ボタン押下時
 */
export function initToolbar({ onExport, onImport, onNew }) {
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const btnNew = document.getElementById('btn-new');

  if (btnExport) btnExport.addEventListener('click', onExport);
  if (btnImport) btnImport.addEventListener('click', onImport);
  if (btnNew) btnNew.addEventListener('click', onNew);
}

/**
 * 保存ステータスを更新
 * @param {'saving' | 'saved' | 'idle'} status
 */
export function updateSaveStatus(status) {
  const el = document.getElementById('save-status');
  if (!el) return;

  el.classList.remove('saving', 'saved');

  switch (status) {
    case 'saving':
      el.textContent = '保存中...';
      el.classList.add('saving');
      break;
    case 'saved':
      el.textContent = '保存済み';
      el.classList.add('saved');
      break;
    default:
      el.textContent = '';
  }
}

/**
 * モーダルを表示
 * @param {string} title - モーダルタイトル
 * @param {string} content - テキストエリアの内容（空文字で空欄）
 * @param {object} options
 * @param {boolean} [options.readonly=false] - 読み取り専用
 * @param {string} [options.confirmLabel='OK'] - 確認ボタンのラベル
 * @returns {Promise<string|null>} テキストエリアの内容、キャンセルならnull
 */
export function showModal(title, content, options = {}) {
  const { readonly = false, confirmLabel = 'OK' } = options;

  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const textarea = document.getElementById('modal-textarea');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');

    modalTitle.textContent = title;
    textarea.value = content;
    textarea.readOnly = readonly;
    btnConfirm.textContent = confirmLabel;

    overlay.classList.add('active');

    const cleanup = () => {
      overlay.classList.remove('active');
      btnConfirm.removeEventListener('click', handleConfirm);
      btnCancel.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlayClick);
    };

    const handleConfirm = () => {
      const value = textarea.value;
      cleanup();
      resolve(value);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const handleOverlayClick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    };

    btnConfirm.addEventListener('click', handleConfirm);
    btnCancel.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);

    // 読み取り専用でなければテキストエリアにフォーカス
    if (!readonly) {
      setTimeout(() => textarea.focus(), 100);
    }
  });
}

/**
 * トースト通知を表示
 * @param {string} message - 通知メッセージ
 * @param {'success' | 'error'} [type='success'] - 通知タイプ
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // アニメーション表示
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // 3秒後に消去
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
