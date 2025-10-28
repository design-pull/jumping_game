# Jumping Game

ライブ版: https://design-pull.github.io/jumping_game/

<a href="https://design-pull.github.io/jumping_game/" target="_blank" rel="noopener">
  <img src="https://design-pull.com/wp-content/uploads/2025/10/jumping.jpg" alt="Jumping preview">
</a>

## 概要
シンプルなブラウザ向けジャンプゲーム。  
マウス / タップでジャンプして障害物を避けるシンプルなアクションゲームです。  
主な機能:
- スコア・ハイスコア・残機表示
- モバイル対応（タップで操作）
- 雲のパララックス背景（雲のみ）
- 障害物の横幅・高さをランダム化
- 一定数の障害物通過後に徐々に難易度上昇
- WebAudio による効果音とミュート切替


## ローカルでの確認方法
1. リポジトリをクローンまたはダウンロード:
```bash
git clone https://github.com/design-pull/jumping_game.git
cd jumping_game

index.html をブラウザで開くだけで動作します。

ローカルで簡易サーバを使う場合（推奨）:
# Python 3
python -m http.server 8000
# ブラウザで http://localhost:8000 を開く

デプロイ（GitHub Pages）
既に公開済み: https://design-pull.github.io/jumping_game/

再デプロイ手順（簡単）
git add .
git commit -m "Deploy site"
git push origin main

GitHub リポジトリ → Settings → Pages → Source を main / (root) に設定してください。反映まで数分かかります。

カスタマイズポイント
障害物の生成: game.js の makeBuilding() を編集

プレイヤー外観・目の位置: styles.css の #player / .eye を編集

背景の雲: index.html 内の SVG を編集

音量や効果音: game.js の WebAudio 部分を調整

開発メモ
モバイルで目が重ならないように .eye の位置はレスポンシブ対応済み

地面はシームレスに配置し隙間が開かないように実装済み

障害物は幅・高さともにランダムでバリエーションがある
