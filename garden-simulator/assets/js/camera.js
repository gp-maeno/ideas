/* ========================================
   camera.js - カメラ / 画像入力モジュール
   ======================================== */

/**
 * カメラ・画像入力を管理するクラス
 */
class CameraManager {
  constructor() {
    this._video = null;
    this._stream = null;
    this._imageUrl = null;
    this._mode = null; // 'camera' | 'photo'
  }

  /** 現在のモードを取得 */
  get mode() {
    return this._mode;
  }

  /** 画像URLを取得（photoモード時） */
  get imageUrl() {
    return this._imageUrl;
  }

  /**
   * カメラを起動してvideo要素にバインド
   * @param {HTMLVideoElement} videoEl
   * @returns {Promise<boolean>} 成功したらtrue
   */
  async startCamera(videoEl) {
    try {
      // 既存ストリームを停止
      this.stopCamera();

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = this._stream;
      await videoEl.play();

      this._video = videoEl;
      this._mode = 'camera';
      this._imageUrl = null;
      return true;
    } catch (err) {
      console.error('カメラ起動失敗:', err);
      return false;
    }
  }

  /** カメラを停止 */
  stopCamera() {
    if (this._stream) {
      for (const track of this._stream.getTracks()) {
        track.stop();
      }
      this._stream = null;
    }
    if (this._video) {
      this._video.srcObject = null;
      this._video = null;
    }
  }

  /**
   * カメラから現在のフレームをキャプチャ
   * @returns {string|null} データURL
   */
  captureFrame() {
    if (!this._video || this._mode !== 'camera') return null;

    const canvas = document.createElement('canvas');
    canvas.width = this._video.videoWidth;
    canvas.height = this._video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this._video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  /**
   * 写真を撮影してphotoモードに切り替え
   * @returns {string|null} データURL
   */
  takePhoto() {
    const dataUrl = this.captureFrame();
    if (dataUrl) {
      this.stopCamera();
      this._imageUrl = dataUrl;
      this._mode = 'photo';
    }
    return dataUrl;
  }

  /**
   * ファイルから画像を読み込んでphotoモードに
   * @param {File} file
   * @returns {Promise<string>} データURL
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.stopCamera();
        this._imageUrl = e.target.result;
        this._mode = 'photo';
        resolve(this._imageUrl);
      };
      reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      reader.readAsDataURL(file);
    });
  }

  /** リセット */
  reset() {
    this.stopCamera();
    this._imageUrl = null;
    this._mode = null;
  }
}

// グローバルエクスポート
window.CameraManager = CameraManager;
