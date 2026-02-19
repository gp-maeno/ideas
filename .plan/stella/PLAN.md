# Stella - 実装計画

## 概要
スマートフォンのジャイロセンサーを用いて実際の方角に向けながら星座を確認できる3D星空ビューア。
ヒッパルコス星表のデータを元に、明るい星（6等級以下、約4,500星）を3D天球上にプロットし、
全88星座の星座線、天の川の視覚表現を含む。

## 要件
- ヒッパルコス星表ベースの星データ（6等級以下、軽量・高速）
- 全88星座の星座線表示
- ジャイロセンサーによるリアルタイム方向追従
- 星座リストからの選択・カメラ移動
- 天の川の美しい表現（多少誇張OK）
- GPS現在地+現在時刻をデフォルト、日時・場所変更可能
- UI言語: 日本語
- GitHub Pages上で単一HTMLとして動作

## アーキテクチャ

### 技術スタック
| 要素 | 選定 | 理由 |
|---|---|---|
| 3D描画 | Three.js r128 | CDN利用可、スマホ対応良好 |
| 星データ | d3-celestial stars.6.json | ヒッパルコス6等級以下、GeoJSON、約4,500星 |
| 星座線 | d3-celestial constellations.lines.json | 全88星座、RA/Dec座標付き |
| 星座名 | d3-celestial constellations.json | 日本語名(ja)含む多言語対応 |
| 天の川 | d3-celestial mw.json + パーティクル | 輪郭データ + グロー演出 |
| ジャイロ | DeviceOrientationEvent API | iOS 13+許可制対応 |
| 位置情報 | Geolocation API | 現在地取得 |
| 天文計算 | 自前実装（恒星時・座標変換） | 外部依存なし |

### ファイル構成
```
stella/
├── index.html    ← 全機能を含む単一ファイル（データ埋め込み）
└── meta.json     ← ギャラリー用メタ情報
```

### データフロー
```
d3-celestial GeoJSON → 座標変換（GeoJSON RA/Dec → Three.js 3D座標）
                    → Three.js Points（星）
                    → Three.js Line（星座線）
                    → Three.js Mesh（天の川パーティクル）

Geolocation API → 緯度経度
Date/Time       → 恒星時計算 → 天球回転角度
DeviceOrientation → カメラ方向
```

## 実装フェーズ

### Phase 1: データ準備・基本描画
1. d3-celestialからデータ取得・変換スクリプト作成
2. GeoJSON座標 → Three.js天球座標への変換
3. 星を3Dポイントとして描画（等級→サイズ、B-V色指数→色）
4. 天球のセットアップ（カメラ中心配置）

### Phase 2: 星座線・星座名
1. constellations.lines.jsonから星座線を描画
2. 星座名ラベル表示（日本語）
3. 星座ハイライト機能

### Phase 3: 天の川
1. mw.jsonの輪郭データから天の川の帯を生成
2. パーティクルシステムで微光星の雲を表現
3. グロー・ブルーム効果で誇張表現

### Phase 4: 天文計算・時刻連動
1. 恒星時（GST/LST）計算の実装
2. 赤道座標 → 地平座標変換
3. GPS位置+現在時刻での天球回転
4. 地平線の描画（地平線以下の減光）

### Phase 5: ジャイロ・タッチ操作
1. DeviceOrientationEvent でカメラ制御
2. iOS向け許可リクエストUI
3. タッチドラッグでのフォールバック回転
4. ピンチズーム

### Phase 6: UI
1. 星座リストパネル（日本語名、スクロール、検索）
2. 日時設定パネル
3. 場所設定パネル
4. 設定トグル（星座線ON/OFF、星座名ON/OFF等）
5. コンパス表示

### Phase 7: 仕上げ
1. レスポンシブ対応
2. パフォーマンス最適化
3. ローディング画面
4. PWA対応（オフライン動作）

## 座標系の変換

### d3-celestial GeoJSON → Three.js
d3-celestialはRA/Decを経度/緯度として格納：
- longitude = RA（0〜180° → 0h〜12h、-180°〜0° → 12h〜24h）
- latitude = Dec

Three.jsへの変換：
```
RA(rad) = longitude < 0 ? (360 + longitude) * π/180 : longitude * π/180
Dec(rad) = latitude * π/180
x = R * cos(Dec) * cos(RA)
y = R * sin(Dec)
z = -R * cos(Dec) * sin(RA)
```

### 恒星時計算
```
JD = Julian Date from Date/Time
T = (JD - 2451545.0) / 36525.0
GST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + T² * 0.000387933 - T³ / 38710000
LST = GST + longitude
```

### 地平座標変換
```
H = LST - RA (時角)
alt = asin(sin(lat)*sin(Dec) + cos(lat)*cos(Dec)*cos(H))
az = atan2(-cos(Dec)*sin(H), cos(lat)*sin(Dec) - sin(lat)*cos(Dec)*cos(H))
```

## パフォーマンス考慮
- 星: BufferGeometry + PointsMaterial（GPU描画）
- 星座線: BufferGeometry + LineSegments
- 天の川: 低解像度パーティクル + シェーダー
- 目標: スマホで60fps維持
- 約4,500頂点 + 数百本のライン → 十分軽量

## 懸念点と対策
| 懸念 | 対策 |
|---|---|
| iOS ジャイロ許可 | ユーザータップに紐づけてrequestPermission() |
| データサイズ | インライン埋め込みで約300-500KB、gzip圧縮で100KB台 |
| 低スペックスマホ | パーティクル数調整、LOD的に遠方の星を間引き |
| HTTPS必須（ジャイロ・GPS） | GitHub Pages はHTTPS |

## データソース
- 星データ: https://github.com/ofrohn/d3-celestial/blob/master/data/stars.6.json
- 星座線: https://github.com/ofrohn/d3-celestial/blob/master/data/constellations.lines.json
- 星座名: https://github.com/ofrohn/d3-celestial/blob/master/data/constellations.json
- 天の川: https://github.com/ofrohn/d3-celestial/blob/master/data/mw.json
- ライセンス: BSD 3-Clause (d3-celestial)
