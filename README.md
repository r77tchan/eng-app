# CommuteEnglish

通勤・通学の移動時間を、英語学習時間に変える PWA。

電車1区間（最短2〜3分）で1サイクルが完結する、片手操作専用の英単語ドリル。
完全クライアントサイドで動作し、サーバー・データベース・認証は持たない。

## 特徴

- ⚡ **1セッション約90秒** — 5問1セットで電車1区間に収まる
- 📱 **片手操作専用** — 主要ボタンは親指リーチ範囲（画面下半分）、タップ領域 44px 以上
- 🔁 **誤答自動復習** — 間違えた問題が次セッションで優先出題、正答で卒業
- 📊 **学習履歴** — 日別の問題数・正答率・連続学習日数（ストリーク）を可視化
- 🎯 **カテゴリ・難易度** — 日常会話/ビジネス/旅行/試験対策 × 初級/中級/上級で絞り込み
- 🌗 **ライト/ダークテーマ** — 端末設定への自動追従
- 🔇 **効果音 ON/OFF** — Web Audio API で正誤フィードバック音をシンセサイズ
- 📦 **PWA** — ホーム画面追加可能、Service Worker でアセットキャッシュ
- 🔒 **完全オフライン保護** — 学習履歴は LocalStorage のみ、外部送信ゼロ

## アーキテクチャ

| 項目 | 採用技術 |
|------|----------|
| フレームワーク | Next.js (App Router) — `output: 'export'` で静的書き出し |
| UI | React 19 / Tailwind CSS v4 / CSS 変数のデザイントークン |
| データ | 同梱 JSON（`public/data/questions.json`、60問） |
| 状態永続化 | LocalStorage（履歴・復習キュー・設定） |
| PWA | `app/manifest.ts` + `public/sw.js`（手書きSW） |
| ホスティング | GitHub Pages（サブパス配信対応） |

**サーバー機能（Server Actions / Route Handler / middleware / ISR / `next/image` デフォルトローダー）は一切使用していない。**

## 画面

| ルート | 機能 |
|--------|------|
| `/` | ホーム（今日の学習サマリー・復習件数・「学習を始める」CTA） |
| `/start` | カテゴリ・難易度の選択 |
| `/session` | 5問の学習セッション → フィードバック → 結果画面 |
| `/history` | 日別の学習履歴・ストリーク表示 |
| `/settings` | テーマ / 効果音 / 既定値 / データリセット |

## セットアップ

```bash
npm install
npm run dev
# → http://localhost:3000
```

## ビルド

### ローカル確認用（basePath なし）

```bash
npm run build
npm run preview
# → http://localhost:5173
```

### GitHub Pages 用（サブパス配信）

```bash
NEXT_PUBLIC_BASE_PATH=/<repo-name> npm run build
```

生成された `out/` ディレクトリを GitHub Pages にデプロイすればよい。
`out/.nojekyll` が自動生成されるため `_next` 配下も配信される。

#### サブパスをローカルで確認

```bash
NEXT_PUBLIC_BASE_PATH=/eng-app npm run build
mkdir -p /tmp/pages/eng-app && cp -r out/* /tmp/pages/eng-app/
npx http-server /tmp/pages -p 5173
# → http://localhost:5173/eng-app/
```

## デプロイ（GitHub Pages 自動デプロイ）

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に切り替える
2. `main` ブランチに push する
3. `.github/workflows/deploy.yml` が自動実行され、`https://<user>.github.io/<repo>/` で公開される

ワークフローは以下を実行する。

- `npm ci` / `npm run lint`
- `NEXT_PUBLIC_BASE_PATH=/${{ repository.name }}` で `npm run build`
- `out/.nojekyll` 生成
- `actions/upload-pages-artifact` → `actions/deploy-pages`

## プロジェクト構成

```
app/
├── page.tsx                  # ホーム（ダッシュボード + CTA）
├── start/                    # カテゴリ・難易度選択
├── session/                  # 学習セッション（5問完走 + 結果）
├── history/                  # 学習履歴
├── settings/                 # 設定画面
├── manifest.ts               # PWA manifest
├── layout.tsx                # PWA メタ / テーマ反映 / SW 登録
└── _components/              # 共通コンポーネント

lib/
├── questions.ts              # 問題プール ロード・シャッフル
├── history.ts                # 学習履歴永続化 (LocalStorage)
├── reviewQueue.ts            # 復習キュー永続化
├── sessionPlanner.ts         # 復習優先 × フィルタ × フォールバック
├── settings.ts               # ユーザー設定永続化
├── sound.ts                  # 効果音（Web Audio API シンセ）
└── basePath.ts               # サブパス配信ユーティリティ

public/
├── data/questions.json       # 60問プール（カテゴリ・難易度メタ付き）
├── icons/                    # PWA アイコン
├── sounds/                   # 効果音フォールバック WAV
└── sw.js                     # Service Worker

docs/
├── spec.md                   # 製品仕様書
├── design-tokens.md          # デザイントークン
└── sprints/                  # スプリント計画・契約
```

## データ永続化のキー

すべて LocalStorage、外部送信なし。`/settings` の「データをリセット」で一括削除可能。

| キー | 用途 |
|------|------|
| `commute-en:history:v1` | 解答ログ（questionId / selected / correct / answeredAt） |
| `commute-en:review-queue:v1` | 誤答 ID の配列 |
| `commute-en:settings:v1` | テーマ / 効果音 / 既定カテゴリ・難易度 |
| `commute-en:pending-session:v1` | `/start` → `/session` 間のフィルタ受け渡し |

## ブラウザ対応

- iOS Safari（最新2バージョン）
- Android Chrome（最新2バージョン）
- PWA インストール可能（ホーム画面追加で起動）

## 開発について

このプロジェクトは Claude Code のサブエージェント・ハーネスを用いてスプリント駆動で開発された。詳細は `CLAUDE.md` および `docs/sprints/` を参照。

## ライセンス

MIT
