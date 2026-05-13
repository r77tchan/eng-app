/**
 * CommuteEnglish — Service Worker
 *
 * 静的書き出し (`output: 'export'`) と整合する手書きの Service Worker。
 * 外部ライブラリは使わず、必要最小限のキャッシュ戦略のみを実装する。
 *
 * 方針:
 * - install: 起動に必要な最低限のリソース (manifest, icons, questions.json,
 *   トップページ) を pre-cache する。pre-cache に失敗してもインストールは続行
 *   する (オフライン未対応な環境でも体験を止めない)
 * - activate: 旧バージョンのキャッシュを掃除する
 * - fetch:
 *     - GET / 同一オリジン宛 / かつ http(s) スキームのみハンドルする
 *     - ナビゲーション (HTML) は network-first → cache fallback
 *     - その他の GET は cache-first → network fallback (取得できたら更新)
 *     - フルキャッシュ・最小キャッシュ両方を検索対象にする
 *
 * 1 度ロードした後はネットワークが切れても 1 セッションは完走できることが
 * Spec の目標 (非機能要件 / オフライン対応)。
 *
 * ─────────────────────────────────────────────────────────────────
 * フルキャッシュモード (Sprint 9 追加)
 * ─────────────────────────────────────────────────────────────────
 *
 * `precache-manifest.json` (ビルド時に `scripts/build-precache-manifest.mjs`
 * が生成) を参照し、サイト全体の HTML / JS / CSS / フォント / 画像 / 音声 /
 * JSON を **明示的に** キャッシュに投入する。発火は設定画面の「オフライン用に
 * ダウンロード」ボタンのクライアントが postMessage する形で行う。
 *
 * キャッシュ名分離方針:
 *   - 最小キャッシュ: `commute-en-${VERSION}`        ... install 時に常に作成
 *   - フルキャッシュ: `commute-en-full-${VERSION}`   ... PRECACHE_ALL で作成
 * `PRECACHE_CLEAR` はフルキャッシュ側のみ削除する。最小キャッシュは触らない。
 *
 * メッセージ仕様:
 *   client -> sw : { type: 'PRECACHE_ALL' }
 *                  manifest を取得し全エントリをフルキャッシュに put する。
 *                  進捗を逐次返す。
 *
 *   sw -> client : { type: 'PRECACHE_PROGRESS', done, total }
 *                  キャッシュ完了済み件数。throttle で間引いて送る。
 *
 *   sw -> client : { type: 'PRECACHE_DONE', total }
 *                  全件処理完了。failed が空でも 1 件あっても必ず送る。
 *
 *   sw -> client : { type: 'PRECACHE_ERROR', failed: string[] }
 *                  manifest 取得自体に失敗した場合 (オフラインなど) や、
 *                  個別ファイルの取得失敗があった場合に追加で送る。
 *
 *   client -> sw : { type: 'PRECACHE_CLEAR' }
 *                  フルキャッシュ全体を削除する。
 *
 *   sw -> client : { type: 'PRECACHE_CLEARED' }
 *                  クリア完了。
 */

const VERSION = "v1.1.0";
const CACHE_NAME = `commute-en-${VERSION}`;
const FULL_CACHE_NAME = `commute-en-full-${VERSION}`;

// SW のスコープを基点に解決する (GitHub Pages サブパス配信に対応)
const SCOPE = (self.registration && self.registration.scope) || self.location.href;
const SCOPE_URL = new URL(SCOPE);

function inScope(url) {
  try {
    const u = new URL(url, self.location.href);
    return u.origin === SCOPE_URL.origin && u.pathname.startsWith(SCOPE_URL.pathname);
  } catch {
    return false;
  }
}

function scopedPath(rel) {
  // rel が "/" 始まりでも、scope 配下に合わせる
  const base = SCOPE_URL.pathname.endsWith("/")
    ? SCOPE_URL.pathname
    : SCOPE_URL.pathname + "/";
  const stripped = rel.startsWith("/") ? rel.slice(1) : rel;
  return base + stripped;
}

const PRECACHE_PATHS = [
  scopedPath("/"),
  scopedPath("/data/questions.json"),
  scopedPath("/manifest.webmanifest"),
  scopedPath("/icons/icon-192.png"),
  scopedPath("/icons/icon-512.png"),
];

self.addEventListener("install", (event) => {
  // 新バージョンを即時アクティブにする
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 1 件失敗しても続行する (cache.addAll は 1 件失敗で全失敗するため避ける)
      await Promise.all(
        PRECACHE_PATHS.map(async (p) => {
          try {
            const res = await fetch(p, { cache: "no-cache" });
            if (res && (res.ok || res.type === "opaque")) {
              await cache.put(p, res.clone());
            }
          } catch {
            // 個別失敗は無視
          }
        }),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 旧キャッシュ (最小・フル両方) を掃除する。
      // `commute-en-` プレフィックス全体を見て、現バージョンの 2 つ以外を削除。
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith("commute-en-") &&
              k !== CACHE_NAME &&
              k !== FULL_CACHE_NAME,
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // POST 等のミューテーションはハンドルしない
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // 別オリジンや chrome-extension:// などはハンドルしない
  if (url.origin !== self.location.origin) return;
  // スコープ外もハンドルしない (basePath:/eng-app 配信で root に別アプリがある場合への配慮)
  if (!inScope(req.url)) return;

  // ナビゲーション (HTML) は network-first
  const isHtmlNav =
    req.mode === "navigate" ||
    (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

  if (isHtmlNav) {
    event.respondWith(networkFirst(req));
    return;
  }

  // それ以外は cache-first → 取得できれば裏で更新
  event.respondWith(cacheFirst(req));
});

/**
 * 最小キャッシュ → フルキャッシュ の順にヒットを確認する。
 * どちらかでヒットすれば cached Response を返す。
 */
async function matchAny(req) {
  const minCache = await caches.open(CACHE_NAME);
  const minHit = await minCache.match(req);
  if (minHit) return minHit;
  const fullCache = await caches.open(FULL_CACHE_NAME);
  const fullHit = await fullCache.match(req);
  return fullHit || null;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      // ナビゲーション応答は最小キャッシュ側を更新しておく
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await matchAny(req);
    if (cached) return cached;
    // ナビゲーションのフォールバックとして scope のトップを返す
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(scopedPath("/"));
    if (fallback) return fallback;
    // 最後の手段
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(req) {
  const cached = await matchAny(req);
  if (cached) {
    // 裏でネットワーク更新 (失敗は無視) — 最小キャッシュ側を更新する
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          caches
            .open(CACHE_NAME)
            .then((c) => c.put(req, res.clone()))
            .catch(() => {});
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
}

// ─────────────────────────────────────────────────────────────────
// message handler (Sprint 9: フルキャッシュモード)
// ─────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  const sourceId = event.source && event.source.id ? event.source.id : null;

  if (data.type === "PRECACHE_ALL") {
    event.waitUntil(precacheAll(sourceId));
    return;
  }
  if (data.type === "PRECACHE_CLEAR") {
    event.waitUntil(clearFullCache(sourceId));
    return;
  }
});

/**
 * 指定 client (もしくは全 client) に postMessage を送る。
 */
async function postToClient(sourceId, msg) {
  try {
    if (sourceId) {
      const client = await self.clients.get(sourceId);
      if (client) {
        client.postMessage(msg);
        return;
      }
    }
    // フォールバック: 全 client に送る
    const all = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of all) {
      c.postMessage(msg);
    }
  } catch {
    // 送信失敗は握りつぶす
  }
}

/**
 * `precache-manifest.json` を取得し、全エントリをフルキャッシュに put する。
 *
 * - 1 件失敗しても処理は止めない (Promise.all ではなく for-await でカウント)
 * - 進捗は `Math.max(1, Math.floor(total / 50))` 件ごとにまとめて送信し、
 *   最終 1 件は必ず送る
 * - 失敗があれば最終的に PRECACHE_ERROR { failed } を送る
 */
async function precacheAll(sourceId) {
  const manifestUrl = scopedPath("/precache-manifest.json");
  let manifest;
  try {
    const res = await fetch(manifestUrl, { cache: "no-cache" });
    if (!res || !res.ok) {
      await postToClient(sourceId, {
        type: "PRECACHE_ERROR",
        failed: [manifestUrl],
      });
      return;
    }
    manifest = await res.json();
  } catch {
    await postToClient(sourceId, {
      type: "PRECACHE_ERROR",
      failed: [manifestUrl],
    });
    return;
  }

  if (!Array.isArray(manifest)) {
    await postToClient(sourceId, {
      type: "PRECACHE_ERROR",
      failed: [manifestUrl],
    });
    return;
  }

  const cache = await caches.open(FULL_CACHE_NAME);
  const total = manifest.length;
  const failed = [];
  let done = 0;
  let lastReportedDone = 0;
  const step = Math.max(1, Math.floor(total / 50));

  // 並列実行 + 進捗カウント (Promise.all の全失敗トラップを避け、各 promise が個別に catch)
  const tasks = manifest.map(async (entry) => {
    const url = entry && typeof entry.url === "string" ? entry.url : null;
    if (!url) {
      failed.push(String(entry?.url ?? ""));
      done += 1;
      return;
    }
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res && (res.ok || res.type === "opaque")) {
        await cache.put(url, res.clone());
      } else {
        failed.push(url);
      }
    } catch {
      failed.push(url);
    } finally {
      done += 1;
      // throttle: step 件ごと、または最終件で送る
      if (done - lastReportedDone >= step || done === total) {
        lastReportedDone = done;
        await postToClient(sourceId, {
          type: "PRECACHE_PROGRESS",
          done,
          total,
        });
      }
    }
  });

  await Promise.all(tasks);

  // 最終進捗を確実に送る (throttle で取りこぼした場合の保険)
  if (lastReportedDone !== total) {
    await postToClient(sourceId, {
      type: "PRECACHE_PROGRESS",
      done: total,
      total,
    });
  }

  await postToClient(sourceId, { type: "PRECACHE_DONE", total });
  if (failed.length > 0) {
    await postToClient(sourceId, { type: "PRECACHE_ERROR", failed });
  }
}

/**
 * フルキャッシュのみを削除する。最小キャッシュ (install 時) は維持。
 */
async function clearFullCache(sourceId) {
  try {
    await caches.delete(FULL_CACHE_NAME);
  } catch {
    // 失敗しても CLEARED は返す (UI のリセットを止めない)
  }
  await postToClient(sourceId, { type: "PRECACHE_CLEARED" });
}
