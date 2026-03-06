/* ========================================
   garden.js - エントリーポイント・シーン管理
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const app = new GardenApp();
  app.init();
});

class GardenApp {
  constructor() {
    this._camera = null;
    this._cameraManager = new CameraManager();
    this._placementManager = null;
    this._scene = null;
    this._threeCamera = null;
    this._renderer = null;
    this._animationId = null;
    this._selectedPlantId = null; // パレットで選択中の植物ID
    this._isPresetOpen = false;
    this._isPaletteOpen = false;
  }

  init() {
    this._cacheElements();
    this._setupStartScreen();
    this._setupToolbar();
    this._setupPalette();
    this._setupPresets();
    this._setupSelectionControls();
  }

  /** DOM要素をキャッシュ */
  _cacheElements() {
    this._els = {
      startScreen: document.getElementById('start-screen'),
      btnCamera: document.getElementById('btn-camera'),
      btnUpload: document.getElementById('btn-upload'),
      fileInput: document.getElementById('file-input'),
      mainView: document.getElementById('main-view'),
      video: document.getElementById('camera-video'),
      photo: document.getElementById('photo-image'),
      threeCanvas: document.getElementById('three-canvas'),
      toolbar: document.getElementById('toolbar'),
      btnRetake: document.getElementById('btn-retake'),
      btnPreset: document.getElementById('btn-preset'),
      btnPlants: document.getElementById('btn-plants'),
      btnClear: document.getElementById('btn-clear'),
      palette: document.getElementById('palette'),
      paletteTabs: document.getElementById('palette-tabs'),
      paletteItems: document.getElementById('palette-items'),
      presetPanel: document.getElementById('preset-panel'),
      presetGrid: document.getElementById('preset-grid'),
      selectionControls: document.getElementById('selection-controls'),
      btnScaleUp: document.getElementById('btn-scale-up'),
      btnScaleDown: document.getElementById('btn-scale-down'),
      btnDelete: document.getElementById('btn-delete'),
      toast: document.getElementById('toast'),
      loading: document.getElementById('loading'),
      countDisplay: document.getElementById('count-display'),
    };
  }

  /** 初期画面のセットアップ */
  _setupStartScreen() {
    // カメラ起動ボタン
    this._els.btnCamera.addEventListener('click', async () => {
      this._showLoading();
      const success = await this._cameraManager.startCamera(this._els.video);
      this._hideLoading();

      if (success) {
        this._els.video.classList.remove('hidden');
        this._els.photo.classList.add('hidden');
        this._els.startScreen.classList.add('hidden');
        this._els.toolbar.classList.remove('hidden');
        this._initThreeScene();
        this._showToast('画面をタップして植物を配置');
      } else {
        this._showToast('カメラを起動できませんでした。画像をアップロードしてください');
      }
    });

    // 画像アップロードボタン
    this._els.btnUpload.addEventListener('click', () => {
      this._els.fileInput.click();
    });

    this._els.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this._showLoading();
      try {
        const dataUrl = await this._cameraManager.loadFromFile(file);
        this._els.photo.src = dataUrl;
        this._els.photo.classList.remove('hidden');
        this._els.video.classList.add('hidden');
        this._els.startScreen.classList.add('hidden');
        this._els.toolbar.classList.remove('hidden');
        this._initThreeScene();
        this._showToast('画面をタップして植物を配置');
      } catch (err) {
        this._showToast('画像の読み込みに失敗しました');
      }
      this._hideLoading();
      // ファイル入力をリセット
      e.target.value = '';
    });
  }

  /** Three.jsシーンを初期化 */
  _initThreeScene() {
    if (this._renderer) return; // 初期化済み

    const container = this._els.mainView;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // シーン
    this._scene = new THREE.Scene();

    // カメラ（パース付き）
    this._threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this._threeCamera.position.set(0, 2, 5);
    this._threeCamera.lookAt(0, 0, 0);

    // レンダラー（透過）
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._els.threeCanvas,
      alpha: true,
      antialias: true,
    });
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setClearColor(0x000000, 0);

    // 配置マネージャー
    this._placementManager = new PlacementManager(
      this._scene,
      this._threeCamera,
      this._els.threeCanvas
    );

    this._placementManager.onSelectionChange = (id) => {
      if (id !== null) {
        this._els.selectionControls.classList.remove('hidden');
      } else {
        this._els.selectionControls.classList.add('hidden');
      }
    };

    // キャンバスタップで植物配置
    this._els.threeCanvas.addEventListener('click', (e) => {
      // プリセットパネルが開いていたら閉じる
      if (this._isPresetOpen) {
        this._togglePreset(false);
        return;
      }

      // 選択中の植物があればタップ位置に配置
      if (this._selectedPlantId) {
        const item = this._placementManager.placeAt(
          this._selectedPlantId, e.clientX, e.clientY
        );
        if (item) {
          this._updateCount();
        } else if (this._placementManager.count >= this._placementManager.maxCount) {
          this._showToast('配置上限に達しました（最大30個）');
        }
        return;
      }

      // 植物が未選択なら既存アイテムの選択を試みる
      this._placementManager.selectAt(e.clientX, e.clientY);
    });

    // リサイズ対応
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this._threeCamera.aspect = w / h;
      this._threeCamera.updateProjectionMatrix();
      this._renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // アニメーションループ
    const animate = () => {
      this._animationId = requestAnimationFrame(animate);

      // ビルボード: 全ての植物メッシュをカメラに向ける
      this._scene.traverse((obj) => {
        if (obj.isMesh && obj.userData.itemId) {
          obj.lookAt(this._threeCamera.position);
        }
      });

      this._renderer.render(this._scene, this._threeCamera);
    };
    animate();
  }

  /** ツールバーのセットアップ */
  _setupToolbar() {
    // やり直し
    this._els.btnRetake.addEventListener('click', () => {
      this._reset();
    });

    // プリセット
    this._els.btnPreset.addEventListener('click', () => {
      this._togglePreset(!this._isPresetOpen);
      if (this._isPaletteOpen) this._togglePalette(false);
    });

    // 植物パレット
    this._els.btnPlants.addEventListener('click', () => {
      this._togglePalette(!this._isPaletteOpen);
      if (this._isPresetOpen) this._togglePreset(false);
    });

    // 全クリア
    this._els.btnClear.addEventListener('click', () => {
      if (this._placementManager && this._placementManager.count > 0) {
        this._placementManager.clearAll();
        this._updateCount();
        this._showToast('すべての植物を削除しました');
      }
    });
  }

  /** 植物パレットのセットアップ */
  _setupPalette() {
    const { PLANT_CATEGORIES } = window.PlantData;

    // タブを生成
    for (const cat of PLANT_CATEGORIES) {
      const tab = document.createElement('button');
      tab.className = 'palette__tab';
      tab.textContent = cat.name;
      tab.dataset.category = cat.id;
      tab.addEventListener('click', () => {
        this._selectCategory(cat.id);
      });
      this._els.paletteTabs.appendChild(tab);
    }

    // 最初のカテゴリを選択
    this._selectCategory(PLANT_CATEGORIES[0].id);
  }

  /** カテゴリ選択 */
  _selectCategory(categoryId) {
    // タブの状態更新
    const tabs = this._els.paletteTabs.querySelectorAll('.palette__tab');
    for (const tab of tabs) {
      if (tab.dataset.category === categoryId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    }

    // アイテム一覧を更新
    const plants = window.PlantData.getPlantsByCategory(categoryId);
    // 既存のアイテムをクリア
    while (this._els.paletteItems.firstChild) {
      this._els.paletteItems.removeChild(this._els.paletteItems.firstChild);
    }

    for (const plant of plants) {
      const item = document.createElement('div');
      item.className = 'palette__item';
      if (this._selectedPlantId === plant.id) {
        item.classList.add('selected');
      }
      item.dataset.plantId = plant.id;

      // プレビュー画像
      const preview = window.PlantData.generatePlantPreview(plant);
      preview.className = 'palette__item-preview';
      item.appendChild(preview);

      // 名前
      const name = document.createElement('span');
      name.className = 'palette__item-name';
      name.textContent = plant.name;
      item.appendChild(name);

      item.addEventListener('click', () => {
        this._selectPlant(plant.id);
      });

      this._els.paletteItems.appendChild(item);
    }
  }

  /** 植物を選択 */
  _selectPlant(plantId) {
    // 同じ植物をタップしたら解除
    if (this._selectedPlantId === plantId) {
      this._selectedPlantId = null;
    } else {
      this._selectedPlantId = plantId;
      // 配置マネージャーの選択を解除
      if (this._placementManager) {
        this._placementManager.deselect();
      }
    }

    // パレットUIを更新
    const items = this._els.paletteItems.querySelectorAll('.palette__item');
    for (const item of items) {
      if (item.dataset.plantId === this._selectedPlantId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    }

    if (this._selectedPlantId) {
      const plant = window.PlantData.getPlantById(this._selectedPlantId);
      this._showToast(`${plant.name}を選択中 - 画面をタップして配置`);
    }
  }

  /** プリセットパネルのセットアップ */
  _setupPresets() {
    const { PRESETS, generatePresetIcon } = window.PresetData;

    for (const preset of PRESETS) {
      const card = document.createElement('div');
      card.className = 'preset-card';

      // アイコン
      const icon = generatePresetIcon(preset.icon, 48);
      icon.className = 'preset-card__preview';
      card.appendChild(icon);

      // 名前
      const name = document.createElement('div');
      name.className = 'preset-card__name';
      name.textContent = preset.name;
      card.appendChild(name);

      // 説明
      const desc = document.createElement('div');
      desc.className = 'preset-card__desc';
      desc.textContent = preset.description;
      card.appendChild(desc);

      card.addEventListener('click', () => {
        this._applyPreset(preset);
      });

      this._els.presetGrid.appendChild(card);
    }
  }

  /** プリセットを適用 */
  _applyPreset(preset) {
    if (!this._placementManager) return;

    // 既存をクリア
    this._placementManager.clearAll();

    // プリセット配置
    this._placementManager.placePreset(preset.placements);
    this._updateCount();
    this._togglePreset(false);
    this._showToast(`「${preset.name}」を配置しました`);
  }

  /** 選択操作パネルのセットアップ */
  _setupSelectionControls() {
    this._els.btnScaleUp.addEventListener('click', () => {
      if (this._placementManager) {
        this._placementManager.scaleSelected(0.15);
      }
    });

    this._els.btnScaleDown.addEventListener('click', () => {
      if (this._placementManager) {
        this._placementManager.scaleSelected(-0.15);
      }
    });

    this._els.btnDelete.addEventListener('click', () => {
      if (this._placementManager) {
        this._placementManager.deleteSelected();
        this._updateCount();
      }
    });
  }

  /** パレットの表示切替 */
  _togglePalette(open) {
    this._isPaletteOpen = open;
    if (open) {
      this._els.palette.classList.add('open');
    } else {
      this._els.palette.classList.remove('open');
    }
  }

  /** プリセットパネルの表示切替 */
  _togglePreset(open) {
    this._isPresetOpen = open;
    if (open) {
      this._els.presetPanel.classList.add('open');
    } else {
      this._els.presetPanel.classList.remove('open');
    }
  }

  /** 配置数の表示更新 */
  _updateCount() {
    if (this._placementManager) {
      this._els.countDisplay.textContent =
        `${this._placementManager.count}/${this._placementManager.maxCount}`;
    }
  }

  /** リセット（初期画面に戻る） */
  _reset() {
    this._cameraManager.reset();
    if (this._placementManager) {
      this._placementManager.clearAll();
    }
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer = null;
    }
    this._scene = null;
    this._threeCamera = null;
    this._placementManager = null;
    this._selectedPlantId = null;

    this._els.video.classList.add('hidden');
    this._els.photo.classList.add('hidden');
    this._els.startScreen.classList.remove('hidden');
    this._els.toolbar.classList.add('hidden');
    this._togglePalette(false);
    this._togglePreset(false);
    this._els.selectionControls.classList.add('hidden');
    this._updateCount();
  }

  /** トースト表示 */
  _showToast(message) {
    this._els.toast.textContent = message;
    this._els.toast.classList.add('show');
    setTimeout(() => {
      this._els.toast.classList.remove('show');
    }, 2500);
  }

  /** ローディング表示 */
  _showLoading() {
    this._els.loading.classList.remove('hidden');
  }

  /** ローディング非表示 */
  _hideLoading() {
    this._els.loading.classList.add('hidden');
  }
}
