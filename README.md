# Doboku Lab｜土木工学インタラクティブ学習ポータル

日本の土木系大学生・高専生向けのクライアント完結型インタラクティブ学習Webアプリケーションです。

## 収録単元
- **土質力学**: モールの応力円・モール・クーロンの破壊規準・有効応力（圧縮正規約準拠、実空間微小土要素連動、KaTeX途中式、オリジナル演習3問）
- **土質力学**: ランキン土圧（主働・受働土圧係数 $K_a, K_p$、引張亀裂深さ、合力計算）
- **構造力学**: 単純梁のせん断力図 (SFD)・曲げモーメント図 (BMD) 解析
- **水理学**: 開水路等流・マニングの公式・フルード数による流況判定

## ローカル開発・検証
```bash
npm install
npm run dev      # 開発サーバー起動
npm test         # Vitest 単体テスト
npm run lint     # oxlint チェック
npm run build    # TypeScript型チェック + 本番ビルド
```

## Cloudflare Pages デプロイ設定
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `20` 以上（推奨: `22` または `24`）
