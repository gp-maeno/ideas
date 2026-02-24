/**
 * Claude Avatar Generator
 * ピクセルマップベースのキャラクター描画 + パーツカスタマイズ
 */

/* ===========================
   定数・設定
   =========================== */

// デフォルトカラー
const DEFAULT_COLORS = {
  body: '#c07850',
  eye: '#1a1a1a',
  background: '#1a1a2e'
};

// 背景プリセットカラー
const BG_PRESETS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d4a3e', '#1a3a1a', '#3a1a1a', '#1a2a3a',
  '#2e1a2e', '#3d3d3d', '#f0e6d3', '#ffffff'
];

// 体色プリセットカラー
const BODY_PRESETS = [
  '#c07850', '#d4956a', '#a0522d', '#e8b88a',
  '#8b6f47', '#f4c794', '#cd853f', '#deb887',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dda0dd', '#ff8c42', '#98d8c8'
];

// 目色プリセットカラー
const EYE_PRESETS = [
  '#1a1a1a', '#ffffff', '#ff4444', '#4488ff',
  '#44dd44', '#ffaa00', '#ff44ff', '#44ffff'
];

/* ===========================
   ベースボディ定義
   =========================== */

/**
 * キャラクターの体のみ（目は表情システムで管理）
 * 0 = 透明, 1 = 体色
 */
const BASE_BODY = [
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 0: 体上端
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 1
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // row 2: 手
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // row 3: 手
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 4
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 5
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 6: 体下端
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0], // row 7: 足上
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0], // row 8: 足下
];

const MAP_COLS = BASE_BODY[0].length; // 19
const MAP_ROWS = BASE_BODY.length;    // 9

// パーツ描画スペース確保のための余白
const PAD_TOP = 4;
const PAD_BOTTOM = 1;
const PAD_LEFT = 3;
const PAD_RIGHT = 4;
const VIEW_W = MAP_COLS + PAD_LEFT + PAD_RIGHT; // 26
const VIEW_H = MAP_ROWS + PAD_TOP + PAD_BOTTOM; // 14

/* ===========================
   表情（目の形状バリエーション）
   =========================== */

const EXPRESSIONS = {
  default: {
    label: 'デフォルト',
    pixels: [
      { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 13, y: 2 }, { x: 13, y: 3 },
    ]
  },
  smile: {
    label: 'にっこり',
    pixels: [
      // 左目 ^
      { x: 4, y: 2 }, { x: 6, y: 2 },
      { x: 5, y: 3 },
      // 右目 ^
      { x: 12, y: 2 }, { x: 14, y: 2 },
      { x: 13, y: 3 },
    ]
  },
  surprise: {
    label: 'びっくり',
    pixels: [
      // 左目 O
      { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
      { x: 4, y: 2 }, { x: 6, y: 2 },
      { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
      // 右目 O
      { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 },
      { x: 12, y: 2 }, { x: 14, y: 2 },
      { x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 },
    ]
  },
  wink: {
    label: 'ウインク',
    pixels: [
      // 左目 −（閉じ）
      { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
      // 右目（通常）
      { x: 13, y: 2 }, { x: 13, y: 3 },
    ]
  },
  heart: {
    label: 'ハート目',
    pixels: [
      // 左ハート
      { x: 4, y: 1 }, { x: 6, y: 1 },
      { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 },
      { x: 5, y: 3 },
      // 右ハート
      { x: 12, y: 1 }, { x: 14, y: 1 },
      { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 14, y: 2 },
      { x: 13, y: 3 },
    ]
  },
  sparkle: {
    label: 'キラキラ',
    pixels: [
      // 左 ✦
      { x: 5, y: 1 },
      { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 },
      { x: 5, y: 3 },
      // 右 ✦
      { x: 13, y: 1 },
      { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 14, y: 2 },
      { x: 13, y: 3 },
    ]
  },
};

/* ===========================
   被り物パーツ
   =========================== */

const HEADWEAR = {
  none: { label: 'なし', pixels: [] },
  crown: {
    label: '王冠',
    pixels: [
      // 王冠の尖り
      { x: 5, y: -2, fill: '#ffd700' },
      { x: 9, y: -3, fill: '#ffd700' },
      { x: 13, y: -2, fill: '#ffd700' },
      // バンド
      { x: 4, y: -1, fill: '#ffd700' }, { x: 5, y: -1, fill: '#ffd700' },
      { x: 6, y: -1, fill: '#ffd700' }, { x: 7, y: -1, fill: '#ff4444' },
      { x: 8, y: -1, fill: '#ffd700' }, { x: 9, y: -1, fill: '#ffd700' },
      { x: 10, y: -1, fill: '#ffd700' }, { x: 11, y: -1, fill: '#4488ff' },
      { x: 12, y: -1, fill: '#ffd700' }, { x: 13, y: -1, fill: '#ffd700' },
      { x: 14, y: -1, fill: '#ffd700' },
    ]
  },
  partyHat: {
    label: 'パーティーハット',
    pixels: [
      { x: 9, y: -3, fill: '#ffdd00' },
      { x: 8, y: -2, fill: '#ff4466' }, { x: 9, y: -2, fill: '#44bbff' },
      { x: 10, y: -2, fill: '#ff4466' },
      { x: 7, y: -1, fill: '#ff4466' }, { x: 8, y: -1, fill: '#44bbff' },
      { x: 9, y: -1, fill: '#ff4466' }, { x: 10, y: -1, fill: '#44bbff' },
      { x: 11, y: -1, fill: '#ff4466' },
    ]
  },
  catEars: {
    label: '猫耳',
    pixels: [
      // 左耳
      { x: 4, y: -2, fill: '_body' },
      { x: 3, y: -1, fill: '_body' }, { x: 4, y: -1, fill: '#ffaaaa' },
      { x: 5, y: -1, fill: '_body' },
      // 右耳
      { x: 14, y: -2, fill: '_body' },
      { x: 13, y: -1, fill: '_body' }, { x: 14, y: -1, fill: '#ffaaaa' },
      { x: 15, y: -1, fill: '_body' },
    ]
  },
  beanie: {
    label: 'ニット帽',
    pixels: [
      // ポンポン
      { x: 9, y: -3, fill: '#ffffff' },
      // 帽子本体
      ...Array.from({ length: 13 }, (_, i) => ({
        x: 3 + i, y: -2, fill: '#ff6b6b'
      })),
      // ボーダー柄のブリム
      ...Array.from({ length: 13 }, (_, i) => ({
        x: 3 + i, y: -1, fill: i % 2 === 0 ? '#ff6b6b' : '#ffffff'
      })),
    ]
  },
  headphones: {
    label: 'ヘッドホン',
    pixels: [
      // ヘッドバンド
      ...Array.from({ length: 13 }, (_, i) => ({
        x: 3 + i, y: -1, fill: '#555555'
      })),
      // 左右の接続
      { x: 2, y: 0, fill: '#555555' }, { x: 16, y: 0, fill: '#555555' },
      // 左イヤーカップ
      { x: 1, y: 1, fill: '#555555' }, { x: 1, y: 2, fill: '#333333' },
      // 右イヤーカップ
      { x: 17, y: 1, fill: '#555555' }, { x: 17, y: 2, fill: '#333333' },
    ]
  },
  hackerHood: {
    label: 'フード',
    pixels: [
      // フード上部
      ...Array.from({ length: 11 }, (_, i) => ({
        x: 4 + i, y: -2, fill: '#2a2a3a'
      })),
      // フード前面
      ...Array.from({ length: 15 }, (_, i) => ({
        x: 2 + i, y: -1, fill: '#2a2a3a'
      })),
      // フード側面
      { x: 1, y: 0, fill: '#2a2a3a' }, { x: 1, y: 1, fill: '#2a2a3a' },
      { x: 17, y: 0, fill: '#2a2a3a' }, { x: 17, y: 1, fill: '#2a2a3a' },
    ]
  },
};

/* ===========================
   アクセサリーパーツ
   =========================== */

const ACCESSORIES = {
  none: { label: 'なし', pixels: [] },
  glasses: {
    label: 'メガネ',
    pixels: [
      // 左レンズ上下フレーム
      { x: 4, y: 1, fill: '#888888' }, { x: 5, y: 1, fill: '#888888' },
      { x: 6, y: 1, fill: '#888888' },
      { x: 4, y: 4, fill: '#888888' }, { x: 5, y: 4, fill: '#888888' },
      { x: 6, y: 4, fill: '#888888' },
      // ブリッジ
      { x: 7, y: 2, fill: '#888888' }, { x: 8, y: 2, fill: '#888888' },
      { x: 10, y: 2, fill: '#888888' }, { x: 11, y: 2, fill: '#888888' },
      // 右レンズ上下フレーム
      { x: 12, y: 1, fill: '#888888' }, { x: 13, y: 1, fill: '#888888' },
      { x: 14, y: 1, fill: '#888888' },
      { x: 12, y: 4, fill: '#888888' }, { x: 13, y: 4, fill: '#888888' },
      { x: 14, y: 4, fill: '#888888' },
    ]
  },
  sunglasses: {
    label: 'サングラス',
    pixels: [
      // 左レンズ（塗りつぶし）
      { x: 4, y: 1, fill: '#222222' }, { x: 5, y: 1, fill: '#222222' },
      { x: 6, y: 1, fill: '#222222' },
      { x: 4, y: 2, fill: '#111111' }, { x: 5, y: 2, fill: '#111111' },
      { x: 6, y: 2, fill: '#111111' },
      { x: 4, y: 3, fill: '#111111' }, { x: 5, y: 3, fill: '#111111' },
      { x: 6, y: 3, fill: '#111111' },
      // ブリッジ
      { x: 7, y: 2, fill: '#222222' }, { x: 8, y: 2, fill: '#222222' },
      { x: 10, y: 2, fill: '#222222' }, { x: 11, y: 2, fill: '#222222' },
      // 右レンズ
      { x: 12, y: 1, fill: '#222222' }, { x: 13, y: 1, fill: '#222222' },
      { x: 14, y: 1, fill: '#222222' },
      { x: 12, y: 2, fill: '#111111' }, { x: 13, y: 2, fill: '#111111' },
      { x: 14, y: 2, fill: '#111111' },
      { x: 12, y: 3, fill: '#111111' }, { x: 13, y: 3, fill: '#111111' },
      { x: 14, y: 3, fill: '#111111' },
    ]
  },
  mask: {
    label: 'マスク',
    pixels: [
      ...Array.from({ length: 11 }, (_, i) => ({
        x: 4 + i, y: 4, fill: '#ffffff'
      })),
      ...Array.from({ length: 11 }, (_, i) => ({
        x: 4 + i, y: 5, fill: '#eeeeee'
      })),
    ]
  },
  blush: {
    label: 'ほっぺ',
    pixels: [
      { x: 3, y: 3, fill: '#ff8888' }, { x: 3, y: 4, fill: '#ff8888' },
      { x: 15, y: 3, fill: '#ff8888' }, { x: 15, y: 4, fill: '#ff8888' },
    ]
  },
  scarf: {
    label: 'マフラー',
    pixels: [
      // バンド（体下端を覆う）
      ...Array.from({ length: 13 }, (_, i) => ({
        x: 3 + i, y: 6, fill: '#ff4466'
      })),
      // 垂れ下がり部分（足の間に配置）
      { x: 8, y: 7, fill: '#ff4466' }, { x: 9, y: 7, fill: '#ff4466' },
      { x: 8, y: 8, fill: '#dd3355' }, { x: 9, y: 8, fill: '#dd3355' },
    ]
  },
};

/* ===========================
   持ち物パーツ
   =========================== */

const ITEMS = {
  none: { label: 'なし', pixels: [] },
  coffee: {
    label: 'コーヒー',
    pixels: [
      // 湯気
      { x: 17, y: 1, fill: 'rgba(255,255,255,0.4)' },
      // カップ
      { x: 17, y: 2, fill: '#ffffff' }, { x: 18, y: 2, fill: '#ffffff' },
      { x: 17, y: 3, fill: '#ffffff' }, { x: 18, y: 3, fill: '#ffffff' },
      // 持ち手
      { x: 19, y: 2, fill: '#dddddd' },
    ]
  },
  laptop: {
    label: 'ノートPC',
    pixels: [
      // 画面
      { x: 17, y: 2, fill: '#4488ff' }, { x: 18, y: 2, fill: '#4488ff' },
      { x: 19, y: 2, fill: '#4488ff' },
      { x: 17, y: 3, fill: '#3366cc' }, { x: 18, y: 3, fill: '#3366cc' },
      { x: 19, y: 3, fill: '#3366cc' },
      // キーボード
      { x: 17, y: 4, fill: '#aaaaaa' }, { x: 18, y: 4, fill: '#999999' },
      { x: 19, y: 4, fill: '#aaaaaa' },
    ]
  },
  sword: {
    label: '剣',
    pixels: [
      // 刃（上向き）
      { x: 1, y: -2, fill: '#dddddd' },
      { x: 1, y: -1, fill: '#cccccc' },
      { x: 1, y: 0, fill: '#cccccc' },
      { x: 1, y: 1, fill: '#bbbbbb' },
      // 鍔
      { x: 0, y: 2, fill: '#ffd700' }, { x: 1, y: 2, fill: '#ffd700' },
      // 柄
      { x: 1, y: 3, fill: '#8b4513' },
      { x: 1, y: 4, fill: '#8b4513' },
    ]
  },
  flag: {
    label: '旗',
    pixels: [
      // ポール
      { x: 2, y: -3, fill: '#888888' },
      { x: 2, y: -2, fill: '#888888' },
      { x: 2, y: -1, fill: '#888888' },
      { x: 2, y: 0, fill: '#888888' },
      { x: 2, y: 1, fill: '#888888' },
      // 旗本体
      { x: 3, y: -3, fill: '#ff4444' }, { x: 4, y: -3, fill: '#ff4444' },
      { x: 5, y: -3, fill: '#ff4444' },
      { x: 3, y: -2, fill: '#ff4444' }, { x: 4, y: -2, fill: '#ff6666' },
      { x: 5, y: -2, fill: '#ff4444' },
      { x: 3, y: -1, fill: '#ff4444' }, { x: 4, y: -1, fill: '#ff4444' },
      { x: 5, y: -1, fill: '#ff4444' },
    ]
  },
  heart: {
    label: 'ハート',
    pixels: [
      // フローティングハート（右上）
      { x: 17, y: -2, fill: '#ff4466' }, { x: 19, y: -2, fill: '#ff4466' },
      { x: 17, y: -1, fill: '#ff4466' }, { x: 18, y: -1, fill: '#ff6688' },
      { x: 19, y: -1, fill: '#ff4466' },
      { x: 18, y: 0, fill: '#ff4466' },
    ]
  },
};

/* ===========================
   SVG生成
   =========================== */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG要素を作成するヘルパー */
const createSvgElement = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
};

/** 動的カラー参照を実際の色に変換 */
const resolveFill = (fill, colors) => {
  if (fill === '_body') return colors.body;
  if (fill === '_eye') return colors.eye;
  return fill;
};

/** パーツのピクセル群からSVGグループを構築 */
const buildPartGroup = (partDef, layerName, colors, defaultFill) => {
  const group = createSvgElement('g', { 'data-layer': layerName });
  for (const p of partDef.pixels) {
    const fill = p.fill ? resolveFill(p.fill, colors) : defaultFill;
    const rect = createSvgElement('rect', {
      x: p.x + PAD_LEFT,
      y: p.y + PAD_TOP,
      width: 1,
      height: 1,
      fill,
    });
    group.appendChild(rect);
  }
  return group;
};

/** アバター全体のSVGを構築 */
const buildAvatarSvg = (colors, parts) => {
  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    xmlns: SVG_NS,
    'shape-rendering': 'crispEdges',
  });

  // レイヤー1: ベースボディ
  const bodyGroup = createSvgElement('g', { 'data-layer': 'body' });
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      if (BASE_BODY[row][col] !== 1) continue;
      const rect = createSvgElement('rect', {
        x: col + PAD_LEFT,
        y: row + PAD_TOP,
        width: 1,
        height: 1,
        fill: colors.body,
      });
      bodyGroup.appendChild(rect);
    }
  }
  svg.appendChild(bodyGroup);

  // レイヤー2: 表情（目）
  const expression = EXPRESSIONS[parts.expression] || EXPRESSIONS.default;
  svg.appendChild(buildPartGroup(
    expression, 'eyes', colors, colors.eye
  ));

  // レイヤー3: 被り物
  const headwear = HEADWEAR[parts.headwear] || HEADWEAR.none;
  if (headwear.pixels.length > 0) {
    svg.appendChild(buildPartGroup(headwear, 'headwear', colors));
  }

  // レイヤー4: アクセサリー（目の上に描画されるため、サングラス等で目が隠れる）
  const accessory = ACCESSORIES[parts.accessory] || ACCESSORIES.none;
  if (accessory.pixels.length > 0) {
    svg.appendChild(buildPartGroup(accessory, 'accessory', colors));
  }

  // レイヤー5: 持ち物
  const item = ITEMS[parts.item] || ITEMS.none;
  if (item.pixels.length > 0) {
    svg.appendChild(buildPartGroup(item, 'item', colors));
  }

  return svg;
};

/* ===========================
   状態管理
   =========================== */

const state = {
  colors: { ...DEFAULT_COLORS },
  expression: 'default',
  headwear: 'none',
  accessory: 'none',
  item: 'none',
};

/* ===========================
   プレビュー更新
   =========================== */

const renderPreview = () => {
  const container = document.getElementById('preview');
  if (!container) return;

  container.style.backgroundColor = state.colors.background;

  const oldSvg = container.querySelector('svg');
  if (oldSvg) oldSvg.remove();

  const svg = buildAvatarSvg(state.colors, {
    expression: state.expression,
    headwear: state.headwear,
    accessory: state.accessory,
    item: state.item,
  });
  svg.classList.add('preview__svg');
  container.appendChild(svg);
};

/* ===========================
   パーツのミニプレビューSVG
   =========================== */

/** パーツのピクセルデータから小さなプレビューSVGを生成 */
const buildPartPreview = (pixels, colors, defaultFill) => {
  if (!pixels || pixels.length === 0) return null;

  // バウンディングボックスを計算
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pixels) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const pad = 1;
  const w = maxX - minX + 1 + pad * 2;
  const h = maxY - minY + 1 + pad * 2;

  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${w} ${h}`,
    'shape-rendering': 'crispEdges',
  });

  for (const p of pixels) {
    const fill = p.fill
      ? resolveFill(p.fill, colors)
      : (defaultFill || colors.eye);
    const rect = createSvgElement('rect', {
      x: p.x - minX + pad,
      y: p.y - minY + pad,
      width: 1,
      height: 1,
      fill,
    });
    svg.appendChild(rect);
  }

  return svg;
};

/* ===========================
   カテゴリタブ & オプション
   =========================== */

const CATEGORIES = [
  { id: 'background', label: '背景' },
  { id: 'body', label: '体' },
  { id: 'eyes', label: '目の色' },
  { id: 'expression', label: '表情' },
  { id: 'headwear', label: '被り物' },
  { id: 'accessory', label: 'アクセサリー' },
  { id: 'item', label: '持ち物' },
];

let activeCategory = 'background';

const renderTabs = () => {
  const tabsContainer = document.getElementById('panel-tabs');
  if (!tabsContainer) return;

  tabsContainer.textContent = '';

  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.classList.add('tab-btn');
    if (cat.id === activeCategory) btn.classList.add('active');
    btn.textContent = cat.label;
    btn.style.animationDelay = `${i * 0.04}s`;
    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      renderTabs();
      renderOptions();
    });
    tabsContainer.appendChild(btn);
  });
};

/** カラーピッカーUI */
const renderColorOptions = (presets, currentColor, onChange) => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('color-section');

  const presetsRow = document.createElement('div');
  presetsRow.classList.add('color-presets');

  presets.forEach((color, i) => {
    const swatch = document.createElement('button');
    swatch.classList.add('color-swatch');
    if (color === currentColor) swatch.classList.add('selected');
    swatch.style.backgroundColor = color;
    swatch.style.animationDelay = `${i * 0.03}s`;
    swatch.addEventListener('click', () => onChange(color));
    presetsRow.appendChild(swatch);
  });

  wrapper.appendChild(presetsRow);

  const customRow = document.createElement('div');
  customRow.classList.add('color-custom');

  const label = document.createElement('label');
  label.textContent = 'カスタム';

  const input = document.createElement('input');
  input.type = 'color';
  input.value = currentColor;
  input.addEventListener('input', (e) => onChange(e.target.value));

  customRow.appendChild(label);
  customRow.appendChild(input);
  wrapper.appendChild(customRow);

  return wrapper;
};

/** パーツ選択グリッドUI */
const renderPartGrid = (partsMap, currentKey, onChange, defaultFill) => {
  const grid = document.createElement('div');
  grid.classList.add('part-grid');

  Object.entries(partsMap).forEach(([key, part], i) => {
    const btn = document.createElement('button');
    btn.classList.add('part-btn');
    if (key === currentKey) btn.classList.add('selected');
    btn.style.animationDelay = `${i * 0.04}s`;

    // ミニプレビュー or アイコン
    const iconEl = document.createElement('div');
    iconEl.classList.add('part-btn__icon');

    if (part.pixels.length > 0) {
      const miniSvg = buildPartPreview(
        part.pixels, state.colors, defaultFill
      );
      if (miniSvg) {
        iconEl.appendChild(miniSvg);
      }
    } else {
      iconEl.textContent = '−';
    }

    const labelEl = document.createElement('span');
    labelEl.classList.add('part-btn__label');
    labelEl.textContent = part.label;

    btn.appendChild(iconEl);
    btn.appendChild(labelEl);
    btn.addEventListener('click', () => onChange(key));
    grid.appendChild(btn);
  });

  return grid;
};

/** オプションエリアの描画 */
const renderOptions = () => {
  const optionsContainer = document.getElementById('panel-options');
  if (!optionsContainer) return;

  optionsContainer.textContent = '';

  switch (activeCategory) {
    case 'background':
      optionsContainer.appendChild(
        renderColorOptions(BG_PRESETS, state.colors.background, (color) => {
          state.colors.background = color;
          renderPreview();
          renderOptions();
        })
      );
      break;

    case 'body':
      optionsContainer.appendChild(
        renderColorOptions(BODY_PRESETS, state.colors.body, (color) => {
          state.colors.body = color;
          renderPreview();
          renderOptions();
        })
      );
      break;

    case 'eyes':
      optionsContainer.appendChild(
        renderColorOptions(EYE_PRESETS, state.colors.eye, (color) => {
          state.colors.eye = color;
          renderPreview();
          renderOptions();
        })
      );
      break;

    case 'expression':
      optionsContainer.appendChild(
        renderPartGrid(EXPRESSIONS, state.expression, (key) => {
          state.expression = key;
          renderPreview();
          renderOptions();
        }, state.colors.eye)
      );
      break;

    case 'headwear':
      optionsContainer.appendChild(
        renderPartGrid(HEADWEAR, state.headwear, (key) => {
          state.headwear = key;
          renderPreview();
          renderOptions();
        })
      );
      break;

    case 'accessory':
      optionsContainer.appendChild(
        renderPartGrid(ACCESSORIES, state.accessory, (key) => {
          state.accessory = key;
          renderPreview();
          renderOptions();
        })
      );
      break;

    case 'item':
      optionsContainer.appendChild(
        renderPartGrid(ITEMS, state.item, (key) => {
          state.item = key;
          renderPreview();
          renderOptions();
        })
      );
      break;
  }
};

/* ===========================
   アクションボタン
   =========================== */

const randomize = () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // カラーをランダムに
  state.colors.background = pick(BG_PRESETS);
  state.colors.body = pick(BODY_PRESETS);
  state.colors.eye = pick(EYE_PRESETS);

  // パーツをランダムに
  state.expression = pick(Object.keys(EXPRESSIONS));
  state.headwear = pick(Object.keys(HEADWEAR));
  state.accessory = pick(Object.keys(ACCESSORIES));
  state.item = pick(Object.keys(ITEMS));

  // バウンスアニメーション
  const preview = document.getElementById('preview');
  preview?.classList.remove('bounce');
  void preview?.offsetWidth;
  preview?.classList.add('bounce');

  renderPreview();
  renderOptions();
};

const downloadPng = () => {
  const svgEl = document.querySelector('#preview svg');
  if (!svgEl) return;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;

  // 背景
  ctx.fillStyle = state.colors.background;
  ctx.fillRect(0, 0, size, size);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    // viewBoxのアスペクト比を維持してキャンバス中央に描画
    const aspectRatio = VIEW_W / VIEW_H;
    let drawW, drawH;
    if (aspectRatio > 1) {
      drawW = size;
      drawH = size / aspectRatio;
    } else {
      drawH = size;
      drawW = size * aspectRatio;
    }
    const offsetX = (size - drawW) / 2;
    const offsetY = (size - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    URL.revokeObjectURL(url);

    const link = document.createElement('a');
    link.download = 'claude-avatar.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = url;
};

/* ===========================
   初期化
   =========================== */

const init = () => {
  renderPreview();
  renderTabs();
  renderOptions();

  document.getElementById('btn-random')?.addEventListener('click', randomize);
  document.getElementById('btn-download')?.addEventListener('click', downloadPng);
};

document.addEventListener('DOMContentLoaded', init);
