#!/usr/bin/env node
/**
 * scripts/build-precache-manifest.mjs
 *
 * 目的:
 *   Next.js の `next build` (static export) で生成された `out/` ディレクトリを
 *   再帰的にスキャンし、CommuteEnglish の Service Worker (`public/sw.js`) が
 *   フルキャッシュモードで取得すべき全ファイルを列挙した
 *   `out/precache-manifest.json` を書き出す。
 *
 *   Sprint 9 で導入。Service Worker の install 時 pre-cache は最小 5 ファイル
 *   (トップ HTML / questions.json / manifest / icons) しかカバーしておらず、
 *   `/history`, `/settings`, `/start` といった未訪問ページは機内モードで
 *   初回遷移できない。本スクリプトの出力により、SW は全アセットを 1 ボタンで
 *   キャッシュ投入できるようになる。
 *
 * 入力:
 *   - 環境変数 `NEXT_PUBLIC_BASE_PATH` (例: `/eng-app`)
 *     - GitHub Pages のサブパス配信に対応。各 url フィールドの先頭に付与される。
 *     - 未設定の場合 (ローカル開発・独自ドメイン直配信) は空文字扱い。
 *   - `out/` ディレクトリ (Next.js が `output: 'export'` で生成)
 *
 * 出力:
 *   - `out/precache-manifest.json`
 *     - 形式: `Array<{ url: string, hash: string, size: number }>`
 *     - `url`  : `NEXT_PUBLIC_BASE_PATH` を含む、SW がそのまま `fetch()` できる絶対パス
 *     - `hash` : ファイル内容の sha256 を 16 文字に切り詰めたもの (キャッシュキー用途)
 *     - `size` : バイト単位のファイルサイズ
 *
 * basePath 取り扱い:
 *   - `NEXT_PUBLIC_BASE_PATH` が `eng-app` のように先頭スラッシュなしで来た場合も
 *     `/eng-app` に補正する (`lib/basePath.ts` と同じ規約)。
 *   - `trailingSlash: true` の設定により Next.js は `out/history/index.html` を
 *     出力する。マニフェストには **ファイル実体パス** (`/eng-app/history/index.html`) と
 *     **配信される URL** (`/eng-app/history/`) の両方を別エントリとして登録する。
 *     これにより SW は `<a href="/eng-app/history/">` の navigation でも
 *     直接の `/eng-app/history/index.html` リクエストでもキャッシュヒットさせられる。
 *
 * 除外ルール (`isExcluded`):
 *   - `precache-manifest.json` 自身 (再帰参照を避ける)
 *   - `sw.js` (SW 自身を SW がキャッシュすると更新が止まる)
 *   - `.nojekyll` (Pages のメタファイル、配信不要)
 *   - `*.map` (ソースマップ、容量浪費)
 *
 * 補足: 以前は `__next.*` で始まるファイルを「配信時に使用しない」として除外していたが、
 * Next.js 16 では `__next._tree.txt` / `__next.<segment>.__PAGE__.txt` 等が
 * App Router のプリフェッチ RSC ペイロードとして runtime に fetch されるため、
 * 除外するとオフラインで client-side navigation が失敗する。よって全て含める。
 *
 * 失敗ハンドリング:
 *   - `out/` が存在しない場合は明確なエラーメッセージで `process.exit(1)` する。
 *   - 個別ファイルの読み込みに失敗した場合はそのエントリをスキップし、
 *     stderr に警告を出して処理は続行する (片落ち)。
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");
const MANIFEST_FILE = path.join(OUT_DIR, "precache-manifest.json");

// `lib/basePath.ts` と同じ正規化規約。
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BASE_PATH =
  rawBasePath && !rawBasePath.startsWith("/") ? `/${rawBasePath}` : rawBasePath;

/**
 * 相対 POSIX パス (例: `_next/static/chunks/foo.js`) を public URL に変換する。
 * 先頭にスラッシュを必ず付け、basePath があれば前置する。
 */
function toPublicUrl(relPosix) {
  const withSlash = relPosix.startsWith("/") ? relPosix : `/${relPosix}`;
  return `${BASE_PATH}${withSlash}`;
}

/**
 * 除外判定。
 * `relPosix` は OUT_DIR からの相対 POSIX パス (slashed)。
 */
function isExcluded(relPosix) {
  // 自身
  if (relPosix === "precache-manifest.json") return true;
  // SW 自身
  if (relPosix === "sw.js") return true;
  // GitHub Pages 用メタ
  if (relPosix === ".nojekyll") return true;
  // ソースマップ
  if (relPosix.endsWith(".map")) return true;
  return false;
}

/**
 * ディレクトリを再帰的に walk して、全ファイルの絶対パスを返す。
 */
async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(full);
      out.push(...nested);
    } else if (entry.isFile()) {
      out.push(full);
    }
    // symbolic link は読まない (export ではまず出ない)
  }
  return out;
}

/**
 * ファイルの sha256 (16 文字) と size を返す。
 */
async function hashAndSize(filePath) {
  const buf = await readFile(filePath);
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  return { hash, size: buf.byteLength };
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    console.error(
      `[build-precache-manifest] ERROR: '${OUT_DIR}' が存在しません。先に \`next build\` を実行してください。`,
    );
    process.exit(1);
  }

  const outStat = await stat(OUT_DIR);
  if (!outStat.isDirectory()) {
    console.error(
      `[build-precache-manifest] ERROR: '${OUT_DIR}' はディレクトリではありません。`,
    );
    process.exit(1);
  }

  const allFiles = await walk(OUT_DIR);

  /** @type {Array<{ url: string, hash: string, size: number }>} */
  const entries = [];
  // URL の重複登録防止 (HTML の二重エントリで衝突しないようにする)
  const seenUrls = new Set();

  for (const filePath of allFiles) {
    const relAbs = path.relative(OUT_DIR, filePath);
    // Windows のセパレータも POSIX に統一
    const relPosix = relAbs.split(path.sep).join("/");
    if (isExcluded(relPosix)) continue;

    let hashSize;
    try {
      hashSize = await hashAndSize(filePath);
    } catch (err) {
      console.warn(
        `[build-precache-manifest] WARN: '${relPosix}' を読めませんでした: ${err?.message ?? err}`,
      );
      continue;
    }
    const { hash, size } = hashSize;

    // 1) ファイル実体 URL (例: /eng-app/history/index.html)
    const realUrl = toPublicUrl(relPosix);
    if (!seenUrls.has(realUrl)) {
      seenUrls.add(realUrl);
      entries.push({ url: realUrl, hash, size });
    }

    // 2) trailingSlash: true 対応:
    //    - `index.html` で終わるパスは「配信される URL」を追加で登録する
    //    - 例: `/eng-app/history/index.html` -> `/eng-app/history/`
    //    - ルート (`out/index.html` -> `/eng-app/`) も同様
    if (relPosix.endsWith("index.html")) {
      // index.html を取り除いた後のディレクトリ表現
      const dirRel = relPosix.slice(0, -"index.html".length); // "history/" or ""
      const servedUrl = toPublicUrl(dirRel.length === 0 ? "/" : `/${dirRel}`);
      if (!seenUrls.has(servedUrl)) {
        seenUrls.add(servedUrl);
        entries.push({ url: servedUrl, hash, size });
      }
    }
  }

  // 安定した出力にするため URL でソート
  entries.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));

  await writeFile(MANIFEST_FILE, JSON.stringify(entries, null, 2) + "\n", "utf8");
  console.log(
    `[build-precache-manifest] wrote ${entries.length} entries -> ${path.relative(PROJECT_ROOT, MANIFEST_FILE)}` +
      (BASE_PATH ? ` (basePath=${BASE_PATH})` : ""),
  );
}

main().catch((err) => {
  console.error("[build-precache-manifest] FATAL:", err);
  process.exit(1);
});
