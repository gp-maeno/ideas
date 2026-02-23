// 東京観光スゴロク - メインロジック
import { SPOTS, QUIZZES, CONFIG, EVENT_STYLES } from './data.js';

// === DOM構築ヘルパー ===

/** HTML要素を作成するヘルパー */
const el = (tag, attrs = {}, children = []) => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  }
  return element;
};

/** テキストノードを作成 */
const text = (str) => document.createTextNode(str);

// === 状態管理 ===

/** 初期状態を生成 */
const createInitialState = () => ({
  points: CONFIG.initialPoints,
  position: 1,
  lap: 1,
  skipNextTurn: false,
  lastLoginDate: null
});

/** localStorageから状態を読み込み */
const loadState = () => {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw);
    if (typeof saved.points !== 'number' || typeof saved.position !== 'number') {
      return createInitialState();
    }
    return { ...createInitialState(), ...saved };
  } catch {
    return createInitialState();
  }
};

/** localStorageに状態を保存 */
const saveState = (state) => {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
  } catch {
    // localStorage使用不可の場合は無視
  }
};

// ゲーム状態（不変更新パターン）
let gameState = loadState();

/** 状態を更新し保存する */
const updateState = (updater) => {
  gameState = { ...gameState, ...updater };
  saveState(gameState);
  renderUI();
};

// === DOM参照 ===
const $ = (id) => document.getElementById(id);
const pointsDisplay = $('pointsDisplay');
const lapDisplay = $('lapDisplay');
const diceButton = $('diceButton');
const diceResult = $('diceResult');
const mapArea = $('mapArea');
const overlay = $('overlay');
const bottomSheet = $('bottomSheet');
const sheetContent = $('sheetContent');
const noPointsMessage = $('noPointsMessage');
const dailyBonusModal = $('dailyBonusModal');
const dailyBonusClose = $('dailyBonusClose');
const lapClear = $('lapClear');
const skipTurnOverlay = $('skipTurnOverlay');
const resetButton = $('resetButton');
const routeLinesGroup = $('routeLines');
const spotNodesGroup = $('spotNodes');
const playerLayer = $('playerLayer');

// アニメーション中フラグ
let isAnimating = false;

// === SVGマップ描画 ===

/** SVG要素を作成するヘルパー */
const svgEl = (tag, attrs = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  return element;
};

/** ルート線を描画 */
const drawRouteLines = () => {
  for (let i = 0; i < SPOTS.length; i++) {
    const from = SPOTS[i];
    const to = SPOTS[(i + 1) % SPOTS.length];
    const line = svgEl('line', {
      x1: from.x, y1: from.y,
      x2: to.x, y2: to.y,
      class: 'route-line'
    });
    routeLinesGroup.appendChild(line);
  }
};

/** スポットノードを描画 */
const drawSpotNodes = () => {
  for (const spot of SPOTS) {
    const style = EVENT_STYLES[spot.eventType];
    const g = svgEl('g', {
      class: 'spot-node',
      'data-id': spot.id,
      transform: `translate(${spot.x}, ${spot.y})`
    });

    const bgCircle = svgEl('circle', { r: 28, class: 'spot-circle-bg' });
    const circle = svgEl('circle', {
      r: 26, fill: 'none', stroke: style.color,
      class: 'spot-circle', style: `color: ${style.color}`
    });

    const emoji = svgEl('text', { class: 'spot-emoji', dy: '1' });
    emoji.textContent = spot.emoji;

    const label = svgEl('text', { y: 42, class: 'spot-label' });
    label.textContent = spot.name;

    const badge = svgEl('text', { y: 56, class: 'spot-event-badge' });
    if (spot.eventType === 'points') {
      badge.textContent = `+${spot.points}pt`;
      badge.setAttribute('fill', style.color);
    } else {
      badge.textContent = style.label;
    }

    g.appendChild(bgCircle);
    g.appendChild(circle);
    g.appendChild(emoji);
    g.appendChild(label);
    g.appendChild(badge);
    spotNodesGroup.appendChild(g);
  }
};

/** プレイヤーコマを描画 */
const drawPlayerPiece = () => {
  const spot = SPOTS[gameState.position - 1];
  const g = svgEl('g', { id: 'playerPiece' });

  const outer = svgEl('circle', {
    cx: spot.x, cy: spot.y, r: 14, class: 'player-piece-outer'
  });
  const inner = svgEl('circle', {
    cx: spot.x, cy: spot.y, r: 10, fill: 'white'
  });
  const emoji = svgEl('text', {
    x: spot.x, y: spot.y, class: 'player-piece-emoji', dy: '1'
  });
  emoji.textContent = '🚶';

  g.appendChild(outer);
  g.appendChild(inner);
  g.appendChild(emoji);
  playerLayer.appendChild(g);
};

/** 現在地のスポットノードにハイライトをつける */
const updateCurrentSpot = () => {
  const nodes = spotNodesGroup.querySelectorAll('.spot-node');
  for (const node of nodes) {
    const id = parseInt(node.getAttribute('data-id'), 10);
    node.classList.toggle('is-current', id === gameState.position);
  }
};

/** 現在地にオートスクロール */
const scrollToCurrentSpot = () => {
  const spot = SPOTS[gameState.position - 1];
  const container = mapArea;
  const svgContainer = container.querySelector('.map-svg-container');

  const scaleX = svgContainer.offsetWidth / 800;
  const scaleY = svgContainer.offsetHeight / 1000;

  const targetX = spot.x * scaleX - container.offsetWidth / 2;
  const targetY = spot.y * scaleY - container.offsetHeight / 2;

  container.scrollTo({
    left: Math.max(0, targetX),
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
};

// === UI更新 ===

const renderUI = () => {
  pointsDisplay.textContent = String(gameState.points);
  lapDisplay.textContent = `${gameState.lap}周目`;

  const canRoll = gameState.points >= CONFIG.diceCost && !isAnimating;
  diceButton.disabled = !canRoll;
  noPointsMessage.classList.toggle('show', gameState.points < CONFIG.diceCost);

  updateCurrentSpot();
};

// === サイコロ ===

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const showDiceResult = (value) => {
  return new Promise((resolve) => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    diceResult.textContent = faces[value - 1];
    diceResult.classList.add('show');
    setTimeout(() => {
      diceResult.classList.remove('show');
      resolve();
    }, 1200);
  });
};

// === コマ移動アニメーション ===

/** コマを1マスずつ移動するアニメーション */
const animateMove = (fromPos, toPos) => {
  return new Promise((resolve) => {
    const piece = document.getElementById('playerPiece');
    if (!piece) { resolve(); return; }

    const outer = piece.querySelector('.player-piece-outer');
    const inner = piece.querySelector('circle:nth-child(2)');
    const emojiEl = piece.querySelector('.player-piece-emoji');

    const steps = [];
    let current = fromPos;
    while (current !== toPos) {
      current = current % CONFIG.totalSpots + 1;
      steps.push(current);
    }

    if (steps.length === 0) { resolve(); return; }

    let stepIndex = 0;
    const moveStep = () => {
      if (stepIndex >= steps.length) { resolve(); return; }

      const spot = SPOTS[steps[stepIndex] - 1];
      outer.setAttribute('cx', spot.x);
      outer.setAttribute('cy', spot.y);
      inner.setAttribute('cx', spot.x);
      inner.setAttribute('cy', spot.y);
      emojiEl.setAttribute('x', spot.x);
      emojiEl.setAttribute('y', spot.y);

      stepIndex++;
      const delay = stepIndex >= steps.length ? 300 : 200;
      setTimeout(moveStep, delay);
    };

    moveStep();
  });
};

// === プレイヤーコマの位置を直接セットする ===

const setPlayerPosition = (pos) => {
  const piece = document.getElementById('playerPiece');
  if (!piece) return;
  const spot = SPOTS[pos - 1];
  piece.querySelector('.player-piece-outer').setAttribute('cx', spot.x);
  piece.querySelector('.player-piece-outer').setAttribute('cy', spot.y);
  piece.querySelector('circle:nth-child(2)').setAttribute('cx', spot.x);
  piece.querySelector('circle:nth-child(2)').setAttribute('cy', spot.y);
  piece.querySelector('.player-piece-emoji').setAttribute('x', spot.x);
  piece.querySelector('.player-piece-emoji').setAttribute('y', spot.y);
};

// === ボトムシート操作 ===

/** ボトムシートを表示（DOM要素の配列を受け取る） */
const showSheet = (elements) => {
  return new Promise((resolve) => {
    // 子要素をクリア
    while (sheetContent.firstChild) {
      sheetContent.removeChild(sheetContent.firstChild);
    }

    for (const child of elements) {
      sheetContent.appendChild(child);
    }

    overlay.classList.add('show');
    bottomSheet.classList.add('show');

    // アクションボタンを探してクリックで閉じる
    const actionBtn = sheetContent.querySelector('.sheet-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        closeSheet();
        resolve();
      }, { once: true });
    }

    // オーバーレイタップでも閉じる
    const overlayHandler = () => {
      closeSheet();
      resolve();
    };
    overlay.addEventListener('click', overlayHandler, { once: true });
  });
};

/** ボトムシートを閉じる */
const closeSheet = () => {
  overlay.classList.remove('show');
  bottomSheet.classList.remove('show');
};

// === カードヘッダー構築ヘルパー ===

const buildCardHeader = (spot, eventType) => {
  const style = EVENT_STYLES[eventType];
  const header = el('div', {
    className: 'card-header',
    style: { background: `linear-gradient(135deg, ${style.color}33, ${style.color}11)` }
  }, [
    el('span', { className: 'card-emoji' }, [spot.emoji || '💰']),
    el('div', { className: 'card-title' }, [spot.name]),
    el('div', { className: 'card-area' }, [spot.area])
  ]);
  return header;
};

const buildActionButton = (label) => {
  return el('button', { className: 'sheet-action' }, [label]);
};

// === イベント処理 ===

/** 観光カードイベント */
const handleSightseeing = async (spot) => {
  const children = [
    buildCardHeader(spot, 'sightseeing'),
    el('div', { className: 'card-description' }, [spot.description])
  ];

  if (spot.trivia) {
    children.push(el('div', { className: 'card-trivia' }, [spot.trivia]));
  }

  children.push(buildActionButton('次へ進む →'));
  await showSheet(children);
};

/** グルメカードイベント */
const handleGourmet = async (spot) => {
  const header = buildCardHeader(spot, 'gourmet');
  // ヘッダーの絵文字を食べ物に差し替え
  header.querySelector('.card-emoji').textContent = spot.foodEmoji;

  await showSheet([
    header,
    el('div', { className: 'food-name' }, [spot.food]),
    el('div', { className: 'food-description' }, [spot.foodDescription]),
    buildActionButton('次へ進む →')
  ]);
};

/** ポイント追加イベント */
const handlePoints = async (spot) => {
  updateState({ points: gameState.points + spot.points });
  bumpPoints();

  const children = [
    buildCardHeader(spot, 'points')
  ];

  if (spot.description) {
    children.push(el('div', { className: 'card-description' }, [spot.description]));
  }

  children.push(
    el('div', { className: 'points-gain' }, [`+${spot.points}pt`]),
    buildActionButton('次へ進む →')
  );

  await showSheet(children);
};

/** クイズイベント */
const handleQuiz = async (spot) => {
  const quizList = QUIZZES[spot.id];
  if (!quizList || quizList.length === 0) return;

  const quiz = quizList[Math.floor(Math.random() * quizList.length)];

  return new Promise((resolve) => {
    const header = buildCardHeader(spot, 'quiz');
    header.querySelector('.card-area').textContent = `${spot.area} ─ クイズ`;

    const questionEl = el('div', { className: 'quiz-question' }, [quiz.question]);

    const resultEl = el('div', { className: 'quiz-result' });
    const explanationEl = el('div', { className: 'quiz-explanation' }, [quiz.explanation]);
    const nextBtn = el('button', {
      className: 'sheet-action',
      style: { display: 'none' }
    }, ['次へ進む →']);

    let answered = false;
    const choiceButtons = [];

    const choicesContainer = el('div', { className: 'quiz-choices' });
    for (let i = 0; i < quiz.choices.length; i++) {
      const btn = el('button', {
        className: 'quiz-choice',
        'data-index': String(i)
      }, [quiz.choices[i]]);

      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        for (const c of choiceButtons) { c.disabled = true; }

        const isCorrect = i === quiz.correctIndex;
        choiceButtons[quiz.correctIndex].classList.add('correct');
        if (!isCorrect) { btn.classList.add('wrong'); }

        if (isCorrect) {
          resultEl.textContent = `⭕ 正解！ +${CONFIG.quizBonus}pt`;
          resultEl.style.color = 'var(--accent-green)';
          updateState({ points: gameState.points + CONFIG.quizBonus });
          bumpPoints();
        } else {
          resultEl.textContent = '❌ 残念...';
          resultEl.style.color = '#ef4444';
        }
        resultEl.classList.add('show');
        explanationEl.classList.add('show');
        nextBtn.style.display = '';
      });

      choiceButtons.push(btn);
      choicesContainer.appendChild(btn);
    }

    nextBtn.addEventListener('click', () => {
      closeSheet();
      resolve();
    }, { once: true });

    // 子要素をクリアしてからセット
    while (sheetContent.firstChild) {
      sheetContent.removeChild(sheetContent.firstChild);
    }
    sheetContent.appendChild(header);
    sheetContent.appendChild(questionEl);
    sheetContent.appendChild(choicesContainer);
    sheetContent.appendChild(resultEl);
    sheetContent.appendChild(explanationEl);
    sheetContent.appendChild(nextBtn);

    overlay.classList.add('show');
    bottomSheet.classList.add('show');
    // クイズ中はオーバーレイタップで閉じない
  });
};

/** 前進イベント */
const handleAdvance = async (spot) => {
  const children = [
    buildCardHeader(spot, 'advance')
  ];
  if (spot.description) {
    children.push(el('div', { className: 'card-description' }, [spot.description]));
  }
  children.push(
    el('div', { className: 'event-message' }, [`🎯 ${spot.advanceBy}マス進む！`]),
    buildActionButton('進む →')
  );

  await showSheet(children);

  const newPos = ((gameState.position - 1 + spot.advanceBy) % CONFIG.totalSpots) + 1;
  await animateMove(gameState.position, newPos);
  updateState({ position: newPos });
  scrollToCurrentSpot();
};

/** 後退イベント */
const handleRetreat = async (spot) => {
  const children = [
    buildCardHeader(spot, 'retreat')
  ];
  if (spot.description) {
    children.push(el('div', { className: 'card-description' }, [spot.description]));
  }
  children.push(
    el('div', { className: 'event-message' }, [`😅 ${spot.retreatBy}マス戻る...`]),
    buildActionButton('OK')
  );

  await showSheet(children);

  let newPos = gameState.position - spot.retreatBy;
  if (newPos < 1) newPos += CONFIG.totalSpots;
  setPlayerPosition(newPos);
  updateState({ position: newPos });
  scrollToCurrentSpot();
};

/** 1回休みイベント */
const handleSkip = async (spot) => {
  updateState({ skipNextTurn: true });

  const children = [
    buildCardHeader(spot, 'skip')
  ];
  if (spot.description) {
    children.push(el('div', { className: 'card-description' }, [spot.description]));
  }
  children.push(
    el('div', { className: 'event-message' }, ['🐼 次のターンは1回休み']),
    buildActionButton('OK')
  );

  await showSheet(children);
};

/** ゴール（ループ）イベント */
const handleGoal = async (spot) => {
  const newLap = gameState.lap + 1;
  const newPoints = gameState.points + CONFIG.lapBonus;
  updateState({ lap: newLap, points: newPoints });
  bumpPoints();

  // 周回クリア演出
  $('lapClearText').textContent = `${gameState.lap - 1}周クリア！`;
  lapClear.classList.add('show');
  spawnConfetti();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  lapClear.classList.remove('show');

  const children = [
    buildCardHeader(spot, 'goal')
  ];
  if (spot.description) {
    children.push(el('div', { className: 'card-description' }, [spot.description]));
  }
  children.push(
    el('div', { className: 'points-gain' }, [`🎉 周回ボーナス +${CONFIG.lapBonus}pt`]),
    el('div', { className: 'event-message' }, [`${gameState.lap}周目スタート！`]),
    buildActionButton('続ける →')
  );

  await showSheet(children);
};

/** イベントディスパッチ */
const handleEvent = async (spot) => {
  switch (spot.eventType) {
    case 'sightseeing': return handleSightseeing(spot);
    case 'gourmet': return handleGourmet(spot);
    case 'points': return handlePoints(spot);
    case 'quiz': return handleQuiz(spot);
    case 'advance': return handleAdvance(spot);
    case 'retreat': return handleRetreat(spot);
    case 'skip': return handleSkip(spot);
    case 'goal': return handleGoal(spot);
    case 'start': return;
  }
};

// === ゲームフロー ===

/** サイコロを振って1ターン進行 */
const playTurn = async () => {
  if (isAnimating) return;
  if (gameState.points < CONFIG.diceCost) return;

  isAnimating = true;
  diceButton.disabled = true;

  // 1回休みチェック
  if (gameState.skipNextTurn) {
    updateState({ skipNextTurn: false });

    skipTurnOverlay.classList.add('show');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    skipTurnOverlay.classList.remove('show');

    isAnimating = false;
    renderUI();
    return;
  }

  // ポイント消費
  updateState({ points: gameState.points - CONFIG.diceCost });

  // サイコロを振る
  const diceValue = rollDice();
  await showDiceResult(diceValue);

  // 移動先を計算
  const fromPos = gameState.position;
  const toPos = ((fromPos - 1 + diceValue) % CONFIG.totalSpots) + 1;

  // 周回チェック（20を超えた場合、ゴールマスに止まらず通過）
  const crossedGoal = fromPos + diceValue > CONFIG.totalSpots;

  // コマ移動アニメーション
  await animateMove(fromPos, toPos);
  updateState({ position: toPos });
  scrollToCurrentSpot();

  // ゴールマスを通過した場合（ゴールマスに止まった場合はhandleGoalで処理）
  if (crossedGoal && toPos !== CONFIG.totalSpots) {
    const newLap = gameState.lap + 1;
    const newPoints = gameState.points + CONFIG.lapBonus;
    updateState({ lap: newLap, points: newPoints });
    bumpPoints();

    $('lapClearText').textContent = `${gameState.lap - 1}周クリア！`;
    lapClear.classList.add('show');
    spawnConfetti();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    lapClear.classList.remove('show');
  }

  // イベント発火
  const spot = SPOTS[toPos - 1];
  await handleEvent(spot);

  isAnimating = false;
  renderUI();
};

// === デイリーボーナス ===

const checkDailyBonus = () => {
  const today = new Date().toISOString().slice(0, 10);

  if (gameState.lastLoginDate === today) return;

  const isFirstVisit = gameState.lastLoginDate === null;

  if (isFirstVisit) {
    // 初回: ポイント加算なし（初期ポイント50ptのみ）、日付だけ記録
    updateState({ lastLoginDate: today });
  } else {
    // 2回目以降: デイリーボーナス付与
    updateState({
      points: gameState.points + CONFIG.dailyBonus,
      lastLoginDate: today
    });

    setTimeout(() => {
      dailyBonusModal.classList.add('show');
    }, 500);
  }
};

// === 演出 ===

const bumpPoints = () => {
  pointsDisplay.classList.remove('bump');
  void pointsDisplay.offsetWidth;
  pointsDisplay.classList.add('bump');
};

const spawnConfetti = () => {
  const colors = ['#f472b6', '#fbbf24', '#3b82f6', '#22c55e', '#a855f7', '#f97316'];

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-10 - Math.random() * 20}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1.5 + Math.random() * 1}s`;
    document.body.appendChild(piece);

    piece.addEventListener('animationend', () => piece.remove());
  }
};

// === リセット ===

const resetGame = () => {
  if (!confirm('ゲームデータをリセットしますか？\nポイントや進行状況が全て初期化されます。')) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  gameState = { ...createInitialState(), lastLoginDate: today };
  saveState(gameState);

  setPlayerPosition(1);
  renderUI();
  scrollToCurrentSpot();
};

// === 初期化 ===

const init = () => {
  drawRouteLines();
  drawSpotNodes();
  drawPlayerPiece();

  renderUI();

  setTimeout(() => scrollToCurrentSpot(), 100);

  checkDailyBonus();

  diceButton.addEventListener('click', playTurn);
  dailyBonusClose.addEventListener('click', () => {
    dailyBonusModal.classList.remove('show');
    bumpPoints();
  });
  resetButton.addEventListener('click', resetGame);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
