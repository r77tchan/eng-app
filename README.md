# Agent Quartet Harness

Claude Code のサブエージェント4体によるスプリント駆動開発ハーネス。

```
@planner → @generator → @designer → @evaluator
                ↑                        │
                └── 不合格時のフィードバック ──┘
```

## 4つのエージェント

| エージェント | 役割 | model |
|---|---|---|
| **@planner** | 短いプロンプトから製品仕様書とスプリント計画を生成 | opus |
| **@generator** | スプリント契約に基づいてコードを実装 | opus |
| **@designer** | デザイントークンでUIを仕上げ | opus |
| **@evaluator** | Playwright MCP で実操作テスト・合否判定 | opus |

## セットアップ

1. このリポジトリの `.claude/agents/` と `CLAUDE.md` を自分のプロジェクトにコピーする
2. デザイントークンを `/docs/design-tokens.md` に用意する

```bash
# 例: 自分のプロジェクトにコピー
cp -r .claude/agents/ /path/to/your-project/.claude/agents/
cp CLAUDE.md /path/to/your-project/CLAUDE.md
```

## 使い方

### 1. 計画

```
@planner 動画プラットフォームを作りたい。ユーザーが動画をアップロードして視聴できるサービス。
```

### 2. 実装

```
@generator Sprint 1を実装して
```

### 3. デザイン

```
@designer Sprint 1のデザインを仕上げて
```

### 4. 評価

```
@evaluator Sprint 1を評価して
```

Evaluator が合格を出したら次のスプリントへ。不合格なら修正指示に従って該当エージェントに戻す。

## ファイル構成

```
your-project/
├── CLAUDE.md                      # オーケストレーションルール
├── .claude/agents/
│   ├── planner.md                 # 仕様策定エージェント
│   ├── generator.md               # 実装エージェント
│   ├── designer.md                # デザインエージェント
│   └── evaluator.md               # QAエージェント
└── docs/
    ├── spec.md                    # 製品仕様書（Planner が生成）
    ├── design-tokens.md           # デザイントークン（ユーザーが用意）
    └── sprints/
        ├── sprint-1.md
        ├── sprint-2.md
        └── ...
```

## 前提条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) が使える環境
- Playwright MCP サーバーの設定（Evaluator・Designer が使用）

## このプロジェクト (CommuteEnglish) のビルド方法

このリポジトリはハーネスのデモを兼ねた CommuteEnglish (英単語学習WEBアプリ) の実装でもある。
Next.js の `output: 'export'` による静的書き出しで GitHub Pages にデプロイすることを想定している。

### 開発サーバー

```bash
npm install
npm run dev
# → http://localhost:3000 で起動
```

### 静的書き出し (GitHub Pages 用)

```bash
# ルート配信 (basePath なし) でビルド
npm run build

# GitHub Pages のサブパス配信用にビルド
# NEXT_PUBLIC_BASE_PATH に <リポジトリ名> を渡す
NEXT_PUBLIC_BASE_PATH=/eng-app npm run build

# 生成された静的ファイルをローカルで確認
npm run preview
# → http://localhost:5173
```

ビルド結果は `out/` ディレクトリに生成される。
`out/` の中身をそのまま GitHub Pages にデプロイすればよい。
`out/.nojekyll` が自動生成されるため、`_next` 等のアンダースコア始まりの
ディレクトリも Jekyll に消されない。

### GitHub Pages へのデプロイ (Sprint 5)

#### 自動デプロイ (推奨)

`.github/workflows/deploy.yml` に GitHub Actions のワークフローを同梱している。

1. GitHub リポジトリの **Settings → Pages → Build and deployment → Source**
   を **"GitHub Actions"** に切り替える
2. `main` ブランチに push する
3. Actions タブでビルドが緑になるのを待つ
4. 完了すると `https://<user>.github.io/<repo>/` で公開される

ワークフローは以下を行う:

- `npm ci` で依存をインストール
- `npm run lint` で lint エラーをチェック
- `NEXT_PUBLIC_BASE_PATH=/${{ repository.name }}` を渡して `npm run build`
- `out/.nojekyll` を生成
- `actions/upload-pages-artifact` で artifact 化
- `actions/deploy-pages` で Pages にデプロイ

#### 手動デプロイ

```bash
NEXT_PUBLIC_BASE_PATH=/eng-app npm run build
# 生成された out/ を任意の方法で push (例: gh-pages ブランチ)
```

#### サブパス URL のローカル確認

```bash
NEXT_PUBLIC_BASE_PATH=/eng-app npm run build
mkdir -p /tmp/pages/eng-app && cp -r out/* /tmp/pages/eng-app/
npx http-server /tmp/pages -p 5173
# → http://localhost:5173/eng-app/
```

### PWA (Sprint 5)

- `app/manifest.ts` — Web App Manifest (ビルド時に `out/manifest.webmanifest` として書き出し)
- `public/sw.js` — Service Worker (network-first for HTML / cache-first for assets)
- `public/icons/icon-192.png` `icon-512.png` — PWA ホーム画面アイコン
- `app/_components/RegisterServiceWorker.tsx` — クライアントマウント時に SW を `/${basePath}/sw.js` で登録
- `app/_components/ThemeApplier.tsx` — `<html data-theme>` を切り替えてライト/ダーク対応

### 主要ファイル

- `next.config.ts` — `output: 'export'` と `basePath` / `assetPrefix` の設定
- `app/page.tsx` — ホーム画面
- `app/session/page.tsx` — 学習セッション画面 + 結果画面
- `app/settings/page.tsx` — 設定画面 (テーマ / 効果音 / 既定カテゴリ・難易度 / リセット)
- `public/data/questions.json` — 問題プール (英単語 4 択)
- `lib/questions.ts` — 問題ロード・シャッフル
- `lib/settings.ts` — ユーザー設定の永続化 (LocalStorage)
- `lib/sound.ts` — 正誤フィードバック効果音 (Web Audio API シンセ)
- `lib/basePath.ts` — サブパス配信対応の URL ユーティリティ

## ライセンス

MIT
