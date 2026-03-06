/* ========================================
   placement.js - 配置ロジック・操作モジュール
   ======================================== */

/**
 * Three.jsシーンで植物の配置・操作を管理するクラス
 */
class PlacementManager {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(scene, camera, canvasEl) {
    this._scene = scene;
    this._camera = camera;
    this._canvas = canvasEl;
    this._placedItems = []; // { mesh, shadowMesh, plantId, id }
    this._selectedId = null;
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._idCounter = 0;
    this._isDragging = false;
    this._dragItem = null;
    this._onSelectionChange = null;

    this._setupEvents();
  }

  /** 選択変更コールバックを設定 */
  set onSelectionChange(callback) {
    this._onSelectionChange = callback;
  }

  /** 配置済みアイテム数 */
  get count() {
    return this._placedItems.length;
  }

  /** 最大配置数 */
  get maxCount() {
    return 30;
  }

  /**
   * 選択中の植物IDでタップ位置に配置
   * @param {string} plantId 植物のID
   * @param {number} screenX スクリーン座標X
   * @param {number} screenY スクリーン座標Y
   * @returns {object|null} 配置されたアイテム
   */
  placeAt(plantId, screenX, screenY) {
    if (this._placedItems.length >= this.maxCount) return null;

    const plant = window.PlantData.getPlantById(plantId);
    if (!plant) return null;

    // スクリーン座標を正規化
    const rect = this._canvas.getBoundingClientRect();
    const nx = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ny = -((screenY - rect.top) / rect.height) * 2 + 1;

    // 画面Y座標から簡易パースでスケールと奥行きを算出
    // 画面下部 = 手前（大きく）、画面上部 = 奥（小さく）
    const screenRatio = (screenY - rect.top) / rect.height; // 0=上端, 1=下端
    const depthScale = 0.3 + screenRatio * 0.7; // 0.3〜1.0
    const depth = 5 - screenRatio * 8; // 手前(-3)〜奥(5)

    // 横位置はスクリーン座標から算出
    const worldX = (nx * 5) / depthScale;

    // 植物テクスチャを生成
    const textureCanvas = window.PlantData.generatePlantTexture(plant);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.encoding = THREE.sRGBEncoding;

    // ビルボード（常にカメラに向く平面）
    const aspectRatio = plant.baseWidth / plant.baseHeight;
    const height = plant.baseHeight * depthScale * 1.5;
    const width = height * aspectRatio;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldX, height / 2 * depthScale, depth);
    mesh.renderOrder = Math.round((1 - screenRatio) * 100); // 奥のものを先に描画

    // ドロップシャドウ
    const shadowGeom = new THREE.PlaneGeometry(width * 0.8, width * 0.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(worldX, 0.01, depth);
    shadowMesh.renderOrder = mesh.renderOrder - 1;

    this._scene.add(mesh);
    this._scene.add(shadowMesh);

    const item = {
      id: ++this._idCounter,
      plantId,
      mesh,
      shadowMesh,
      depthScale,
      screenRatio,
    };

    // メッシュにアイテムIDを紐づけ
    mesh.userData.itemId = item.id;

    this._placedItems = [...this._placedItems, item];
    return item;
  }

  /**
   * 指定座標のアイテムを選択
   * @param {number} screenX
   * @param {number} screenY
   * @returns {object|null} 選択されたアイテム
   */
  selectAt(screenX, screenY) {
    const rect = this._canvas.getBoundingClientRect();
    this._pointer.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._pointer, this._camera);

    const meshes = this._placedItems.map((item) => item.mesh);
    const intersects = this._raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const item = this._placedItems.find((i) => i.mesh === hitMesh);
      if (item) {
        this._setSelected(item.id);
        return item;
      }
    }

    this._setSelected(null);
    return null;
  }

  /** 選択を解除 */
  deselect() {
    this._setSelected(null);
  }

  /** 選択中のアイテムを削除 */
  deleteSelected() {
    if (this._selectedId === null) return;

    const item = this._placedItems.find((i) => i.id === this._selectedId);
    if (!item) return;

    this._scene.remove(item.mesh);
    this._scene.remove(item.shadowMesh);
    item.mesh.geometry.dispose();
    item.mesh.material.map?.dispose();
    item.mesh.material.dispose();
    item.shadowMesh.geometry.dispose();
    item.shadowMesh.material.dispose();

    this._placedItems = this._placedItems.filter((i) => i.id !== this._selectedId);
    this._setSelected(null);
  }

  /**
   * 選択中のアイテムをスケール変更
   * @param {number} delta スケール変更量（正で拡大、負で縮小）
   */
  scaleSelected(delta) {
    if (this._selectedId === null) return;

    const item = this._placedItems.find((i) => i.id === this._selectedId);
    if (!item) return;

    const newScale = Math.max(0.3, Math.min(3.0, item.mesh.scale.x + delta));
    item.mesh.scale.set(newScale, newScale, newScale);
    item.shadowMesh.scale.set(newScale, 1, newScale);
  }

  /**
   * プリセットから複数の植物を一括配置
   * @param {Array<{plantId: string, x: number, y: number}>} placements
   *   x, y はスクリーン座標の割合（0〜1）
   */
  placePreset(placements) {
    const rect = this._canvas.getBoundingClientRect();
    const results = [];

    for (const p of placements) {
      const screenX = rect.left + p.x * rect.width;
      const screenY = rect.top + p.y * rect.height;
      const item = this.placeAt(p.plantId, screenX, screenY);
      if (item) {
        results.push(item);
      }
    }

    return results;
  }

  /** 全てクリア */
  clearAll() {
    for (const item of this._placedItems) {
      this._scene.remove(item.mesh);
      this._scene.remove(item.shadowMesh);
      item.mesh.geometry.dispose();
      item.mesh.material.map?.dispose();
      item.mesh.material.dispose();
      item.shadowMesh.geometry.dispose();
      item.shadowMesh.material.dispose();
    }
    this._placedItems = [];
    this._setSelected(null);
  }

  /** 内部: 選択状態を更新 */
  _setSelected(id) {
    // 前の選択をリセット
    if (this._selectedId !== null) {
      const prev = this._placedItems.find((i) => i.id === this._selectedId);
      if (prev) {
        prev.mesh.material.color.setHex(0xffffff);
      }
    }

    this._selectedId = id;

    // 新しい選択をハイライト
    if (id !== null) {
      const item = this._placedItems.find((i) => i.id === id);
      if (item) {
        item.mesh.material.color.setHex(0xccffcc);
      }
    }

    if (this._onSelectionChange) {
      this._onSelectionChange(id);
    }
  }

  /** イベントリスナーの設定 */
  _setupEvents() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onPointerDown = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();

      // ドラッグ対象を検出
      const selected = this.selectAt(startX, startY);
      if (selected) {
        this._isDragging = true;
        this._dragItem = selected;
      }
    };

    const onPointerMove = (e) => {
      if (!this._isDragging || !this._dragItem) return;
      e.preventDefault();

      const touch = e.touches ? e.touches[0] : e;
      const rect = this._canvas.getBoundingClientRect();

      // 新しいスクリーン位置から3D座標を再計算
      const screenRatio = (touch.clientY - rect.top) / rect.height;
      const depthScale = 0.3 + screenRatio * 0.7;
      const depth = 5 - screenRatio * 8;
      const nx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const worldX = (nx * 5) / depthScale;

      const plant = window.PlantData.getPlantById(this._dragItem.plantId);
      if (!plant) return;

      const height = plant.baseHeight * depthScale * 1.5;
      this._dragItem.mesh.position.set(worldX, height / 2 * depthScale, depth);
      this._dragItem.shadowMesh.position.set(worldX, 0.01, depth);
      this._dragItem.mesh.renderOrder = Math.round((1 - screenRatio) * 100);
      this._dragItem.shadowMesh.renderOrder = this._dragItem.mesh.renderOrder - 1;
    };

    const onPointerUp = () => {
      this._isDragging = false;
      this._dragItem = null;
    };

    // タッチイベント
    this._canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    this._canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    this._canvas.addEventListener('touchend', onPointerUp);

    // マウスイベント（PC対応）
    this._canvas.addEventListener('mousedown', onPointerDown);
    this._canvas.addEventListener('mousemove', onPointerMove);
    this._canvas.addEventListener('mouseup', onPointerUp);
  }
}

// グローバルエクスポート
window.PlacementManager = PlacementManager;
