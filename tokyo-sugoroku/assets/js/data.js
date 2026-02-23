// 東京観光スゴロク - データ定義
// マップ座標はSVG viewBox(0, 0, 800, 1000)基準

// マス（スポット）データ
export const SPOTS = [
  {
    id: 1,
    name: '東京タワー',
    area: '港区',
    emoji: '🗼',
    x: 340, y: 720,
    eventType: 'start',
    description: '1958年に完成した高さ333mの電波塔。東京のシンボルとして世界中から観光客が訪れる。',
    trivia: '建設には朝鮮戦争で使われた米軍戦車のスクラップが再利用された。'
  },
  {
    id: 2,
    name: '築地場外市場',
    area: '中央区',
    emoji: '🍣',
    x: 460, y: 650,
    eventType: 'gourmet',
    food: '海鮮丼',
    foodEmoji: '🍣',
    foodDescription: '新鮮なマグロ、サーモン、イクラが贅沢に盛られた築地名物の海鮮丼。朝から行列ができる人気店が並ぶ。'
  },
  {
    id: 3,
    name: '銀座',
    area: '中央区',
    emoji: '💎',
    x: 440, y: 560,
    eventType: 'points',
    points: 15,
    description: '日本を代表する高級ショッピング街。歩行者天国では優雅な散歩が楽しめる。'
  },
  {
    id: 4,
    name: '東京駅',
    area: '千代田区',
    emoji: '🚉',
    x: 380, y: 470,
    eventType: 'sightseeing',
    description: '1914年に開業した赤レンガ造りの駅舎。丸の内駅舎は国の重要文化財に指定されている。',
    trivia: '東京駅の地下には巨大な地下水の浮力を抑えるための130本のアンカーが打ち込まれている。'
  },
  {
    id: 5,
    name: '秋葉原電気街',
    area: '千代田区',
    emoji: '🎮',
    x: 460, y: 380,
    eventType: 'quiz'
  },
  {
    id: 6,
    name: '浅草寺',
    area: '台東区',
    emoji: '🏯',
    x: 540, y: 280,
    eventType: 'sightseeing',
    description: '628年に創建された東京最古の寺院。雷門の大提灯は浅草のシンボルとして有名。',
    trivia: '雷門の大提灯の底面には龍の彫刻が施されており、下から覗くと見ることができる。'
  },
  {
    id: 7,
    name: '東京スカイツリー',
    area: '墨田区',
    emoji: '🌟',
    x: 620, y: 220,
    eventType: 'points',
    points: 20,
    description: '高さ634mの世界一高い自立式電波塔。展望台からは関東平野を一望できる。'
  },
  {
    id: 8,
    name: '両国国技館',
    area: '墨田区',
    emoji: '🏟️',
    x: 600, y: 350,
    eventType: 'quiz'
  },
  {
    id: 9,
    name: '豊洲市場',
    area: '江東区',
    emoji: '🐟',
    x: 580, y: 520,
    eventType: 'gourmet',
    food: 'マグロの競り見学＆寿司',
    foodEmoji: '🐟',
    foodDescription: '世界最大級の卸売市場。早朝のマグロの競りは圧巻の迫力。場内の寿司店では最高鮮度のネタが楽しめる。'
  },
  {
    id: 10,
    name: 'お台場',
    area: '港区',
    emoji: '🎡',
    x: 540, y: 700,
    eventType: 'advance',
    advanceBy: 3,
    description: 'フジテレビ本社やダイバーシティなど、エンターテイメント施設が集まるウォーターフロント。'
  },
  {
    id: 11,
    name: 'レインボーブリッジ',
    area: '港区',
    emoji: '🌈',
    x: 460, y: 800,
    eventType: 'points',
    points: 10,
    description: '東京港に架かる全長798mの吊り橋。夜のライトアップは東京を代表する夜景のひとつ。'
  },
  {
    id: 12,
    name: '上野動物園',
    area: '台東区',
    emoji: '🐼',
    x: 440, y: 270,
    eventType: 'skip',
    description: '1882年に開園した日本初の動物園。ジャイアントパンダが大人気。'
  },
  {
    id: 13,
    name: '池袋サンシャイン',
    area: '豊島区',
    emoji: '☀️',
    x: 260, y: 200,
    eventType: 'quiz'
  },
  {
    id: 14,
    name: '新宿御苑',
    area: '新宿区',
    emoji: '🌸',
    x: 200, y: 360,
    eventType: 'retreat',
    retreatBy: 2,
    description: '広さ58.3ヘクタールの広大な庭園。春の桜と秋の紅葉が見事。'
  },
  {
    id: 15,
    name: '明治神宮',
    area: '渋谷区',
    emoji: '⛩️',
    x: 180, y: 470,
    eventType: 'points',
    points: 15,
    description: '明治天皇と昭憲皇太后を祀る神社。都心にありながら70万㎡の森に囲まれた厳かな空間。'
  },
  {
    id: 16,
    name: '原宿（竹下通り）',
    area: '渋谷区',
    emoji: '🍭',
    x: 170, y: 560,
    eventType: 'gourmet',
    food: 'クレープ＆わたあめ',
    foodEmoji: '🍭',
    foodDescription: '若者文化の発信地・竹下通りの名物スイーツ。カラフルなクレープと巨大わたあめは写真映え抜群。'
  },
  {
    id: 17,
    name: '渋谷スクランブル交差点',
    area: '渋谷区',
    emoji: '🚶',
    x: 200, y: 650,
    eventType: 'quiz'
  },
  {
    id: 18,
    name: '中目黒',
    area: '目黒区',
    emoji: '🌸',
    x: 220, y: 740,
    eventType: 'gourmet',
    food: 'おしゃれカフェラテ',
    foodEmoji: '☕',
    foodDescription: '目黒川沿いに立ち並ぶおしゃれなカフェ。桜の季節にはピンクに染まる川沿いでラテを楽しめる。'
  },
  {
    id: 19,
    name: '六本木ヒルズ',
    area: '港区',
    emoji: '🏙️',
    x: 280, y: 640,
    eventType: 'points',
    points: 25,
    description: '高さ238mの森タワーを中心とした複合施設。展望台「東京シティビュー」からの眺望は圧巻。'
  },
  {
    id: 20,
    name: '皇居',
    area: '千代田区',
    emoji: '🏯',
    x: 360, y: 400,
    eventType: 'goal',
    description: '天皇陛下のお住まい。二重橋や東御苑など、都心のオアシスとして親しまれている。'
  }
];

// クイズデータ（各クイズマスに対応）
export const QUIZZES = {
  // マス5: 秋葉原
  5: [
    {
      question: '秋葉原が「電気街」と呼ばれるようになったきっかけは？',
      choices: ['戦後のラジオ部品の露店街', '東京電力の本社があった', '日本初の電灯が灯った場所'],
      correctIndex: 0,
      explanation: '戦後、神田須田町周辺にラジオ部品を扱う露店が集まったのが始まり。'
    },
    {
      question: '秋葉原駅の1日の平均乗降客数は約何万人？',
      choices: ['約10万人', '約25万人', '約50万人'],
      correctIndex: 1,
      explanation: 'JR秋葉原駅の1日平均乗降客数は約25万人。'
    }
  ],
  // マス8: 両国
  8: [
    {
      question: '大相撲の本場所は年に何回開催される？',
      choices: ['4回', '6回', '8回'],
      correctIndex: 1,
      explanation: '大相撲は年6場所（東京3回、大阪・名古屋・福岡各1回）開催される。'
    },
    {
      question: '両国国技館の収容人数は約何人？',
      choices: ['約5,000人', '約11,000人', '約20,000人'],
      correctIndex: 1,
      explanation: '両国国技館の収容人数は約11,098人。'
    }
  ],
  // マス13: 池袋
  13: [
    {
      question: 'サンシャイン60の「60」は何を意味している？',
      choices: ['建設に60ヶ月かかった', '60階建て', '完成年が1960年代'],
      correctIndex: 1,
      explanation: 'サンシャイン60は地上60階建て。1978年の完成時はアジアで最も高いビルだった。'
    },
    {
      question: 'サンシャインシティがある場所には、かつて何があった？',
      choices: ['東京競馬場', '巣鴨プリズン（東京拘置所）', '陸軍の飛行場'],
      correctIndex: 1,
      explanation: 'サンシャインシティの敷地はかつて巣鴨プリズン（東京拘置所）があった場所。'
    }
  ],
  // マス17: 渋谷
  17: [
    {
      question: '渋谷スクランブル交差点を1回の青信号で渡る人数は最大約何人？',
      choices: ['約500人', '約1,500人', '約3,000人'],
      correctIndex: 2,
      explanation: '1回の青信号で最大約3,000人が一斉に横断する、世界最大級のスクランブル交差点。'
    },
    {
      question: '渋谷のシンボル「ハチ公像」のハチの犬種は？',
      choices: ['柴犬', '秋田犬', '甲斐犬'],
      correctIndex: 1,
      explanation: 'ハチ公は秋田犬。飼い主の死後も約10年間、渋谷駅で帰りを待ち続けた。'
    }
  ]
};

// ゲーム設定
export const CONFIG = {
  initialPoints: 50,
  diceCost: 5,
  dailyBonus: 50,
  lapBonus: 30,
  quizBonus: 10,
  totalSpots: 20,
  storageKey: 'sugoroku_state'
};

// イベントタイプの表示設定
export const EVENT_STYLES = {
  start:      { color: '#6366f1', label: 'スタート' },
  sightseeing:{ color: '#3b82f6', label: '観光' },
  gourmet:    { color: '#f97316', label: 'グルメ' },
  quiz:       { color: '#22c55e', label: 'クイズ' },
  points:     { color: '#fbbf24', label: 'ポイント' },
  advance:    { color: '#a855f7', label: '前進' },
  retreat:    { color: '#a855f7', label: '後退' },
  skip:       { color: '#a855f7', label: '休み' },
  goal:       { color: '#f472b6', label: 'ゴール' }
};
