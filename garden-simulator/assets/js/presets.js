/* ========================================
   presets.js - プリセットパターン定義
   ======================================== */

/**
 * ガーデニングプリセット
 * x, y はスクリーン座標の割合（0=左/上, 1=右/下）
 */
const PRESETS = [
  {
    id: 'japanese',
    name: '和風',
    description: '松・苔・石の落ち着いた日本庭園',
    icon: 'japanese',
    placements: [
      { plantId: 'pine', x: 0.35, y: 0.45 },
      { plantId: 'maple', x: 0.65, y: 0.5 },
      { plantId: 'moss', x: 0.3, y: 0.7 },
      { plantId: 'moss', x: 0.55, y: 0.72 },
      { plantId: 'stone', x: 0.45, y: 0.68 },
      { plantId: 'stone', x: 0.7, y: 0.65 },
      { plantId: 'lantern', x: 0.25, y: 0.55 },
    ],
  },
  {
    id: 'european',
    name: '洋風',
    description: 'バラとレンガの華やかな花壇',
    icon: 'european',
    placements: [
      { plantId: 'brick_border', x: 0.5, y: 0.7 },
      { plantId: 'rose', x: 0.35, y: 0.55 },
      { plantId: 'rose', x: 0.5, y: 0.52 },
      { plantId: 'rose', x: 0.65, y: 0.55 },
      { plantId: 'lavender', x: 0.3, y: 0.62 },
      { plantId: 'lavender', x: 0.7, y: 0.62 },
      { plantId: 'boxwood', x: 0.25, y: 0.5 },
      { plantId: 'boxwood', x: 0.75, y: 0.5 },
    ],
  },
  {
    id: 'natural',
    name: 'ナチュラル',
    description: '野草とグラスの自然な庭',
    icon: 'natural',
    placements: [
      { plantId: 'grass', x: 0.4, y: 0.75 },
      { plantId: 'grass', x: 0.6, y: 0.73 },
      { plantId: 'clover', x: 0.3, y: 0.7 },
      { plantId: 'lavender', x: 0.45, y: 0.55 },
      { plantId: 'hydrangea', x: 0.6, y: 0.5 },
      { plantId: 'azalea', x: 0.35, y: 0.48 },
      { plantId: 'stone', x: 0.55, y: 0.65 },
    ],
  },
  {
    id: 'colorful',
    name: 'カラフル',
    description: '季節の花を集めた華やかな花壇',
    icon: 'colorful',
    placements: [
      { plantId: 'sunflower', x: 0.5, y: 0.45 },
      { plantId: 'tulip', x: 0.3, y: 0.6 },
      { plantId: 'tulip', x: 0.45, y: 0.58 },
      { plantId: 'rose', x: 0.6, y: 0.55 },
      { plantId: 'lavender', x: 0.7, y: 0.6 },
      { plantId: 'azalea', x: 0.35, y: 0.5 },
      { plantId: 'hydrangea', x: 0.65, y: 0.48 },
      { plantId: 'brick_border', x: 0.5, y: 0.72 },
    ],
  },
];

/**
 * プリセットのプレビューアイコンをCanvas描画
 * @param {string} presetIcon プリセットのアイコンID
 * @param {number} size
 * @returns {HTMLCanvasElement}
 */
function generatePresetIcon(presetIcon, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;

  // 背景円
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  switch (presetIcon) {
    case 'japanese':
      // 松の木のシルエット
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.6);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.2);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.2);
      ctx.closePath();
      ctx.fill();
      // 石
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.3, cy + r * 0.5, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'european':
      // バラ
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      // レンガ
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - r * 0.6, cy + r * 0.3, r * 1.2, r * 0.25);
      break;

    case 'natural':
      // 草
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.2, r * 0.6, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      // 小さな花
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(cx + r * 0.2, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'colorful':
      // カラフルな花々
      const colors = ['#e11d48', '#f97316', '#eab308', '#a855f7', '#6366f1'];
      const positions = [
        [-0.2, -0.3], [0.2, -0.2], [0, 0.1], [-0.3, 0.1], [0.3, 0]
      ];
      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(cx + positions[i][0] * r, cy + positions[i][1] * r, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }

  return canvas;
}

// グローバルエクスポート
window.PresetData = {
  PRESETS,
  generatePresetIcon,
};
