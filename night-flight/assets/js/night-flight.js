/**
 * Tokyo Night Flight
 * PLATEAU 3D都市モデルで夜の東京上空をシネマティックに飛行する体験
 */

// ================================================================
// 設定・定数
// ================================================================

// Cesium Ionアクセストークン（リファラー制限: gp-maeno.github.io）
const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MzZiNWM3Zi05NDAxLTQ3YTMtYjg2Yi1kOTkyZTZhNjk0OWUiLCJpZCI6MzkzMTYzLCJpYXQiOjE3NzE4MDg0OTd9.PjwDjZ_7Lgj4V1nQX5HcxAvNoypH2S92Q2tkE5Z2WWA';

// Japan 3D Buildings (PLATEAU) のCesium Ion Asset ID
// Asset Depotから追加したアセットのIDに差し替える
const JAPAN_BUILDINGS_ASSET_ID = 2602291;

// 飛行ウェイポイント
const WAYPOINTS = [
  { name: '東京湾アプローチ', lon: 139.770, lat: 35.620, height: 2000, heading: 330, pitch: -15 },
  { name: '東京タワー',       lon: 139.745, lat: 35.659, height: 600,  heading: 350, pitch: -20 },
  { name: '渋谷',             lon: 139.700, lat: 35.660, height: 500,  heading: 300, pitch: -15 },
  { name: '新宿',             lon: 139.703, lat: 35.694, height: 700,  heading: 45,  pitch: -10 },
  { name: 'スカイツリー',     lon: 139.811, lat: 35.710, height: 800,  heading: 120, pitch: -15 },
  { name: 'お台場',           lon: 139.764, lat: 35.637, height: 500,  heading: 200, pitch: -12 },
  { name: '東京湾上昇',       lon: 139.770, lat: 35.620, height: 1500, heading: 330, pitch: -10 },
];

// 飛行設定
const FLIGHT_CONFIG = {
  defaultSpeed: 1.0,
  minSpeed: 0.25,
  maxSpeed: 4.0,
  segmentDuration: 15, // 各セグメントの秒数（speed=1.0のとき）
};

// ================================================================
// 状態管理
// ================================================================
const state = {
  mode: 'auto',
  speed: FLIGHT_CONFIG.defaultSpeed,
  muted: false,
  loading: true,
  audioStarted: false,
};

let viewer = null;
let buildingsTileset = null;
let audioContext = null;
let masterGain = null;
let flightStartTime = 0;
let currentLocationName = '';

// ================================================================
// ローディング管理
// ================================================================
function updateLoadProgress(percent, message) {
  const bar = document.getElementById('load-progress');
  const msg = document.getElementById('load-message');
  if (bar) bar.style.width = `${percent}%`;
  if (msg) msg.textContent = message;
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('fade-out');
    setTimeout(() => { loading.style.display = 'none'; }, 800);
  }
  // フライトUIを表示
  const ui = document.getElementById('flight-ui');
  if (ui) ui.classList.add('visible');
  state.loading = false;
}

function showError(message) {
  const msg = document.getElementById('load-message');
  if (msg) {
    msg.textContent = message;
    msg.classList.add('error');
  }
}

// ================================================================
// Cesium初期化
// ================================================================
async function initCesium() {
  updateLoadProgress(10, 'CesiumJSを初期化中...');

  Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

  viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    creditContainer: document.createElement('div'),
    baseLayer: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });

  const scene = viewer.scene;

  // 黒背景（衛星画像なし）
  scene.globe.baseColor = Cesium.Color.BLACK;
  scene.sun.show = false;
  scene.moon.show = false;
  scene.skyAtmosphere.show = false;

  // フォグ（水平線付近の霞み）
  scene.fog.enabled = true;
  scene.fog.density = 0.0003;

  // パフォーマンス設定
  viewer.resolutionScale = Math.min(window.devicePixelRatio, 2.0);
  scene.globe.maximumScreenSpaceError = 2;

  // カメラ初期位置（東京湾上空）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      WAYPOINTS[0].lon, WAYPOINTS[0].lat, WAYPOINTS[0].height
    ),
    orientation: {
      heading: Cesium.Math.toRadians(WAYPOINTS[0].heading),
      pitch: Cesium.Math.toRadians(WAYPOINTS[0].pitch),
      roll: 0,
    },
  });

  updateLoadProgress(30, '3D建物データを読み込み中...');
}

// ================================================================
// 3D Buildings読み込み
// ================================================================
async function loadBuildings() {
  try {
    // Cesium Ion経由でJapan 3D Buildings（PLATEAU）を読み込み
    buildingsTileset = await Cesium.Cesium3DTileset.fromIonAssetId(
      JAPAN_BUILDINGS_ASSET_ID
    );
    viewer.scene.primitives.add(buildingsTileset);

    // 夜景シェーダーを適用
    applyNightShader(buildingsTileset);

    updateLoadProgress(60, '夜景エフェクトを設定中...');
    return true;
  } catch (error) {
    console.error('3D Buildings読み込み失敗:', error);

    // フォールバック: Cesium OSM Buildingsを試行
    try {
      console.warn('OSM Buildingsにフォールバック');
      buildingsTileset = await Cesium.createOsmBuildingsAsync();
      viewer.scene.primitives.add(buildingsTileset);
      applyNightShader(buildingsTileset);
      updateLoadProgress(60, '夜景エフェクトを設定中...');
      return true;
    } catch (fallbackError) {
      console.error('OSM Buildings フォールバックも失敗:', fallbackError);
      showError('3D建物データの読み込みに失敗しました。Cesium Ionトークンを確認してください。');
      return false;
    }
  }
}

// ================================================================
// 夜景シェーダー
// ================================================================
function applyNightShader(tileset) {
  tileset.customShader = new Cesium.CustomShader({
    lightingModel: Cesium.LightingModel.UNLIT,
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        // モデル座標でプロシージャルな窓パターンを生成
        vec3 pos = fsInput.attributes.positionMC;

        // 壁面の基本色（暗いネイビー）
        vec3 wallColor = vec3(0.03, 0.04, 0.06);

        // 窓グリッド: モデル座標ベース
        float scaleXZ = 0.8;
        float scaleY = 0.8;
        float gridX = fract(pos.x * scaleXZ);
        float gridY = fract(pos.y * scaleY);
        float gridZ = fract(pos.z * scaleXZ);

        // 窓の領域判定（グリッド中央部分が窓）
        float winX = step(0.2, gridX) * step(gridX, 0.7);
        float winY = step(0.3, gridY) * step(gridY, 0.8);
        float winZ = step(0.2, gridZ) * step(gridZ, 0.7);

        // XZ平面・YZ平面の窓を合成
        float isWindow = max(winX * winY, winZ * winY);

        // 座標ベースのハッシュでランダムON/OFF
        vec3 cell = floor(pos * scaleXZ);
        float hash = fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        float windowOn = step(0.4, hash);

        // 窓の色（暖色: 黄〜オレンジ）
        vec3 warmLight = mix(
          vec3(1.0, 0.85, 0.5),
          vec3(1.0, 0.6, 0.3),
          fract(hash * 7.31)
        );

        // 明るさバリエーション
        float brightness = 0.4 + 0.6 * fract(hash * 3.17);

        // 最終色合成
        float windowMask = isWindow * windowOn;
        vec3 finalColor = mix(wallColor, warmLight * brightness, windowMask);

        material.diffuse = finalColor;
        material.emissive = finalColor * 0.8;
      }
    `,
  });
}

// ================================================================
// ポストプロセス
// ================================================================
function setupPostProcess() {
  const scene = viewer.scene;

  // ブルーム（光のにじみ）
  scene.postProcessStages.bloom.enabled = true;
  scene.postProcessStages.bloom.uniforms.glowOnly = false;
  scene.postProcessStages.bloom.uniforms.contrast = 119;
  scene.postProcessStages.bloom.uniforms.brightness = -0.2;
  scene.postProcessStages.bloom.uniforms.delta = 1.0;
  scene.postProcessStages.bloom.uniforms.sigma = 3.0;
  scene.postProcessStages.bloom.uniforms.stepSize = 2.0;

  // ビネット（画面端の暗化）
  const vignetteStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        float d = distance(v_textureCoordinates, vec2(0.5));
        float vignette = smoothstep(0.9, 0.25, d);
        out_FragColor = vec4(color.rgb * vignette, 1.0);
      }
    `,
  });

  // カラーコレクション（ブルーシフト・コントラスト強調）
  const colorStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        color.b = min(1.0, color.b * 1.12);
        color.rgb = (color.rgb - 0.5) * 1.08 + 0.5;
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        out_FragColor = color;
      }
    `,
  });

  scene.postProcessStages.add(vignetteStage);
  scene.postProcessStages.add(colorStage);
}

// ================================================================
// カメラ飛行システム
// ================================================================

// 角度の最短経路補間（ラジアン）
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

// イージング関数（ease-in-out）
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ウェイポイント間の補間
function interpolateFlight(fromWP, toWP, t) {
  const eased = easeInOut(t);

  // 位置の補間
  const fromPos = Cesium.Cartesian3.fromDegrees(fromWP.lon, fromWP.lat, fromWP.height);
  const toPos = Cesium.Cartesian3.fromDegrees(toWP.lon, toWP.lat, toWP.height);
  const position = new Cesium.Cartesian3();
  Cesium.Cartesian3.lerp(fromPos, toPos, eased, position);

  // 向きの補間（角度の巻きつきを考慮）
  const heading = lerpAngle(
    Cesium.Math.toRadians(fromWP.heading),
    Cesium.Math.toRadians(toWP.heading),
    eased
  );
  const pitch = Cesium.Math.lerp(
    Cesium.Math.toRadians(fromWP.pitch),
    Cesium.Math.toRadians(toWP.pitch),
    eased
  );

  return { position, heading, pitch, roll: 0 };
}

// 飛行の更新（毎フレーム呼ばれる）
function updateFlight(timestamp) {
  if (state.mode !== 'auto' || state.loading) return;

  if (flightStartTime === 0) flightStartTime = timestamp;

  const segmentDuration = FLIGHT_CONFIG.segmentDuration / state.speed;
  const elapsed = (timestamp - flightStartTime) / 1000;
  const totalDuration = segmentDuration * WAYPOINTS.length;
  const globalProgress = (elapsed % totalDuration) / totalDuration;

  const totalSegments = WAYPOINTS.length;
  const segmentIndex = Math.floor(globalProgress * totalSegments);
  const segmentProgress = (globalProgress * totalSegments) % 1;

  const fromWP = WAYPOINTS[segmentIndex % totalSegments];
  const toWP = WAYPOINTS[(segmentIndex + 1) % totalSegments];

  const { position, heading, pitch, roll } = interpolateFlight(fromWP, toWP, segmentProgress);

  viewer.camera.setView({
    destination: position,
    orientation: { heading, pitch, roll },
  });

  // 地名ラベルを更新
  updateLocationLabel(fromWP.name);

  // BGMパラメータを高度に応じて更新
  if (state.audioStarted && !state.muted) {
    const carto = Cesium.Cartographic.fromCartesian(position);
    if (carto) updateAudioByAltitude(carto.height);
  }
}

// 地名ラベルの更新
function updateLocationLabel(name) {
  if (name === currentLocationName) return;
  currentLocationName = name;

  const label = document.getElementById('location-label');
  if (!label) return;

  label.classList.remove('visible');
  setTimeout(() => {
    label.textContent = name;
    label.classList.add('visible');
  }, 300);
}

// ================================================================
// 手動操作モード
// ================================================================
function toggleMode() {
  const controller = viewer.scene.screenSpaceCameraController;

  if (state.mode === 'auto') {
    state.mode = 'manual';
    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;
  } else {
    state.mode = 'auto';
    controller.enableRotate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;
    // 最寄りウェイポイントから再開
    flightStartTime = 0;
  }
  updateModeUI();
}

function updateModeUI() {
  const btn = document.getElementById('mode-toggle');
  if (!btn) return;
  btn.textContent = state.mode === 'auto' ? 'AUTO' : 'MANUAL';
  btn.classList.toggle('manual', state.mode === 'manual');
}

// ================================================================
// Web Audio BGM
// ================================================================
function initAudio() {
  if (state.audioStarted) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioContext.destination);

  // アンビエントパッド: 低周波オシレーター
  createPad(55, 'sine', 0.15);
  createPad(82.41, 'sine', 0.1);
  createPad(110, 'triangle', 0.08);
  createPad(146.83, 'sine', 0.05);

  // 高域シマー
  createShimmer(880, 0.02);
  createShimmer(1318.5, 0.015);

  state.audioStarted = true;
}

function createPad(freq, type, volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = type;
  osc.frequency.value = freq;

  // 微細な揺れ（LFO的な効果）
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  lfo.frequency.value = 0.1 + Math.random() * 0.2;
  lfoGain.gain.value = freq * 0.01;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();

  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 1;

  gain.gain.value = volume;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start();
}

function createShimmer(freq, volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const delay = audioContext.createDelay();
  const feedback = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.value = freq;

  filter.type = 'highpass';
  filter.frequency.value = 600;

  delay.delayTime.value = 0.3 + Math.random() * 0.4;
  feedback.gain.value = 0.3;

  gain.gain.value = volume;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  gain.connect(masterGain);
  delay.connect(masterGain);
  osc.start();
}

// 高度に応じてBGMパラメータを変化
function updateAudioByAltitude(height) {
  if (!audioContext || !masterGain) return;
  const normalized = Math.min(1.0, Math.max(0.0, (height - 200) / 2000));
  masterGain.gain.setTargetAtTime(
    0.15 + normalized * 0.2,
    audioContext.currentTime,
    0.5
  );
}

function toggleMute() {
  state.muted = !state.muted;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(
      state.muted ? 0 : 0.3,
      audioContext.currentTime,
      0.1
    );
  }
  updateMuteUI();
}

function updateMuteUI() {
  const btn = document.getElementById('mute-toggle');
  if (!btn) return;
  btn.textContent = state.muted ? 'OFF' : 'BGM';
}

// ================================================================
// 速度制御
// ================================================================
function changeSpeed(delta) {
  state.speed = Math.max(
    FLIGHT_CONFIG.minSpeed,
    Math.min(FLIGHT_CONFIG.maxSpeed, state.speed + delta)
  );
  updateSpeedUI();
}

function updateSpeedUI() {
  const label = document.getElementById('speed-label');
  if (label) label.textContent = `${state.speed.toFixed(1)}x`;
}

// ================================================================
// UI初期化
// ================================================================
function setupUI() {
  document.getElementById('mode-toggle').addEventListener('click', toggleMode);
  document.getElementById('mute-toggle').addEventListener('click', toggleMute);
  document.getElementById('speed-up').addEventListener('click', () => changeSpeed(0.25));
  document.getElementById('speed-down').addEventListener('click', () => changeSpeed(-0.25));

  updateModeUI();
  updateMuteUI();
  updateSpeedUI();
}

// ユーザーの最初のタップ/クリック後にオーディオを開始（ブラウザポリシー対応）
function setupAudioTrigger() {
  const handler = () => {
    if (!state.audioStarted) {
      initAudio();
    } else if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    document.removeEventListener('click', handler);
    document.removeEventListener('touchstart', handler);
  };
  document.addEventListener('click', handler);
  document.addEventListener('touchstart', handler);
}

// ================================================================
// 初期化
// ================================================================
async function init() {
  try {
    await initCesium();

    const success = await loadBuildings();
    if (!success) return;

    updateLoadProgress(70, '夜景エフェクトを設定中...');
    setupPostProcess();

    updateLoadProgress(85, 'Preparing for takeoff...');

    // 自動飛行モード: カメラコントローラーを無効化
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;

    setupUI();
    setupAudioTrigger();

    // 毎フレームの飛行更新
    viewer.scene.preRender.addEventListener(() => {
      updateFlight(performance.now());
    });

    updateLoadProgress(100, 'Ready');

    // 3D Tilesのストリーミング読み込みを考慮し、タイムアウト後にフェードイン
    setTimeout(hideLoading, 2000);

  } catch (error) {
    console.error('初期化エラー:', error);
    showError(`初期化に失敗しました: ${error.message}`);
  }
}

init();
