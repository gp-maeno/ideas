/**
 * Stella - 星座ビューア
 * Three.js ベースの3D星空シミュレーション
 * ジャイロセンサー対応、ヒッパルコス星表ベース、全88星座対応
 */

const DATA_BASE = 'https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/';
const SPHERE_R = 500;

const state = {
  showLines: true, showNames: true, showMilkyWay: true, showGrid: false,
  starBrightness: 2.5, magLimit: 6,
  lat: 35.6812, lon: 139.7671, date: new Date(),
  useGyro: false, selectedConstellation: null,
  gyroAlpha: 0, gyroBeta: 0, gyroGamma: 0
};

let scene, camera, renderer, starPoints, starGeometry;
let constellationLines = {}, constellationLabels = {}, constellationStarIndices = {};
let milkyWayMesh, gridGroup, constellationData = {}, starMap = {}, rawStarData = null;
let touchStartX, touchStartY, camTheta = Math.PI / 2, camPhi = 0;

// カメラアニメーション
let camAnimating = false, camFromTheta = 0, camFromPhi = 0, camToTheta = 0, camToPhi = 0, camAnimT = 0;
const CAM_ANIM_DURATION = 1.0;

// 方向ガイドタイマー
let guideTimer = null;

// ============================================================
// データ読み込み
// ============================================================
async function loadData() {
  const lb = document.getElementById('loadbar');
  lb.style.width = '10%';
  const urls = {
    stars: DATA_BASE + 'stars.6.json',
    lines: DATA_BASE + 'constellations.lines.json',
    names: DATA_BASE + 'constellations.json',
    mw: DATA_BASE + 'mw.json'
  };
  const results = {};
  const keys = Object.keys(urls);
  for (let i = 0; i < keys.length; i++) {
    try {
      const r = await fetch(urls[keys[i]]);
      results[keys[i]] = await r.json();
    } catch (e) {
      console.warn(`Failed: ${keys[i]}`, e);
      results[keys[i]] = null;
    }
    lb.style.width = (10 + (i + 1) / keys.length * 60) + '%';
  }
  return results;
}

// ============================================================
// 座標変換
// ============================================================
function lonToRA(lon) { return lon < 0 ? 360 + lon : lon; }

function radecToXYZ(ra, dec, R) {
  const r = ra * Math.PI / 180, d = dec * Math.PI / 180;
  return new THREE.Vector3(R * Math.cos(d) * Math.cos(r), R * Math.sin(d), -R * Math.cos(d) * Math.sin(r));
}

function bvToColor(bv) {
  bv = Math.max(-0.4, Math.min(2.0, parseFloat(bv) || 0));
  let r, g, b;
  if (bv < 0) { r = 0.7 - bv * 0.5; g = 0.8 - bv * 0.3; b = 1.0; }
  else if (bv < 0.4) { r = 0.8 + bv * 0.5; g = 0.85 + bv * 0.2; b = 1.0 - bv * 0.3; }
  else if (bv < 0.8) { r = 1.0; g = 1.0 - (bv - 0.4) * 0.6; b = 0.7 - (bv - 0.4) * 0.8; }
  else { r = 1.0; g = 0.7 - (bv - 0.8) * 0.4; b = Math.max(0.1, 0.3 - (bv - 0.8) * 0.3); }
  return new THREE.Color(Math.min(1, r), Math.min(1, g), Math.min(1, b));
}

function magToSize(mag) {
  if (mag > state.magLimit) return 0;
  return Math.max(0.8, (7 - mag) * state.starBrightness);
}

function julianDate(d) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  let yy = y, mm = m;
  if (mm <= 2) { yy--; mm += 12; }
  const A = Math.floor(yy / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + dd + h / 24 + B - 1524.5;
}

function greenwichSiderealTime(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  let g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * 0.000387933 - T * T * T / 38710000;
  return ((g % 360) + 360) % 360;
}

function localSiderealTime(jd, lon) {
  return (greenwichSiderealTime(jd) + lon + 360) % 360;
}

// ============================================================
// シーン初期化
// ============================================================
function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020208);
  document.body.appendChild(renderer.domElement);
}

// ============================================================
// 星の描画
// ============================================================
function createStars(data) {
  if (!data || !data.features) return;
  rawStarData = data;
  const n = data.features.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), baseCol = new Float32Array(n * 3), sz = new Float32Array(n);
  data.features.forEach((f, i) => {
    const ra = lonToRA(f.geometry.coordinates[0]), dec = f.geometry.coordinates[1];
    const p = radecToXYZ(ra, dec, SPHERE_R);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    const c = bvToColor(f.properties.bv);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    baseCol[i * 3] = c.r; baseCol[i * 3 + 1] = c.g; baseCol[i * 3 + 2] = c.b;
    sz[i] = magToSize(f.properties.mag);
    starMap[f.id] = { index: i, ra, dec, pos: p, mag: f.properties.mag };
  });
  starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  starGeometry.setAttribute('baseColor', new THREE.BufferAttribute(baseCol, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sz, 1));

  const vs = `attribute float size;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(250.0/-mv.z);if(size<=0.0){gl_Position=vec4(2.0,2.0,2.0,1.0);return;}gl_Position=projectionMatrix*mv;}`;
  const fs = `varying vec3 vColor;void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;float a=smoothstep(0.5,0.0,d);float g=exp(-d*3.5)*0.7;float t=a+g;gl_FragColor=vec4(vColor*t,t*0.85);}`;

  starPoints = new THREE.Points(starGeometry, new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs,
    vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  scene.add(starPoints);
}

function updateStarSizes() {
  if (!rawStarData || !starGeometry) return;
  const sz = starGeometry.attributes.size;
  rawStarData.features.forEach((f, i) => { sz.array[i] = magToSize(f.properties.mag); });
  sz.needsUpdate = true;
  // ハイライト中なら再適用
  if (state.selectedConstellation) applyHighlight(state.selectedConstellation);
}

// ============================================================
// 星座線の描画
// ============================================================
function createConstellationLines(linesData, namesData) {
  if (!linesData || !linesData.features) return;
  const nameMap = {};
  if (namesData && namesData.features) {
    namesData.features.forEach(f => {
      nameMap[f.id] = { name: f.properties.name, ja: f.properties.ja || f.properties.name, display: f.properties.display };
    });
  }
  linesData.features.forEach(f => {
    const id = f.id, info = nameMap[id] || { name: id, ja: id };
    constellationData[id] = info;
    const coords = f.geometry.coordinates, lp = [];
    const vertexCoords = new Set();
    coords.forEach(seg => {
      for (let i = 0; i < seg.length - 1; i++) {
        const p1 = radecToXYZ(lonToRA(seg[i][0]), seg[i][1], SPHERE_R * 0.998);
        const p2 = radecToXYZ(lonToRA(seg[i + 1][0]), seg[i + 1][1], SPHERE_R * 0.998);
        lp.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
      seg.forEach(c => vertexCoords.add(c[0].toFixed(2) + ',' + c[1].toFixed(2)));
    });

    // 星座の頂点に最も近い星を特定
    const matched = [];
    if (rawStarData) {
      vertexCoords.forEach(k => {
        const [lo, la] = k.split(',').map(Number);
        let best = 1.0, bi = -1;
        rawStarData.features.forEach((sf, si) => {
          const d = Math.sqrt((sf.geometry.coordinates[0] - lo) ** 2 + (sf.geometry.coordinates[1] - la) ** 2);
          if (d < best) { best = d; bi = si; }
        });
        if (bi >= 0) matched.push(bi);
      });
    }
    constellationStarIndices[id] = [...new Set(matched)];

    if (!lp.length) return;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const lines = new THREE.LineSegments(geom, new THREE.LineBasicMaterial({
      color: 0x4080c0, transparent: true, opacity: 0.25,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    lines.visible = state.showLines;
    scene.add(lines);
    constellationLines[id] = lines;

    if (info.display && info.display.length >= 2) {
      constellationLabels[id] = {
        pos: radecToXYZ(lonToRA(info.display[0] || 0), info.display[1] || 0, SPHERE_R * 0.99),
        text: info.ja
      };
    }
  });
}

// ============================================================
// 天の川
// ============================================================
function createMilkyWay(mwData) {
  if (!mwData || !mwData.features) return;
  const N = 15000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sz = new Float32Array(N);
  const ac = [];
  mwData.features.forEach(f => {
    if (f.geometry && f.geometry.coordinates) {
      f.geometry.coordinates.forEach(p => {
        const r = Array.isArray(p[0][0]) ? p[0] : p;
        r.forEach(c => ac.push(c));
      });
    }
  });
  for (let i = 0; i < N; i++) {
    let ra, dec;
    if (ac.length > 0 && Math.random() < 0.7) {
      const b = ac[Math.floor(Math.random() * ac.length)];
      ra = lonToRA(b[0]) + (Math.random() - 0.5) * 15;
      dec = b[1] + (Math.random() - 0.5) * 8;
    } else {
      const gl = Math.random() * 360, gb = (Math.random() - 0.5) * 12;
      const l = gl * Math.PI / 180, b = gb * Math.PI / 180;
      const NR = 192.85948 * Math.PI / 180, ND = 27.12825 * Math.PI / 180, AN = 32.93192 * Math.PI / 180;
      const sd = Math.sin(ND) * Math.sin(b) + Math.cos(ND) * Math.cos(b) * Math.cos(l - AN);
      dec = Math.asin(sd) * 180 / Math.PI;
      const y = Math.cos(b) * Math.sin(l - AN);
      const x = Math.cos(ND) * Math.sin(b) - Math.sin(ND) * Math.cos(b) * Math.cos(l - AN);
      ra = (Math.atan2(y, x) + NR) * 180 / Math.PI;
      ra = ((ra % 360) + 360) % 360;
    }
    const p = radecToXYZ(ra, dec, SPHERE_R * 0.997 + Math.random() * 2);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    const br = 0.3 + Math.random() * 0.4;
    col[i * 3] = br * (0.7 + Math.random() * 0.3);
    col[i * 3 + 1] = br * (0.75 + Math.random() * 0.25);
    col[i * 3 + 2] = br * (0.85 + Math.random() * 0.15);
    sz[i] = 1.0 + Math.random() * 3.0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sz, 1));

  const vs = `attribute float size;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(150.0/-mv.z);gl_Position=projectionMatrix*mv;}`;
  const fs = `varying vec3 vColor;void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;float a=exp(-d*3.0)*0.25;gl_FragColor=vec4(vColor,a);}`;

  milkyWayMesh = new THREE.Points(geom, new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs,
    vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  milkyWayMesh.visible = state.showMilkyWay;
  scene.add(milkyWayMesh);
}

// ============================================================
// 地平線グリッド
// ============================================================
function createHorizonGrid() {
  gridGroup = new THREE.Group();
  gridGroup.name = 'grid';
  gridGroup.visible = state.showGrid;
  for (let alt = 0; alt <= 80; alt += 20) {
    const pts = [];
    for (let az = 0; az <= 360; az += 2) {
      const a = az * Math.PI / 180, al = alt * Math.PI / 180, r = SPHERE_R * 0.99;
      pts.push(new THREE.Vector3(r * Math.cos(al) * Math.sin(a), r * Math.sin(al), -r * Math.cos(al) * Math.cos(a)));
    }
    gridGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x304060, transparent: true, opacity: 0.15 })
    ));
  }
  scene.add(gridGroup);
}

// ============================================================
// カメラ制御 & ジャイロ
// ============================================================
function updateCameraFromAngles() {
  if (camAnimating) {
    // イージング付きスムーズアニメーション
    camAnimT += 1 / 60 / CAM_ANIM_DURATION;
    if (camAnimT >= 1) { camAnimT = 1; camAnimating = false; }
    const t = camAnimT < 0.5 ? 2 * camAnimT * camAnimT : (1 - Math.pow(-2 * camAnimT + 2, 2) / 2);
    camTheta = camFromTheta + (camToTheta - camFromTheta) * t;
    // 最短経路でphi回転
    let dPhi = camToPhi - camFromPhi;
    if (dPhi > Math.PI) dPhi -= 2 * Math.PI;
    if (dPhi < -Math.PI) dPhi += 2 * Math.PI;
    camPhi = camFromPhi + dPhi * t;
  }
  const target = new THREE.Vector3(
    Math.sin(camTheta) * Math.cos(camPhi),
    Math.cos(camTheta),
    Math.sin(camTheta) * Math.sin(camPhi)
  );
  camera.lookAt(target.multiplyScalar(SPHERE_R));
}

function startCameraAnimation(toTheta, toPhi) {
  camFromTheta = camTheta; camFromPhi = camPhi;
  camToTheta = toTheta; camToPhi = toPhi;
  camAnimT = 0; camAnimating = true;
}

function setupGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.getElementById('gyroPrompt').classList.remove('hidden');
    document.getElementById('gyroBtn').addEventListener('click', async () => {
      try {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p === 'granted') enableGyro();
      } catch (e) { /* ユーザーが拒否 */ }
      document.getElementById('gyroPrompt').classList.add('hidden');
    });
  } else if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', e => {
      if (e.alpha !== null) enableGyro();
    }, { once: true });
  }
}

function enableGyro() {
  state.useGyro = true;
  window.addEventListener('deviceorientation', e => {
    state.gyroAlpha = (e.alpha || 0) * Math.PI / 180;
    state.gyroBeta = (e.beta || 0) * Math.PI / 180;
    state.gyroGamma = (e.gamma || 0) * Math.PI / 180;
  });
}

function updateCameraFromGyro() {
  if (!state.useGyro) return;
  camera.quaternion.setFromEuler(new THREE.Euler(state.gyroBeta - Math.PI / 2, state.gyroAlpha, -state.gyroGamma, 'YXZ'));
}

// ============================================================
// タッチ操作
// ============================================================
function setupTouch() {
  const el = renderer.domElement;
  let touching = false;

  el.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touching = true; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
      camAnimating = false;
    }
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (!touching || state.useGyro) return;
    const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
    camPhi -= dx * 0.005;
    camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta + dy * 0.005));
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener('touchend', () => { touching = false; }, { passive: true });

  // マウス操作
  let md = false;
  el.addEventListener('mousedown', e => { md = true; touchStartX = e.clientX; touchStartY = e.clientY; camAnimating = false; });
  el.addEventListener('mousemove', e => {
    if (!md || state.useGyro) return;
    camPhi -= (e.clientX - touchStartX) * 0.003;
    camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta + (e.clientY - touchStartY) * 0.003));
    touchStartX = e.clientX; touchStartY = e.clientY;
  });
  el.addEventListener('mouseup', () => { md = false; });
}

// ============================================================
// 天球回転
// ============================================================
function updateSkyRotation() {
  if (!starPoints) return;
  const jd = julianDate(state.date), lst = localSiderealTime(jd, state.lon);
  const latR = state.lat * Math.PI / 180, lstR = lst * Math.PI / 180;
  [starPoints, milkyWayMesh, ...Object.values(constellationLines)].forEach(o => {
    if (!o) return;
    o.rotation.set(0, 0, 0);
    o.rotation.x = -(Math.PI / 2 - latR);
    o.rotation.y = -lstR;
  });
}

// ============================================================
// 画面中央の星座を自動検出
// ============================================================
function getConstellationAtCenter() {
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(camera.quaternion);

  let bestId = null, bestDot = -2;
  const ids = Object.keys(constellationLabels);
  if (ids.length === 0 || !starPoints) return null;

  const skyMatrix = new THREE.Matrix4();
  skyMatrix.makeRotationFromEuler(starPoints.rotation);

  for (const id of ids) {
    const lbl = constellationLabels[id];
    const worldPos = lbl.pos.clone().applyMatrix4(skyMatrix).normalize();
    const dot = worldPos.dot(dir);
    if (dot > bestDot) { bestDot = dot; bestId = id; }
  }

  // 中央から約30度以内の場合のみ返す
  return bestDot > 0.85 ? bestId : null;
}

// ============================================================
// ハイライト管理
// ============================================================
function applyHighlight(id) {
  if (!id) return;
  // 星座線をハイライト
  if (constellationLines[id]) {
    constellationLines[id].material.opacity = 0.85;
    constellationLines[id].material.color.setHex(0xa0d4ff);
  }
  // 星をハイライト
  if (constellationStarIndices[id] && starGeometry) {
    const sz = starGeometry.attributes.size, cl = starGeometry.attributes.color, bc = starGeometry.attributes.baseColor;
    constellationStarIndices[id].forEach(idx => {
      const baseSz = magToSize(rawStarData.features[idx].properties.mag);
      sz.array[idx] = baseSz * 2.5 + 3.0;
      cl.array[idx * 3] = Math.min(1, bc.array[idx * 3] * 1.4 + 0.3);
      cl.array[idx * 3 + 1] = Math.min(1, bc.array[idx * 3 + 1] * 1.3 + 0.3);
      cl.array[idx * 3 + 2] = Math.min(1, bc.array[idx * 3 + 2] * 1.2 + 0.4);
    });
    sz.needsUpdate = true; cl.needsUpdate = true;
  }
}

function removeHighlight(id) {
  if (!id) return;
  // 星座線をリセット
  if (constellationLines[id]) {
    constellationLines[id].material.opacity = 0.25;
    constellationLines[id].material.color.setHex(0x4080c0);
  }
  // 星をリセット
  if (constellationStarIndices[id] && starGeometry && rawStarData) {
    const sz = starGeometry.attributes.size, cl = starGeometry.attributes.color, bc = starGeometry.attributes.baseColor;
    constellationStarIndices[id].forEach(idx => {
      sz.array[idx] = magToSize(rawStarData.features[idx].properties.mag);
      cl.array[idx * 3] = bc.array[idx * 3];
      cl.array[idx * 3 + 1] = bc.array[idx * 3 + 1];
      cl.array[idx * 3 + 2] = bc.array[idx * 3 + 2];
    });
    sz.needsUpdate = true; cl.needsUpdate = true;
  }
}

function updateAutoHighlight() {
  const centerId = getConstellationAtCenter();
  if (centerId === state.selectedConstellation) return;

  // 前のハイライトを解除
  if (state.selectedConstellation) removeHighlight(state.selectedConstellation);
  state.selectedConstellation = centerId;
  // 新しいハイライトを適用
  if (centerId) applyHighlight(centerId);

  // ラベル更新
  const lb = document.getElementById('constellation-label');
  if (state.showNames && centerId && constellationLabels[centerId]) {
    lb.textContent = constellationLabels[centerId].text;
    lb.classList.add('visible');
  } else {
    lb.classList.remove('visible');
  }

  // リストのアクティブ状態を更新
  document.querySelectorAll('.const-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === centerId);
  });
}

// ============================================================
// 星座リストタップ → ナビゲーション or ガイド表示
// ============================================================
function navigateToConstellation(id) {
  if (!constellationLabels[id]) return;

  // パネルを閉じる
  document.getElementById('panel').classList.remove('open');

  if (state.useGyro) {
    // ジャイロモード: 方向ガイドを表示
    showDirectionGuide(id);
  } else {
    // 非ジャイロ: スムーズカメラアニメーション
    const skyMatrix = new THREE.Matrix4();
    skyMatrix.makeRotationFromEuler(starPoints.rotation);
    const worldPos = constellationLabels[id].pos.clone().applyMatrix4(skyMatrix).normalize();
    const toTheta = Math.acos(worldPos.y);
    const toPhi = Math.atan2(worldPos.z, worldPos.x);
    startCameraAnimation(toTheta, toPhi);
  }
}

// ============================================================
// 方向ガイド（ジャイロモード用）
// ============================================================
function showDirectionGuide(id) {
  if (!constellationLabels[id] || !starPoints) return;

  const guide = document.getElementById('direction-guide');
  const nameEl = guide.querySelector('.guide-name');
  const infoEl = guide.querySelector('.guide-info');
  const arrowEl = guide.querySelector('.guide-arrow');

  const info = constellationData[id];
  nameEl.textContent = info ? info.ja : id;

  // 観測者フレームでの方向を計算
  const skyMatrix = new THREE.Matrix4();
  skyMatrix.makeRotationFromEuler(starPoints.rotation);
  const worldPos = constellationLabels[id].pos.clone().applyMatrix4(skyMatrix).normalize();

  // 方位角（北基準、時計回り）
  const az = ((Math.atan2(worldPos.x, -worldPos.z) * 180 / Math.PI) + 360) % 360;
  // 高度
  const alt = Math.asin(worldPos.y) * 180 / Math.PI;

  const dirs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const dirName = dirs[Math.round(az / 22.5) % 16];

  if (alt < -5) {
    infoEl.textContent = `${dirName}  地平線の下 (${Math.abs(Math.round(alt))}°)`;
  } else {
    infoEl.textContent = `${dirName}  仰角 ${Math.round(alt)}°`;
  }

  // 矢印回転: カメラ前方からターゲットへのスクリーン空間角度
  const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const camRight = new THREE.Vector3().crossVectors(camDir, camUp).normalize();
  const toTarget = worldPos.clone().sub(camDir.clone().multiplyScalar(worldPos.dot(camDir)));
  const screenX = toTarget.dot(camRight);
  const screenY = toTarget.dot(camUp);
  const angle = Math.atan2(-screenX, screenY) * 180 / Math.PI;
  arrowEl.style.transform = `rotate(${angle}deg)`;

  guide.classList.add('visible');

  // 4秒後に自動非表示
  if (guideTimer) clearTimeout(guideTimer);
  guideTimer = setTimeout(() => { guide.classList.remove('visible'); }, 4000);
}

// ============================================================
// 設定適用
// ============================================================
function applySettings() {
  Object.values(constellationLines).forEach(l => { l.visible = state.showLines; });
  if (milkyWayMesh) milkyWayMesh.visible = state.showMilkyWay;
  if (gridGroup) gridGroup.visible = state.showGrid;
}

// ============================================================
// UI初期化
// ============================================================
function setupUI() {
  const panel = document.getElementById('panel');
  document.getElementById('panel-toggle').addEventListener('click', () => panel.classList.add('open'));
  document.getElementById('panel-close').addEventListener('click', () => panel.classList.remove('open'));

  // タブ切り替え
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-constellations').style.display = btn.dataset.tab === 'constellations' ? '' : 'none';
      document.getElementById('tab-settings').style.display = btn.dataset.tab === 'settings' ? '' : 'none';
      document.getElementById('tab-datetime').style.display = btn.dataset.tab === 'datetime' ? '' : 'none';
    });
  });

  // トグルスイッチ
  document.querySelectorAll('.toggle').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('on');
      state[el.dataset.setting] = el.classList.contains('on');
      applySettings();
    });
  });

  // 星の明るさスライダー
  document.querySelector('[data-setting="starBrightness"]').addEventListener('input', e => {
    state.starBrightness = parseFloat(e.target.value);
    updateStarSizes();
  });

  // 等級制限セレクト
  document.getElementById('mag-limit').addEventListener('change', e => {
    state.magLimit = parseInt(e.target.value);
    updateStarSizes();
  });

  // 日時・場所の初期値
  const now = new Date();
  document.getElementById('inp-date').value = now.toISOString().split('T')[0];
  document.getElementById('inp-time').value = now.toTimeString().slice(0, 5);
  document.getElementById('inp-lat').value = state.lat;
  document.getElementById('inp-lon').value = state.lon;

  document.getElementById('btn-now').addEventListener('click', () => {
    state.date = new Date();
    const n = new Date();
    document.getElementById('inp-date').value = n.toISOString().split('T')[0];
    document.getElementById('inp-time').value = n.toTimeString().slice(0, 5);
    requestCurrentPosition();
  });

  document.getElementById('btn-apply').addEventListener('click', () => {
    const d = document.getElementById('inp-date').value;
    const t = document.getElementById('inp-time').value;
    state.date = new Date(d + 'T' + t);
    state.lat = parseFloat(document.getElementById('inp-lat').value) || 35.68;
    state.lon = parseFloat(document.getElementById('inp-lon').value) || 139.77;
  });

  // 検索フィルター
  document.getElementById('search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.const-item').forEach(el => {
      el.style.display = (el.querySelector('.ja').textContent + el.querySelector('.latin').textContent).toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

function populateConstellationList() {
  const list = document.getElementById('tab-constellations');
  Object.entries(constellationData)
    .sort((a, b) => (a[1].ja || '').localeCompare(b[1].ja || '', 'ja'))
    .forEach(([id, info]) => {
      const el = document.createElement('div');
      el.className = 'const-item';
      el.dataset.id = id;
      // 星座データは信頼できる外部ソース(d3-celestial)からのデータ
      el.textContent = '';
      const jaSpan = document.createElement('span');
      jaSpan.className = 'ja';
      jaSpan.textContent = info.ja;
      const latinSpan = document.createElement('span');
      latinSpan.className = 'latin';
      latinSpan.textContent = info.name;
      el.appendChild(jaSpan);
      el.appendChild(latinSpan);
      el.addEventListener('click', () => navigateToConstellation(id));
      list.appendChild(el);
    });
}

// ============================================================
// 位置情報 & 情報表示
// ============================================================
function requestCurrentPosition() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(p => {
      state.lat = p.coords.latitude;
      state.lon = p.coords.longitude;
      document.getElementById('inp-lat').value = state.lat.toFixed(4);
      document.getElementById('inp-lon').value = state.lon.toFixed(4);
    }, () => {}, { timeout: 5000 });
  }
}

function updateInfo() {
  const n = state.date;
  document.getElementById('info-time').textContent =
    String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  document.getElementById('info-location').textContent =
    state.lat.toFixed(1) + '°N ' + state.lon.toFixed(1) + '°E';
  const h = state.useGyro
    ? (state.gyroAlpha * 180 / Math.PI)
    : ((-camPhi * 180 / Math.PI + 360) % 360);
  document.getElementById('compass').textContent =
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(h / 45) % 8];
}

// ============================================================
// アニメーションループ
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  state.date = new Date();
  updateSkyRotation();
  state.useGyro ? updateCameraFromGyro() : updateCameraFromAngles();
  updateAutoHighlight();
  updateInfo();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// 初期化
// ============================================================
async function init() {
  initScene(); setupTouch(); setupGyro(); setupUI(); requestCurrentPosition();
  const data = await loadData();
  const lb = document.getElementById('loadbar');
  lb.style.width = '75%'; createStars(data.stars);
  lb.style.width = '85%'; createConstellationLines(data.lines, data.names); populateConstellationList();
  lb.style.width = '92%'; createMilkyWay(data.mw); createHorizonGrid();
  lb.style.width = '100%'; window.addEventListener('resize', onResize);
  setTimeout(() => { document.getElementById('loading').classList.add('hidden'); animate(); }, 500);
}

init();
