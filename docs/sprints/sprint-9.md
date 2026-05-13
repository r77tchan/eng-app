## Sprint 9: ワンボタン完全オフライン対応 (Full Precache)

### 目的

ユーザーが **設定画面の「オフライン用にダウンロード」ボタンを 1 回押すだけ** で、CommuteEnglish の全ページ・全アセットを端末キャッシュに格納し、その後は機内モード／地下鉄区間／圏外でもサイト内のどのページにも遷移でき、1 セッション完走 (10 問) まで一切ネットワークを必要としない状態を作る。

Sprint 5 で導入した Service Worker (`public/sw.js`) は install 時に 5 ファイル (トップ HTML / `questions.json` / `manifest.webmanifest` / icon 192 / icon 512) しか pre-cache していない。`/history` `/settings` `/start` 等の **未訪問ページの HTML や、そのページが読み込む JS チャンク・CSS・フォント** はユーザーが実際にそのページを開くまでキャッシュされず、機内モードで初回遷移すると失敗する穴がある。本スプリントはこの穴を、ビルド成果物 (`out/`) から自動生成する **precache-manifest** と、SW に追加する **明示的フルキャッシュモード** で塞ぐ。

### 前提

- Sprint 8 が完了していること (PC キーボード操作対応・問題プール 120 問・「わからない」回答・セッション中断・音声読み上げ・PWA 化・GitHub Pages デプロイの全てが動作していること)
- 既存の Service Worker (`public/sw.js`) の install 時の最小 pre-cache (5 ファイル) はそのまま残し、起動最低限の安心保証を壊さないこと
- 既存の fetch ハンドラ戦略 (HTML は network-first / その他は cache-first) を維持すること
- 既存の `data-testid` (`settings-page` / `setting-sound-toggle` / `speech-toggle` / `setting-default-category` / `setting-default-difficulty` / `setting-theme` / `data-reset-button` 等) を維持し、Sprint 1〜8 の Playwright 検証が引き続き全て通ること

### 実装する機能

- **precache-manifest 自動生成スクリプト**: `scripts/build-precache-manifest.mjs` (新規) が `out/` 配下を再帰スキャンし、配信対象の全ファイル (HTML / JS / CSS / フォント / 画像 / JSON / 音声 / Manifest 等) を列挙、各ファイルの内容ハッシュとパス一覧を `out/precache-manifest.json` として書き出す
- **ビルドパイプライン統合**: `package.json` の `build` および `build:pages` スクリプトに上記マニフェスト生成ステップを組み込み、ビルド完了時に常に最新のマニフェストが `out/` に存在する
- **SW フルキャッシュモードの追加**: 既存 `public/sw.js` を拡張し、クライアントから `{ type: 'PRECACHE_ALL' }` の postMessage を受け取ったら `precache-manifest.json` を取得して全エントリをキャッシュに投入する
- **進捗 / 完了 / エラー通知**: SW から `{ type: 'PRECACHE_PROGRESS', done, total }` `{ type: 'PRECACHE_DONE', total }` `{ type: 'PRECACHE_ERROR', failed: string[] }` を postMessage でクライアントに通知する
- **キャッシュクリア用メッセージ**: `{ type: 'PRECACHE_CLEAR' }` を受け取ったら、フルキャッシュで取得した全エントリを削除し `{ type: 'PRECACHE_CLEARED' }` を返す (install 時の最小 pre-cache は残す)
- **設定画面の「オフライン対応」セクション**: `/settings` に新セクション (badge `06 / Offline` 想定) を追加し、ダウンロード開始ボタン・進捗バー・完了バッジ・再ダウンロード／キャッシュ削除導線を提供する
- **完了状態の LocalStorage 永続化**: フルキャッシュ完了時の SW バージョン・完了日時を LocalStorage に保存し、次回起動時にも「オフライン対応済み」と判定できるようにする

### 設計判断 (理由つき)

- **ボタンを設定画面に配置し、ホームには置かない**: ホームに置くと「学習開始の前に押すべきもの」と誤解されストレスになる。明示的にユーザーが意思を持って「オフライン用に落とす」操作なので、設定画面の専用セクションに格納する
- **ビルド時マニフェスト生成 (ランタイム再帰探索ではなく)**: SW から `out/` の中身を再帰的に列挙する手段は存在しない (静的ホスティングではディレクトリリストが返らない)。よってビルド時に `node` スクリプトで `out/` を walk し、JSON マニフェストを書き出す方式を採る
- **basePath への対応**: GitHub Pages は `/<repo>/` 配下に配信されるため、マニフェスト内の各エントリは scope 相対パス (例: `/eng-app/_next/static/chunks/foo.js`) で記録する。`NEXT_PUBLIC_BASE_PATH` を `scripts/build-precache-manifest.mjs` でも参照し、`out/` 内ファイルのパスから `process.env.NEXT_PUBLIC_BASE_PATH` 込みの公開 URL パスを組み立てる
- **ハッシュは内容ベースの整合確認用 (ETag 代替)**: 各エントリに `{ url, hash, size }` を持たせる。SW がキャッシュ済みエントリのバージョン検証や進捗集計に使えるようにする。ハッシュアルゴリズムは Node の `crypto.createHash('sha256').digest('hex').slice(0, 16)` 程度で十分 (改ざん検出ではなくキャッシュキー用途)
- **HTML 拡張子の扱い**: `trailingSlash: true` 設定により Next.js は `out/history/index.html` のような形で出力する。マニフェストには **配信される URL** (`/history/`) と **実ファイルパス** (`/history/index.html`) の両方をエントリとして含める。SW は両者を別エントリとしてキャッシュに put し、ユーザーが `/history` でも `/history/` でもアクセスできるようにする
- **巨大ファイルの除外**: `out/precache-manifest.json` 自身、`out/.nojekyll`、`out/sw.js` (SW 本体) は除外する。SW 自身を SW がキャッシュすると更新が止まる
- **`source map (.map)` の除外**: 学習体験には不要、容量を圧迫するだけなので除外する
- **失敗ファイルの記録方針**: 1 件失敗でも処理は止めず、`failed` 配列に URL を積んで最後にまとめてクライアントに通知する。再ダウンロードは失敗分のみ対象にできるとなお良いが、本スプリントの必須契約は「再ダウンロードボタンで全ファイル再取得」までで OK
- **進捗 throttle**: 1 ファイル取得ごとに postMessage すると 100〜300 件で過剰になる。`Math.max(1, Math.floor(total / 50))` 件ごとにまとめて送る、または `requestAnimationFrame` 1 フレームごとに最新値だけ送る方式とする (実装裁量。ただし最後の 1 件は必ず送る)
- **完了状態の判定キー**: LocalStorage に `commute-en:offline:v1` というキーで `{ version: SW_VERSION, completedAt: ISOString, total: number }` を保存する。SW のバージョン (`VERSION` 定数) が変わったら「再ダウンロード推奨」を出す
- **キャッシュ削除の挙動**: フルキャッシュ用に新規キャッシュ名 (例: `commute-en-full-${VERSION}`) を分離し、削除時はそちらだけ消す。install 時の最小 pre-cache (`commute-en-${VERSION}`) は触らない。これにより「フルキャッシュ削除 = 機内モードで未訪問ページに行けない状態に戻る」だが「直近 1 セッション完走の保証 (Spec の従来目標) は維持される」状態を保てる
- **SW のメッセージは postMessage 経由のみ (URL クエリで叩かない)**: 副作用のあるリクエストを Service Worker の fetch ハンドラで実装すると、ブラウザのキャッシュバスティング動作 (`Cache-Control: no-cache` 付きリロード) で意図せず再実行される。`navigator.serviceWorker.controller.postMessage(...)` に統一する
- **ネット未接続で「ダウンロード」を押した場合のハンドリング**: マニフェスト取得自体が失敗する。SW は `PRECACHE_ERROR` を返し、UI は「オフラインのためダウンロードできません。ネットワーク接続を確認してください」を表示する
- **ボタンの状態機械**:
  - `idle` (未ダウンロード or キャッシュ削除済み) → 「オフライン用にダウンロード」
  - `downloading` (進行中) → プログレスバー + キャンセル不可表示 (本スプリントではキャンセル機能は契約外)
  - `done` → 「オフライン対応済み」バッジ + 「再ダウンロード」「キャッシュを削除」サブ操作
  - `error` → エラーメッセージ + 「再試行」ボタン

### スプリント契約 (完了条件)

以下の全条件を満たした場合のみ、このスプリントは完了とする。

#### precache-manifest 生成スクリプト

- [ ] `scripts/build-precache-manifest.mjs` が新規追加されている
- [ ] スクリプトは `out/` ディレクトリ配下を再帰スキャンし、HTML / JS / CSS / フォント / 画像 / JSON / 音声 / `manifest.webmanifest` を列挙する
- [ ] 各エントリは `{ url: string, hash: string, size: number }` 形式の JSON 配列として `out/precache-manifest.json` に書き出される
- [ ] `url` フィールドは `NEXT_PUBLIC_BASE_PATH` を尊重して組み立てられる (例: 環境変数が `/eng-app` の場合 `/eng-app/_next/static/chunks/...` の形式になる)
- [ ] `trailingSlash: true` に合わせ、`out/history/index.html` のようなファイルは公開 URL `/history/` の形でも追加でエントリ登録される (HTML 配信パスとファイル実体パスの両方を解決可能にする)
- [ ] 以下のファイルは precache-manifest に **含まれない**: `precache-manifest.json` 自身 / `sw.js` / `.nojekyll` / `*.map` (ソースマップ)
- [ ] フォント (`next/font/google` が `_next/static/media/` 配下に生成する自己ホスト化済みフォント) は precache-manifest に含まれる
- [ ] 音声アセット (`/sounds/correct.wav` `/sounds/incorrect.wav`) は precache-manifest に含まれる
- [ ] アイコン (`/icons/icon-192.png` `/icons/icon-512.png` および maskable バリアント) は precache-manifest に含まれる
- [ ] スクリプトは `out/` ディレクトリが存在しない状態で起動された場合、明確なエラーメッセージで終了する (`exit 1`)

#### ビルドパイプライン統合

- [ ] `package.json` の `build` スクリプトが `next build && node scripts/build-precache-manifest.mjs && touch out/.nojekyll` 相当の構成になっている (順序: next build → manifest 生成 → .nojekyll)
- [ ] `package.json` の `build:pages` スクリプトも同様にマニフェスト生成ステップを含み、`NEXT_PUBLIC_BASE_PATH` がスクリプトに伝播する
- [ ] `npm run build` が成功し、終了後 `out/precache-manifest.json` が存在する
- [ ] `npm run build:pages` が成功し、`out/precache-manifest.json` 内の URL が `/eng-app/...` プレフィックスを持つ
- [ ] `npm run lint` がエラー 0 件で完了する

#### Service Worker の拡張

- [ ] `public/sw.js` に `message` イベントリスナが追加され、`{ type: 'PRECACHE_ALL' }` を受け取って `precache-manifest.json` を取得・パースしてキャッシュに投入する
- [ ] フルキャッシュは install 時の最小 pre-cache とは別のキャッシュ名 (例: `commute-en-full-${VERSION}`) に格納される
- [ ] 1 件失敗しても処理が止まらず、残りのエントリの取得は続行される (`Promise.all` での全失敗を避ける)
- [ ] 進捗が `{ type: 'PRECACHE_PROGRESS', done: number, total: number }` の形でクライアントに postMessage される
- [ ] 全件完了時に `{ type: 'PRECACHE_DONE', total: number }` が postMessage される
- [ ] 失敗エントリが 1 件以上ある場合、完了時に追加で `{ type: 'PRECACHE_ERROR', failed: string[] }` が postMessage される
- [ ] `{ type: 'PRECACHE_CLEAR' }` を受け取ると `commute-en-full-${VERSION}` のキャッシュ全体が削除され、完了時に `{ type: 'PRECACHE_CLEARED' }` が postMessage される
- [ ] `PRECACHE_CLEAR` 後も install 時の最小 pre-cache (`commute-en-${VERSION}`) は残っており、トップページ・`questions.json`・manifest・icons はオフラインで配信できる
- [ ] 既存の fetch ハンドラ (HTML network-first / その他 cache-first) はフルキャッシュ・最小キャッシュ両方を順に参照するよう拡張されている (どちらにヒットしてもオフライン応答可能)
- [ ] activate 時の旧キャッシュ掃除ロジックは `commute-en-*` プレフィックス全体 (最小・フル両方) を対象に維持される
- [ ] SW のバージョン定数 (`VERSION`) を上げた際、旧バージョンのフルキャッシュも activate 時に削除される

#### 設定画面 UI (`/settings`)

- [ ] 設定画面に「オフライン対応」セクション (badge `06 / Offline` 想定、既存セクションと同じ `SettingsSection` コンポーネントを使用) が追加されている
- [ ] セクションには `data-testid="offline-section"` が付与されている
- [ ] セクション内に主要ボタンが 1 つ存在し、状態に応じて以下のラベルになる:
  - 未ダウンロード時: 「オフライン用にダウンロード」 (`data-testid="offline-download-button"`)
  - 進行中: 進捗テキスト + プログレスバー (`data-testid="offline-progress-bar"`、`role="progressbar"`、`aria-valuemin="0"` `aria-valuemax="100"` `aria-valuenow` を持つ)
  - 完了時: 「オフライン対応済み」バッジ (`data-testid="offline-status-done"`) + 「再ダウンロード」 (`data-testid="offline-redownload-button"`)
- [ ] 進行中はメインボタンが disabled となり、二重押下できない
- [ ] 進行中、`{ type: 'PRECACHE_PROGRESS' }` を受け取るたびに `done / total` の数値と % プログレスが UI に反映される
- [ ] 完了時、`{ type: 'PRECACHE_DONE' }` を受け取ると LocalStorage キー `commute-en:offline:v1` に `{ version, completedAt, total }` が保存される
- [ ] 失敗時、`{ type: 'PRECACHE_ERROR' }` を受け取るとエラーメッセージと失敗件数 (例: `3 件のファイルがダウンロードできませんでした`) を表示し、「再試行」 (`data-testid="offline-retry-button"`) で再ダウンロードできる
- [ ] 「キャッシュを削除」 (`data-testid="offline-clear-button"`) が完了状態のときに表示され、押下すると確認ダイアログを経由してフルキャッシュ削除を実行する (削除中は disabled)
- [ ] キャッシュ削除完了後、UI は `idle` (未ダウンロード) 状態に戻り、LocalStorage の `commute-en:offline:v1` も削除される
- [ ] ページ初回マウント時、LocalStorage に完了レコードが存在し、かつ SW バージョンが一致する場合、初期表示は完了状態となる
- [ ] SW バージョンが LocalStorage の完了レコードと一致しない場合、「アプリが更新されました。再ダウンロードを推奨します」の注意書きが表示される (`data-testid="offline-update-hint"`)
- [ ] ネット未接続状態で「ダウンロード」を押した場合、UI は明示的なエラーメッセージ「ネットワーク接続を確認してください」を表示する (アプリがクラッシュしない)
- [ ] Service Worker が未登録 (`navigator.serviceWorker.controller` が null) のとき、「ページを再読み込みしてからもう一度お試しください」を表示し、ダウンロードは試行しない

#### オフライン動作 (Playwright で検証可能)

- [ ] 公開 URL でアプリを開き、設定画面の「オフライン用にダウンロード」を押下して完了表示まで進めることができる
- [ ] その後、ブラウザコンテキストをオフライン (`context.setOffline(true)` 相当) にした状態で `/` `/start/` `/session/` `/history/` `/settings/` のいずれに対しても **未訪問の初回遷移が成功** する (HTML が表示され、白画面・404 にならない)
- [ ] オフライン状態で 1 セッション (10 問) を完走でき、正誤フィードバック・「わからない」回答・セッション中断・結果画面・履歴反映が全て動作する
- [ ] オフライン状態で `/sounds/correct.wav` `/sounds/incorrect.wav` がキャッシュから返り、効果音 ON 時に音が鳴る (`fetch` リクエストが失敗しない)
- [ ] オフライン状態でフォントが欠落表示にならない (`next/font/google` が自己ホスト化した `_next/static/media/*.woff2` がキャッシュヒットする)
- [ ] オフラインかつフルキャッシュ削除済みの状態でも、トップページ (`/`) は表示でき、`questions.json` も取得できる (= install 時の最小 pre-cache が機能している = Sprint 5 の従来保証を破壊していない)

#### 既存機能の維持 (Sprint 1〜8 を壊さない)

- [ ] Sprint 1〜8 で導入された全ての `data-testid` が引き続き存在する (`choice` / `next-button` / `result-score` / `result-review-summary` / `dont-know-button` / `abort-button` / `abort-confirm-dialog` / `speak-button` / `speech-toggle` / `setting-default-category` / `setting-default-difficulty` / `setting-theme` / `setting-sound-toggle` / `data-reset-button` 等)
- [ ] Sprint 8 のキーボード操作 (`1`〜`4` / `Enter` / `Space` / `Escape`) が学習セッション画面で引き続き動作する
- [ ] 設定画面の既存セクション (Defaults / Theme / Sound / Speech / Data / About) のレイアウト・挙動が変わらない
- [ ] 学習セッションを 1 セット完走したときの所要時間 (体感) が Sprint 8 と同等で、フルキャッシュ機能の追加によって学習導線のレスポンス速度が悪化しない

#### モバイル UI (スマホ体験を壊さない)

- [ ] 375px 幅のビューポートで「オフライン対応」セクションが横スクロールなしで収まる
- [ ] ダウンロードボタン・再ダウンロードボタン・キャッシュ削除ボタンは最小 44x44px のタップ領域を持つ
- [ ] プログレスバーは画面幅にフィットし、375px 幅でも視認できる高さ (8px 以上) を持つ
- [ ] 進捗テキスト (`done / total`) は等幅フォント (`--font-mono` 相当) で表示され、数値の桁変動でレイアウトが揺れない

#### デザイン (デザイントークン準拠)

- [ ] セクションは既存の `SettingsSection` コンポーネントを再利用し、badge / shortLabel / title / description の構造が他セクションと一貫している
- [ ] プログレスバーは `--color-accent` (#0066ff) または `--color-primary` をベースカラーに使い、背景は `--color-bg-secondary`、ボーダーラディウスは `--radius-md` 以上
- [ ] 完了バッジ (チェックマーク or 「DONE」ラベル) には `--color-success` (#22c55e) を用い、微細な fade-in アニメーション (200〜400ms) を伴う
- [ ] エラー表示は `--color-error` (#ef4444) を用い、アイコン + 文言で構成される
- [ ] ボタン・テキストのフォントは既存セクションと同じ `--font-sans` / `--font-mono` 区分を踏襲する
- [ ] 進捗中のプログレスバーには、shimmer / pulse / 進捗反映の transition (`transition: width 200ms ease-out` 相当) のいずれかが適用され、静止して見えない
- [ ] スマホ・PC・ライト・ダーク (Theme: light / dark / system) のいずれでもコントラスト比 4.5:1 以上を確保する

#### コード品質

- [ ] `npm run lint` がエラー 0 件で完了する
- [ ] `npm run build` が成功し、`out/precache-manifest.json` が生成される
- [ ] `npm run build:pages` が成功し、`out/precache-manifest.json` の URL が `/eng-app/` プレフィックスを持つ
- [ ] フルキャッシュ関連の SW ロジックは `public/sw.js` 内で関数として分離されている (`precacheAll()` `clearFullCache()` 等の命名)
- [ ] フルキャッシュ関連の UI ロジックは `app/settings/_components/OfflineSection.tsx` 等の新規ファイルに局所化されている
- [ ] 設定画面の SW 通信フックは `lib/useOfflineCache.ts` 等の専用フックに分離されている (postMessage / addEventListener('message') のライフサイクル管理込み)
- [ ] 1 ファイル 200 行を超えるコンポーネントを新規作成しない (SW 本体は機能追加の都合上 200 行を超えてよい)
- [ ] React 19 ルールに違反しない (`useEffect` 内で同期 setState を行わない / リスナは必ず cleanup する)
- [ ] TypeScript の型エラーが 0 件

#### ドキュメント

- [ ] `/docs/spec.md` の「非機能要件 / オフライン対応」項目が更新され、ワンボタンでサイト全体をオフライン対応にできることが記載されている (優先度「低」→ 「中」相当に格上げ、または Sprint 9 で実現済みとして明記)
- [ ] 新規スクリプト (`scripts/build-precache-manifest.mjs`) の冒頭に、目的・入出力・basePath 取り扱いを説明する JSDoc コメントが書かれている
- [ ] 拡張した `public/sw.js` の冒頭コメントに、フルキャッシュモードの存在・キャッシュ名分離方針・メッセージ仕様 (`PRECACHE_ALL` / `PRECACHE_PROGRESS` / `PRECACHE_DONE` / `PRECACHE_ERROR` / `PRECACHE_CLEAR` / `PRECACHE_CLEARED`) が追記されている
