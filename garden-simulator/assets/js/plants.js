/* ========================================
   plants.js - 植物データ・画像生成モジュール
   ======================================== */

/**
 * 植物データ定義
 * Canvas APIで動的に描画するためのパラメータを持つ
 */
const PLANT_CATEGORIES = [
  { id: 'flower', name: '花' },
  { id: 'shrub', name: '低木' },
  { id: 'tree', name: '高木' },
  { id: 'ground', name: 'グラウンドカバー' },
  { id: 'structure', name: '構造物' },
];

const PLANTS = [
  // 花
  { id: 'rose', name: 'バラ', category: 'flower', baseHeight: 0.8, baseWidth: 0.6, color: '#e11d48', accent: '#be123c' },
  { id: 'tulip', name: 'チューリップ', category: 'flower', baseHeight: 0.5, baseWidth: 0.3, color: '#f97316', accent: '#ea580c' },
  { id: 'lavender', name: 'ラベンダー', category: 'flower', baseHeight: 0.6, baseWidth: 0.4, color: '#a855f7', accent: '#7c3aed' },
  { id: 'sunflower', name: 'ひまわり', category: 'flower', baseHeight: 1.2, baseWidth: 0.8, color: '#eab308', accent: '#ca8a04' },

  // 低木
  { id: 'azalea', name: 'ツツジ', category: 'shrub', baseHeight: 0.8, baseWidth: 1.0, color: '#ec4899', accent: '#be185d' },
  { id: 'hydrangea', name: 'アジサイ', category: 'shrub', baseHeight: 0.9, baseWidth: 1.0, color: '#6366f1', accent: '#818cf8' },
  { id: 'boxwood', name: 'ツゲ', category: 'shrub', baseHeight: 0.7, baseWidth: 0.8, color: '#16a34a', accent: '#15803d' },

  // 高木
  { id: 'pine', name: '松', category: 'tree', baseHeight: 2.0, baseWidth: 1.2, color: '#166534', accent: '#14532d' },
  { id: 'maple', name: 'モミジ', category: 'tree', baseHeight: 1.8, baseWidth: 1.5, color: '#dc2626', accent: '#b91c1c' },

  // グラウンドカバー
  { id: 'grass', name: '芝生', category: 'ground', baseHeight: 0.15, baseWidth: 1.0, color: '#22c55e', accent: '#16a34a' },
  { id: 'moss', name: '苔', category: 'ground', baseHeight: 0.1, baseWidth: 0.8, color: '#65a30d', accent: '#4d7c0f' },
  { id: 'clover', name: 'クローバー', category: 'ground', baseHeight: 0.15, baseWidth: 0.8, color: '#15803d', accent: '#14532d' },

  // 構造物
  { id: 'brick_border', name: 'レンガ花壇', category: 'structure', baseHeight: 0.3, baseWidth: 1.2, color: '#b45309', accent: '#92400e' },
  { id: 'stone', name: '石', category: 'structure', baseHeight: 0.4, baseWidth: 0.5, color: '#78716c', accent: '#57534e' },
  { id: 'lantern', name: '灯籠', category: 'structure', baseHeight: 1.0, baseWidth: 0.4, color: '#a8a29e', accent: '#78716c' },
];

/**
 * Canvas APIで植物のプレビュー画像を生成
 * @param {object} plant 植物データ
 * @param {number} size キャンバスサイズ（正方形）
 * @returns {HTMLCanvasElement}
 */
function generatePlantImage(plant, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const bottom = size * 0.95;

  switch (plant.category) {
    case 'flower':
      drawFlower(ctx, plant, cx, bottom, size);
      break;
    case 'shrub':
      drawShrub(ctx, plant, cx, bottom, size);
      break;
    case 'tree':
      drawTree(ctx, plant, cx, bottom, size);
      break;
    case 'ground':
      drawGround(ctx, plant, cx, bottom, size);
      break;
    case 'structure':
      drawStructure(ctx, plant, cx, bottom, size);
      break;
  }

  return canvas;
}

/** 花を描画 */
function drawFlower(ctx, plant, cx, bottom, size) {
  const stemH = size * 0.5;
  const flowerR = size * 0.18;

  // 茎
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = size * 0.03;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, bottom);
  ctx.quadraticCurveTo(cx + size * 0.05, bottom - stemH * 0.5, cx, bottom - stemH);
  ctx.stroke();

  // 葉
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.08, bottom - stemH * 0.4, size * 0.08, size * 0.04, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // 花びら
  const petalCount = plant.id === 'sunflower' ? 12 : 5;
  const flowerY = bottom - stemH;
  ctx.fillStyle = plant.color;
  for (let i = 0; i < petalCount; i++) {
    const angle = (Math.PI * 2 / petalCount) * i;
    const px = cx + Math.cos(angle) * flowerR * 0.6;
    const py = flowerY + Math.sin(angle) * flowerR * 0.6;
    ctx.beginPath();
    ctx.ellipse(px, py, flowerR * 0.5, flowerR * 0.3, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  // 花芯
  ctx.fillStyle = plant.accent;
  ctx.beginPath();
  ctx.arc(cx, flowerY, flowerR * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/** 低木を描画 */
function drawShrub(ctx, plant, cx, bottom, size) {
  const w = size * 0.7;
  const h = size * 0.5;
  const top = bottom - h;

  // 本体（丸い葉の塊）
  ctx.fillStyle = plant.color;
  ctx.beginPath();
  ctx.ellipse(cx, bottom - h * 0.5, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ハイライト
  ctx.fillStyle = plant.accent;
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.15, top + h * 0.3, w * 0.25, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 花（ツツジ・アジサイ）
  if (plant.id === 'azalea' || plant.id === 'hydrangea') {
    const dotColor = plant.id === 'azalea' ? '#fda4af' : '#c4b5fd';
    ctx.fillStyle = dotColor;
    const dots = [
      [cx - w * 0.2, top + h * 0.25],
      [cx + w * 0.1, top + h * 0.15],
      [cx + w * 0.25, top + h * 0.35],
      [cx - w * 0.05, top + h * 0.45],
    ];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(dx, dy, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 高木を描画 */
function drawTree(ctx, plant, cx, bottom, size) {
  const trunkH = size * 0.3;
  const crownH = size * 0.55;
  const crownW = size * 0.6;
  const crownBottom = bottom - trunkH;

  // 幹
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.04, bottom);
  ctx.lineTo(cx - size * 0.03, crownBottom);
  ctx.lineTo(cx + size * 0.03, crownBottom);
  ctx.lineTo(cx + size * 0.04, bottom);
  ctx.closePath();
  ctx.fill();

  if (plant.id === 'pine') {
    // 松は三角形の重なり
    ctx.fillStyle = plant.color;
    for (let i = 0; i < 3; i++) {
      const layerBottom = crownBottom - i * crownH * 0.2;
      const layerTop = layerBottom - crownH * 0.35;
      const layerW = crownW * (1 - i * 0.2) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, layerTop);
      ctx.lineTo(cx - layerW, layerBottom);
      ctx.lineTo(cx + layerW, layerBottom);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // モミジは丸い樹冠
    ctx.fillStyle = plant.color;
    ctx.beginPath();
    ctx.ellipse(cx, crownBottom - crownH * 0.4, crownW * 0.5, crownH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = plant.accent;
    ctx.beginPath();
    ctx.ellipse(cx - crownW * 0.15, crownBottom - crownH * 0.5, crownW * 0.25, crownH * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** グラウンドカバーを描画 */
function drawGround(ctx, plant, cx, bottom, size) {
  const w = size * 0.7;
  const h = size * 0.15;
  const y = bottom - h;

  // ベース
  ctx.fillStyle = plant.color;
  ctx.beginPath();
  ctx.ellipse(cx, y, w * 0.5, h, 0, 0, Math.PI * 2);
  ctx.fill();

  // テクスチャ
  ctx.fillStyle = plant.accent;
  for (let i = 0; i < 8; i++) {
    const dx = cx + (Math.random() - 0.5) * w * 0.7;
    const dy = y + (Math.random() - 0.5) * h * 0.8;
    ctx.beginPath();
    ctx.arc(dx, dy, size * 0.015, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 構造物を描画 */
function drawStructure(ctx, plant, cx, bottom, size) {
  if (plant.id === 'brick_border') {
    // レンガ花壇
    const w = size * 0.7;
    const h = size * 0.25;
    ctx.fillStyle = plant.color;
    ctx.fillRect(cx - w / 2, bottom - h, w, h);

    // レンガ線
    ctx.strokeStyle = plant.accent;
    ctx.lineWidth = 1;
    const rows = 3;
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const ry = bottom - h + r * rowH;
      ctx.strokeRect(cx - w / 2, ry, w, rowH);
      // レンガの縦線
      const cols = r % 2 === 0 ? 4 : 3;
      const colW = w / cols;
      for (let c = 1; c < cols; c++) {
        const rx = cx - w / 2 + c * colW + (r % 2 === 0 ? 0 : colW / 2);
        if (rx < cx + w / 2) {
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, ry + rowH);
          ctx.stroke();
        }
      }
    }
  } else if (plant.id === 'stone') {
    // 石
    ctx.fillStyle = plant.color;
    ctx.beginPath();
    ctx.ellipse(cx, bottom - size * 0.15, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = plant.accent;
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.05, bottom - size * 0.2, size * 0.08, size * 0.06, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (plant.id === 'lantern') {
    // 灯籠
    const lw = size * 0.15;
    const lh = size * 0.6;
    const top = bottom - lh;

    // 台座
    ctx.fillStyle = plant.accent;
    ctx.fillRect(cx - lw * 0.8, bottom - lh * 0.1, lw * 1.6, lh * 0.1);

    // 柱
    ctx.fillStyle = plant.color;
    ctx.fillRect(cx - lw * 0.3, bottom - lh * 0.7, lw * 0.6, lh * 0.6);

    // 火袋
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - lw * 0.6, top + lh * 0.15, lw * 1.2, lh * 0.2);

    // 笠
    ctx.fillStyle = plant.accent;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx - lw, top + lh * 0.15);
    ctx.lineTo(cx + lw, top + lh * 0.15);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * パレット用の小さなプレビュー画像を生成
 * @param {object} plant
 * @returns {HTMLCanvasElement}
 */
function generatePlantPreview(plant) {
  return generatePlantImage(plant, 64);
}

/**
 * Three.jsのテクスチャ用の大きな画像を生成
 * @param {object} plant
 * @returns {HTMLCanvasElement}
 */
function generatePlantTexture(plant) {
  return generatePlantImage(plant, 256);
}

/**
 * IDから植物データを検索
 * @param {string} id
 * @returns {object|undefined}
 */
function getPlantById(id) {
  return PLANTS.find((p) => p.id === id);
}

/**
 * カテゴリで植物をフィルタ
 * @param {string} categoryId
 * @returns {object[]}
 */
function getPlantsByCategory(categoryId) {
  return PLANTS.filter((p) => p.category === categoryId);
}

// グローバルエクスポート
window.PlantData = {
  PLANT_CATEGORIES,
  PLANTS,
  generatePlantImage,
  generatePlantPreview,
  generatePlantTexture,
  getPlantById,
  getPlantsByCategory,
};
