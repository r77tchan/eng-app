"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/basePath";

/**
 * Service Worker をクライアントマウント時に 1 度だけ登録する。
 *
 * - basePath 配下に置いてある `/sw.js` を登録する
 * - サブパス配信 (GitHub Pages) の場合、scope は basePath で始まる必要がある
 * - 失敗時は握りつぶす (PWA 機能はベストエフォート扱い。学習体験は止めない)
 *
 * `useEffect` body 内で setState は行わない (React 19 ルール準拠)。
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const swUrl = withBasePath("/sw.js");
    const scope = withBasePath("/");

    // 開発時 (next dev) は localhost で SW が悪さしないよう、
    // 同オリジン上ですでに登録された SW があれば再登録だけして終了。
    const register = () => {
      navigator.serviceWorker
        .register(swUrl, { scope })
        .catch(() => {
          // 失敗は無視 (例: Safari の private モード等)
        });
    };

    // 描画ブロックしないよう load 後に登録
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
