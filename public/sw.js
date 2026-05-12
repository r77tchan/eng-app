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
 *
 * 1 度ロードした後はネットワークが切れても 1 セッションは完走できることが
 * Spec の目標 (非機能要件 / オフライン対応)。
 */

const VERSION = "v1.0.0";
const CACHE_NAME = `commute-en-${VERSION}`;

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
      // 旧キャッシュを掃除
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
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

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // ナビゲーションのフォールバックとして scope のトップを返す
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
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) {
    // 裏でネットワーク更新 (失敗は無視)
    fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
}
