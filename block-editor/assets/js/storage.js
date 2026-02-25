/* ========================================
   localStorage 保存/読込管理
   ======================================== */

const STORAGE_KEY = 'block-editor-data';
const DEBOUNCE_MS = 1000;

let saveTimer = null;
let onStatusChange = null;

/**
 * ステータス変更コールバックを設定
 * @param {(status: 'saving' | 'saved' | 'idle') => void} callback
 */
export function setStatusCallback(callback) {
  onStatusChange = callback;
}

/**
 * 保存データの読み込み
 * @returns {object|null} Editor.jsのデータ形式、保存なしならnull
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * データを即座に保存
 * @param {object} data - Editor.jsのデータ
 */
function saveImmediate(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (onStatusChange) onStatusChange('saved');
  } catch (e) {
    console.error('保存に失敗:', e);
  }
}

/**
 * デバウンス付き保存
 * @param {object} data - Editor.jsのデータ
 */
export function save(data) {
  if (onStatusChange) onStatusChange('saving');

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveImmediate(data);
    saveTimer = null;
  }, DEBOUNCE_MS);
}

/**
 * 保存データのクリア
 */
export function clear() {
  localStorage.removeItem(STORAGE_KEY);
  if (onStatusChange) onStatusChange('idle');
}

/**
 * データをJSON文字列としてエクスポート
 * @param {object} data - Editor.jsのデータ
 * @returns {string} JSON文字列
 */
export function exportJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * JSON文字列からデータをインポート
 * @param {string} jsonStr - JSON文字列
 * @returns {object} パース済みデータ
 * @throws {Error} パース失敗時
 */
export function importJSON(jsonStr) {
  const data = JSON.parse(jsonStr);

  // 最低限のバリデーション
  if (!data || !Array.isArray(data.blocks)) {
    throw new Error('無効なEditor.jsデータ形式です');
  }

  return data;
}
