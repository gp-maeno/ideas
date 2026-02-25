/**
 * Claude Avatar Generator
 * 2xスケールのピクセルアート + パーツカスタマイズ
 *
 * 座標系:
 *   ボディ座標 (x, y) → SVG座標 (x + OFFSET_X, y + OFFSET_Y)
 *   ボディ本体: cols 6-31 (26幅), rows 0-13 (14高)
 *   対称軸: x = 18.5（左右対称の基準）
 */

/* ===========================
   定数・設定
   =========================== */

const DEFAULT_COLORS = {
  body: '#D87757',
  eye: '#1a1a1a',
  background: '#1a1a2e'
};

const BG_PRESETS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d4a3e', '#1a3a1a', '#3a1a1a', '#1a2a3a',
  '#2e1a2e', '#3d3d3d', '#f0e6d3', '#ffffff'
];

const BODY_PRESETS = [
  '#c07850', '#d4956a', '#a0522d', '#e8b88a',
  '#8b6f47', '#f4c794', '#cd853f', '#deb887',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dda0dd', '#ff8c42', '#98d8c8'
];

const EYE_PRESETS = [
  '#1a1a1a', '#ffffff', '#ff4444', '#4488ff',
  '#44dd44', '#ffaa00', '#ff44ff', '#44ffff'
];

/* ===========================
   ベースボディ（2xスケール・矩形定義）
   =========================== */

/**
 * 体を構成する矩形群
 * 対称軸 x=18.5 を基準に左右対称
 * 元の1xスケールの各ピクセルを2×2に拡大
 */
const BODY_RECTS = [
  { x: 6, y: 0, w: 26, h: 14 },   // 体本体
  { x: 4, y: 4, w: 2, h: 4 },     // 左手
  { x: 32, y: 4, w: 2, h: 4 },    // 右手
  { x: 6, y: 14, w: 2, h: 4 },    // 左足外
  { x: 10, y: 14, w: 2, h: 4 },   // 左足内
  { x: 26, y: 14, w: 2, h: 4 },   // 右足内
  { x: 30, y: 14, w: 2, h: 4 },   // 右足外
];

// 描画オフセット（ボディ座標 → SVG座標）
const OFFSET_X = 4;
const OFFSET_Y = 9;

// SVG viewBoxサイズ
const VIEW_W = 46;
const VIEW_H = 28;

/* ===========================
   表情（目の形状バリエーション）10種
   =========================== */

const EXPRESSIONS = {
  default: {
    label: 'デフォルト',
    pixels: [
      { x: 10, y: 4, w: 2, h: 4 },
      { x: 26, y: 4, w: 2, h: 4 },
    ]
  },
  joy: {
    label: '喜び',
    pixels: [
      // 左目 "<"
      { x: 10, y: 3 }, { x: 11, y: 4 }, { x: 12, y: 5 },
      { x: 11, y: 6 }, { x: 10, y: 7 },
      // 右目 ">"
      { x: 27, y: 3 }, { x: 26, y: 4 }, { x: 25, y: 5 },
      { x: 26, y: 6 }, { x: 27, y: 7 },
    ]
  },
  smile: {
    label: 'にっこり',
    pixels: [
      // 左目 "^"
      { x: 10, y: 3 },
      { x: 9, y: 4 }, { x: 11, y: 4 },
      { x: 8, y: 5 }, { x: 12, y: 5 },
      // 右目 "^"
      { x: 27, y: 3 },
      { x: 26, y: 4 }, { x: 28, y: 4 },
      { x: 25, y: 5 }, { x: 29, y: 5 },
    ]
  },
  surprise: {
    label: 'びっくり',
    pixels: [
      // 左目 "O"
      { x: 10, y: 3, w: 2, h: 1 },
      { x: 9, y: 4 }, { x: 12, y: 4 },
      { x: 9, y: 5 }, { x: 12, y: 5 },
      { x: 9, y: 6 }, { x: 12, y: 6 },
      { x: 10, y: 7, w: 2, h: 1 },
      // 右目 "O"
      { x: 26, y: 3, w: 2, h: 1 },
      { x: 25, y: 4 }, { x: 28, y: 4 },
      { x: 25, y: 5 }, { x: 28, y: 5 },
      { x: 25, y: 6 }, { x: 28, y: 6 },
      { x: 26, y: 7, w: 2, h: 1 },
    ]
  },
  wink: {
    label: 'ウインク',
    pixels: [
      // 左目 "−"（閉じ）
      { x: 9, y: 5, w: 4, h: 1 },
      // 右目（通常）
      { x: 26, y: 4, w: 2, h: 4 },
    ]
  },
  heart: {
    label: 'ハート目',
    pixels: [
      // 左ハート ♥
      { x: 9, y: 3 }, { x: 12, y: 3 },
      { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 },
      { x: 11, y: 4 }, { x: 12, y: 4 }, { x: 13, y: 4 },
      { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 },
      { x: 10, y: 6 }, { x: 11, y: 6 },
      // 右ハート ♥
      { x: 25, y: 3 }, { x: 28, y: 3 },
      { x: 24, y: 4 }, { x: 25, y: 4 }, { x: 26, y: 4 },
      { x: 27, y: 4 }, { x: 28, y: 4 }, { x: 29, y: 4 },
      { x: 25, y: 5 }, { x: 26, y: 5 }, { x: 27, y: 5 }, { x: 28, y: 5 },
      { x: 26, y: 6 }, { x: 27, y: 6 },
    ]
  },
  sparkle: {
    label: 'キラキラ',
    pixels: [
      // 左 ✦（ダイヤモンド）
      { x: 10, y: 3 },
      { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 },
      { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 },
      { x: 11, y: 5 }, { x: 12, y: 5 },
      { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
      { x: 10, y: 7 },
      // 右 ✦
      { x: 27, y: 3 },
      { x: 26, y: 4 }, { x: 27, y: 4 }, { x: 28, y: 4 },
      { x: 25, y: 5 }, { x: 26, y: 5 }, { x: 27, y: 5 },
      { x: 28, y: 5 }, { x: 29, y: 5 },
      { x: 26, y: 6 }, { x: 27, y: 6 }, { x: 28, y: 6 },
      { x: 27, y: 7 },
    ]
  },
  sleepy: {
    label: 'ねむい',
    pixels: [
      // 左目 "−"
      { x: 9, y: 5, w: 4, h: 1 },
      // 右目 "−"
      { x: 25, y: 5, w: 4, h: 1 },
    ]
  },
  dead: {
    label: 'ぐるぐる',
    pixels: [
      // 左 "X"
      { x: 9, y: 3 }, { x: 12, y: 3 },
      { x: 10, y: 4 }, { x: 11, y: 4 },
      { x: 10, y: 5 }, { x: 11, y: 5 },
      { x: 9, y: 6 }, { x: 12, y: 6 },
      // 右 "X"
      { x: 25, y: 3 }, { x: 28, y: 3 },
      { x: 26, y: 4 }, { x: 27, y: 4 },
      { x: 26, y: 5 }, { x: 27, y: 5 },
      { x: 25, y: 6 }, { x: 28, y: 6 },
    ]
  },
  cry: {
    label: '泣き',
    pixels: [
      // 左 "T"（太い横棒＋細い涙）
      { x: 9, y: 3, w: 4, h: 2 },
      { x: 10.5, y: 5, w: 1, h: 3 },
      // 右 "T"
      { x: 25, y: 3, w: 4, h: 2 },
      { x: 26.5, y: 5, w: 1, h: 3 },
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
      // 三つの尖り
      { x: 10, y: -4, w: 2, h: 2, fill: '#ffd700' },
      { x: 18, y: -5, w: 2, h: 3, fill: '#ffd700' },
      { x: 26, y: -4, w: 2, h: 2, fill: '#ffd700' },
      // バンド
      { x: 8, y: -2, w: 22, h: 2, fill: '#ffd700' },
      // 宝石
      { x: 14, y: -2, w: 2, h: 2, fill: '#ff4444' },
      { x: 22, y: -2, w: 2, h: 2, fill: '#4488ff' },
    ]
  },
  partyHat: {
    label: 'パーティーハット',
    pixels: [
      // 先端飾り（十字型・中心19.0に合わせて小数座標）
      { x: 18.5, y: -9, w: 1, h: 1, fill: '#bb88dd' },
      { x: 17.5, y: -8, w: 1, h: 1, fill: '#bb88dd' },
      { x: 18.5, y: -8, w: 1, h: 1, fill: '#cc99ee' },
      { x: 19.5, y: -8, w: 1, h: 1, fill: '#bb88dd' },
      { x: 18.5, y: -7, w: 1, h: 1, fill: '#bb88dd' },
      // ポール（中心19.0）
      { x: 18.5, y: -6, w: 1, h: 2, fill: '#555555' },
      // 帽子段1（小ブロック・中心19.0）
      { x: 18, y: -4, w: 2, h: 2, fill: '#9966cc' },
      // 帽子段2（大ブロック・中心19.0）
      { x: 16, y: -2, w: 6, h: 2, fill: '#7744aa' },
    ]
  },
  catEars: {
    label: '猫耳',
    pixels: [
      // 左耳（外側）
      { x: 8, y: -3, w: 2, h: 1, fill: '_body' },
      { x: 7, y: -2, w: 4, h: 1, fill: '_body' },
      { x: 6, y: -1, w: 6, h: 1, fill: '_body' },
      // 左耳内側（ピンク）
      { x: 8, y: -2, w: 2, h: 1, fill: '#ffaaaa' },
      { x: 8, y: -1, w: 2, h: 1, fill: '#ffaaaa' },
      // 右耳（外側）
      { x: 28, y: -3, w: 2, h: 1, fill: '_body' },
      { x: 27, y: -2, w: 4, h: 1, fill: '_body' },
      { x: 26, y: -1, w: 6, h: 1, fill: '_body' },
      // 右耳内側
      { x: 28, y: -2, w: 2, h: 1, fill: '#ffaaaa' },
      { x: 28, y: -1, w: 2, h: 1, fill: '#ffaaaa' },
    ]
  },
  flowerCrown: {
    label: '花冠',
    pixels: [
      // つる（ベース）
      { x: 6, y: -1, w: 26, h: 1, fill: '#55aa55' },
      // 花1（ピンク・左）
      { x: 8, y: -3, fill: '#ff88aa' },
      { x: 7, y: -2, fill: '#ff88aa' }, { x: 8, y: -2, fill: '#ffaacc' },
      { x: 9, y: -2, fill: '#ff88aa' },
      // 花2（黄色・左中）
      { x: 14, y: -3, fill: '#ffdd44' },
      { x: 13, y: -2, fill: '#ffdd44' }, { x: 14, y: -2, fill: '#ffee88' },
      { x: 15, y: -2, fill: '#ffdd44' },
      // 花3（水色・中央）
      { x: 19, y: -3, fill: '#66ccee' },
      { x: 18, y: -2, fill: '#66ccee' }, { x: 19, y: -2, fill: '#99ddff' },
      { x: 20, y: -2, fill: '#66ccee' },
      // 花4（黄色・右中）
      { x: 24, y: -3, fill: '#ffdd44' },
      { x: 23, y: -2, fill: '#ffdd44' }, { x: 24, y: -2, fill: '#ffee88' },
      { x: 25, y: -2, fill: '#ffdd44' },
      // 花5（ピンク・右）
      { x: 29, y: -3, fill: '#ff88aa' },
      { x: 28, y: -2, fill: '#ff88aa' }, { x: 29, y: -2, fill: '#ffaacc' },
      { x: 30, y: -2, fill: '#ff88aa' },
      // 葉っぱ
      { x: 10, y: -1, w: 2, h: 1, fill: '#44884d' },
      { x: 16, y: -1, w: 2, h: 1, fill: '#44884d' },
      { x: 21, y: -1, w: 2, h: 1, fill: '#44884d' },
      { x: 26, y: -1, w: 2, h: 1, fill: '#44884d' },
    ]
  },
  wizardHat: {
    label: 'ウィザードハット',
    pixels: [
      // 星飾り（先端・右に曲がる）
      { x: 22, y: -8, fill: '#ffdd44' },
      // 曲がった先端
      { x: 19, y: -7, w: 3, h: 1, fill: '#9966dd' },
      // コーン上部
      { x: 17, y: -6, w: 4, h: 1, fill: '#8855cc' },
      { x: 16, y: -5, w: 6, h: 1, fill: '#8855cc' },
      // コーン下部
      { x: 15, y: -4, w: 8, h: 1, fill: '#7744bb' },
      { x: 14, y: -3, w: 10, h: 1, fill: '#7744bb' },
      // ゴールドの帯
      { x: 11, y: -2, w: 16, h: 1, fill: '#ffdd44' },
      // つば
      { x: 11, y: -1, w: 16, h: 1, fill: '#5533aa' },
    ]
  },
  halo: {
    label: '天使の輪',
    pixels: [
      // 上弧（奥側・狭い）
      { x: 14, y: -4, w: 10, h: 1, fill: '#ffd700' },
      // ハイライト
      { x: 15, y: -4, w: 2, h: 1, fill: '#ffee88' },
      // 左側面
      { x: 12, y: -3, w: 2, h: 1, fill: '#eebb00' },
      // 右側面
      { x: 24, y: -3, w: 2, h: 1, fill: '#eebb00' },
      // 下弧（手前側・広い）
      { x: 12, y: -2, w: 14, h: 1, fill: '#ddaa00' },
    ]
  },
  birthdayCake: {
    label: 'ケーキ',
    pixels: [
      // ろうそくの炎（3本・中心19.0に小数座標で対称）
      { x: 14.5, y: -7, fill: '#ffdd33' },
      { x: 18.5, y: -7, fill: '#ffdd33' },
      { x: 22.5, y: -7, fill: '#ffdd33' },
      // ろうそく（カラフル）
      { x: 14.5, y: -6, w: 1, h: 2, fill: '#ff5588' },
      { x: 18.5, y: -6, w: 1, h: 2, fill: '#55bbff' },
      { x: 22.5, y: -6, w: 1, h: 2, fill: '#66dd77' },
      // クリーム（白・波形・中心19.0）
      { x: 13, y: -4, w: 3, h: 1, fill: '#fff5ee' },
      { x: 17, y: -4, w: 4, h: 1, fill: '#fff5ee' },
      { x: 22, y: -4, w: 3, h: 1, fill: '#fff5ee' },
      // ケーキ上段（ピンク・中心19.0）
      { x: 13, y: -3, w: 12, h: 1, fill: '#ff88aa' },
      // いちご飾り（小数座標で対称）
      { x: 14.5, y: -3, fill: '#ff2244' },
      { x: 22.5, y: -3, fill: '#ff2244' },
      // ケーキ下段（華やかなピンク・中心19.0）
      { x: 11, y: -2, w: 16, h: 2, fill: '#ff6699' },
      // デコライン
      { x: 11, y: -1, w: 16, h: 1, fill: '#ff4477' },
    ]
  },
};

/* ===========================
   アクセサリーパーツ
   =========================== */

const ACCESSORIES = {
  none: { label: 'なし', pixels: [] },
  mustache: {
    label: 'ヒゲ',
    pixels: [
      // 左ヒゲ（カイゼル風・中心19.0）
      { x: 14, y: 10, w: 4, h: 1, fill: '#4a3a2a' },
      { x: 12, y: 11, w: 6, h: 1, fill: '#4a3a2a' },
      { x: 10, y: 12, w: 2, h: 1, fill: '#4a3a2a' },
      // 右ヒゲ
      { x: 20, y: 10, w: 4, h: 1, fill: '#4a3a2a' },
      { x: 20, y: 11, w: 6, h: 1, fill: '#4a3a2a' },
      { x: 26, y: 12, w: 2, h: 1, fill: '#4a3a2a' },
    ]
  },
  sunglasses: {
    label: 'サングラス',
    pixels: [
      // 左レンズ（塗りつぶし）
      { x: 8, y: 3, w: 6, h: 6, fill: '#181818' },
      { x: 8, y: 3, w: 6, h: 1, fill: '#333333' },
      // ブリッジ
      { x: 14, y: 4, w: 10, h: 2, fill: '#222222' },
      // 右レンズ
      { x: 24, y: 3, w: 6, h: 6, fill: '#181818' },
      { x: 24, y: 3, w: 6, h: 1, fill: '#333333' },
    ]
  },
  mask: {
    label: 'マスク',
    pixels: [
      { x: 8, y: 8, w: 22, h: 3, fill: '#ffffff' },
      { x: 8, y: 11, w: 22, h: 2, fill: '#eeeeee' },
      // マスクのひだ
      { x: 14, y: 9, w: 1, h: 2, fill: '#dddddd' },
      { x: 19, y: 9, w: 1, h: 2, fill: '#dddddd' },
      { x: 24, y: 9, w: 1, h: 2, fill: '#dddddd' },
    ]
  },
  blush: {
    label: 'ほっぺ',
    pixels: [
      { x: 7, y: 7, w: 2, h: 2, fill: '#ff8888' },
      { x: 29, y: 7, w: 2, h: 2, fill: '#ff8888' },
    ]
  },
  scarf: {
    label: 'マフラー',
    pixels: [
      // バンド
      { x: 6, y: 12, w: 26, h: 1, fill: '#dd3355' },
      { x: 6, y: 13, w: 26, h: 1, fill: '#ff4466' },
      // 垂れ下がり（足の間の中央）
      { x: 16, y: 14, w: 3, h: 3, fill: '#ff4466' },
      { x: 19, y: 14, w: 2, h: 2, fill: '#dd3355' },
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
      { x: 35, y: 2, fill: 'rgba(255,255,255,0.4)' },
      { x: 36, y: 1, fill: 'rgba(255,255,255,0.3)' },
      // カップ
      { x: 34, y: 4, w: 3, h: 5, fill: '#ffffff' },
      // コーヒー液面
      { x: 34, y: 4, w: 3, h: 2, fill: '#6b3a1f' },
      // 持ち手
      { x: 37, y: 5, w: 1, h: 3, fill: '#dddddd' },
    ]
  },
  smartphone: {
    label: 'スマホ',
    pixels: [
      // 本体フレーム
      { x: 35, y: 3, w: 3, h: 7, fill: '#222222' },
      // 画面
      { x: 35, y: 4, w: 3, h: 5, fill: '#4488ff' },
      // 画面コンテンツ
      { x: 36, y: 5, w: 1, h: 1, fill: '#88ccff' },
      { x: 36, y: 7, w: 1, h: 1, fill: '#66aaee' },
    ]
  },
  sword: {
    label: '剣',
    pixels: [
      // 刃先
      { x: 3, y: -5, w: 2, h: 1, fill: '#eeeeff' },
      // 刃
      { x: 3, y: -4, w: 2, h: 4, fill: '#ccccdd' },
      // 刃下部
      { x: 3, y: 0, w: 2, h: 3, fill: '#bbbbcc' },
      // 鍔
      { x: 1, y: 3, w: 6, h: 2, fill: '#ffd700' },
      // 柄
      { x: 3, y: 5, w: 2, h: 4, fill: '#8b4513' },
      // 柄巻き
      { x: 3, y: 6, w: 2, h: 1, fill: '#a0522d' },
      { x: 3, y: 8, w: 2, h: 1, fill: '#a0522d' },
    ]
  },
  flag: {
    label: '旗',
    pixels: [
      // ポール（右手側）
      { x: 33, y: -5, w: 1, h: 12, fill: '#888888' },
      // ポール先端
      { x: 33, y: -5, w: 1, h: 1, fill: '#ffd700' },
      // 旗本体（ポールの右に広がる）
      { x: 34, y: -5, w: 6, h: 3, fill: '#ff4444' },
      { x: 34, y: -2, w: 6, h: 2, fill: '#ff6666' },
      // 旗のアクセント
      { x: 36, y: -4, w: 2, h: 1, fill: '#ffaaaa' },
    ]
  },
  heart: {
    label: 'ハート',
    pixels: [
      // ハート上部（二つの山）
      { x: 34, y: -4, w: 2, h: 2, fill: '#ff4466' },
      { x: 38, y: -4, w: 2, h: 2, fill: '#ff4466' },
      // 中央
      { x: 33, y: -2, w: 8, h: 2, fill: '#ff4466' },
      // 下部
      { x: 34, y: 0, w: 6, h: 2, fill: '#ff4466' },
      { x: 35, y: 2, w: 4, h: 1, fill: '#ff4466' },
      { x: 36, y: 3, w: 2, h: 1, fill: '#ff4466' },
      // ハイライト
      { x: 35, y: -3, fill: '#ff6688' },
    ]
  },
};

/* ===========================
   SVG生成
   =========================== */

const SVG_NS = 'http://www.w3.org/2000/svg';

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
    group.appendChild(createSvgElement('rect', {
      x: p.x + OFFSET_X,
      y: p.y + OFFSET_Y,
      width: p.w || 1,
      height: p.h || 1,
      fill,
    }));
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

  // レイヤー1: ベースボディ（矩形群）
  const bodyGroup = createSvgElement('g', { 'data-layer': 'body' });
  for (const r of BODY_RECTS) {
    bodyGroup.appendChild(createSvgElement('rect', {
      x: r.x + OFFSET_X,
      y: r.y + OFFSET_Y,
      width: r.w,
      height: r.h,
      fill: colors.body,
    }));
  }
  svg.appendChild(bodyGroup);

  // レイヤー2: 表情（目）
  const expression = EXPRESSIONS[parts.expression] || EXPRESSIONS.default;
  svg.appendChild(buildPartGroup(expression, 'eyes', colors, colors.eye));

  // レイヤー3: 被り物
  const headwear = HEADWEAR[parts.headwear] || HEADWEAR.none;
  if (headwear.pixels.length > 0) {
    svg.appendChild(buildPartGroup(headwear, 'headwear', colors));
  }

  // レイヤー4: アクセサリー（目の上に描画）
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

const buildPartPreview = (pixels, colors, defaultFill) => {
  if (!pixels || pixels.length === 0) return null;

  // バウンディングボックス（w/h考慮）
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pixels) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + (p.w || 1) - 1);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + (p.h || 1) - 1);
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
    svg.appendChild(createSvgElement('rect', {
      x: p.x - minX + pad,
      y: p.y - minY + pad,
      width: p.w || 1,
      height: p.h || 1,
      fill,
    }));
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

  state.colors.background = pick(BG_PRESETS);
  state.colors.body = pick(BODY_PRESETS);
  state.colors.eye = pick(EYE_PRESETS);

  state.expression = pick(Object.keys(EXPRESSIONS));
  state.headwear = pick(Object.keys(HEADWEAR));
  state.accessory = pick(Object.keys(ACCESSORIES));
  state.item = pick(Object.keys(ITEMS));

  const preview = document.getElementById('preview');
  preview?.classList.remove('bounce');
  void preview?.offsetWidth;
  preview?.classList.add('bounce');

  renderPreview();
  renderOptions();
};

const clearAll = () => {
  state.colors = { ...DEFAULT_COLORS };
  state.expression = 'default';
  state.headwear = 'none';
  state.accessory = 'none';
  state.item = 'none';

  renderPreview();
  renderTabs();
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

  ctx.fillStyle = state.colors.background;
  ctx.fillRect(0, 0, size, size);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
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

  document.getElementById('btn-clear')?.addEventListener('click', clearAll);
  document.getElementById('btn-random')?.addEventListener('click', randomize);
  document.getElementById('btn-download')?.addEventListener('click', downloadPng);
};

document.addEventListener('DOMContentLoaded', init);
