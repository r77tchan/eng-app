"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sprint 9: Service Worker のフルキャッシュモードと postMessage で通信する専用フック。
 *
 * 責務:
 *   - SW (`public/sw.js`) との postMessage を局所化する
 *   - UI 側の状態機械 (idle / downloading / done / error / clearing / unsupported)
 *     を計算し、進捗を逐次反映する
 *   - 完了状態を LocalStorage (`commute-en:offline:v1`) に永続化する
 *   - 起動時に SW バージョンと永続化情報を突き合わせ、再ダウンロード推奨を返す
 *
 * React 19 ルール準拠:
 *   - `useEffect` 内で同期 setState は行わない (購読は addEventListener / cleanup)
 *   - addEventListener は必ず cleanup で removeEventListener する
 */

/** LocalStorage に保存される完了レコード。 */
type OfflineRecord = {
  /** 完了時の SW バージョン (SW から受信) */
  version: string;
  /** ISO 8601 形式の完了日時 */
  completedAt: string;
  /** ダウンロードした総ファイル数 */
  total: number;
};

const STORAGE_KEY = "commute-en:offline:v1";

export type OfflineState =
  | { phase: "unsupported" }
  | {
      phase: "idle";
      /** 「アプリが更新された」場合の旧バージョン情報 (推奨表示用) */
      previousRecord?: OfflineRecord;
    }
  | {
      phase: "downloading";
      done: number;
      total: number;
    }
  | {
      phase: "done";
      record: OfflineRecord;
      /** SW バージョンが更新されている場合に true */
      staleVersion: boolean;
    }
  | {
      phase: "error";
      message: string;
      /** SW が返した失敗 URL リスト (manifest 取得失敗時は manifest URL 単体) */
      failed: string[];
      /** 直前まで done だった場合の記録 */
      previousRecord?: OfflineRecord;
    }
  | {
      phase: "clearing";
      record: OfflineRecord;
    };

/** SW から受信するメッセージの型。 */
type SwMessage =
  | { type: "PRECACHE_PROGRESS"; done: number; total: number }
  | { type: "PRECACHE_DONE"; total: number }
  | { type: "PRECACHE_ERROR"; failed: string[] }
  | { type: "PRECACHE_CLEARED" };

/** LocalStorage から完了レコードを読む (SSR セーフ)。 */
function readRecord(): OfflineRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineRecord>;
    if (
      typeof parsed.version === "string" &&
      typeof parsed.completedAt === "string" &&
      typeof parsed.total === "number"
    ) {
      return {
        version: parsed.version,
        completedAt: parsed.completedAt,
        total: parsed.total,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeRecord(rec: OfflineRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // QuotaExceeded などは握りつぶす (UI 上は done として続行)
  }
}

function clearRecord(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 握りつぶす
  }
}

/**
 * 現在 active な SW から VERSION 文字列を取り出す簡易ヒューリスティック。
 * `navigator.serviceWorker.controller.scriptURL` から SW スクリプトを取得し、
 * `const VERSION = "v1.1.0";` 行を正規表現で抽出する。
 *
 * 取得失敗時は `"unknown"` を返す。
 */
async function fetchSwVersion(): Promise<string> {
  if (typeof navigator === "undefined") return "unknown";
  if (!("serviceWorker" in navigator)) return "unknown";
  const controller = navigator.serviceWorker.controller;
  if (!controller) return "unknown";
  try {
    const res = await fetch(controller.scriptURL, { cache: "no-cache" });
    if (!res.ok) return "unknown";
    const text = await res.text();
    const m = text.match(/const\s+VERSION\s*=\s*["']([^"']+)["']/);
    return m ? m[1] : "unknown";
  } catch {
    return "unknown";
  }
}

export type OfflineCacheActions = {
  state: OfflineState;
  /** 「オフライン用にダウンロード」を実行する。 */
  download: () => void;
  /** 「キャッシュを削除」を実行する。 */
  clear: () => void;
};

/**
 * SW フルキャッシュフックの本体。
 *
 * 初回マウント時に SW の存在確認 + LocalStorage 読み出しを行い、
 * 適切な初期 state を計算する。React 19 の useEffect 内同期 setState 禁止に
 * 従い、状態決定は 1 度のみ effect 内で行う。
 */
export function useOfflineCache(): OfflineCacheActions {
  // 初期は `unsupported` 想定で、effect で実値に差し替える。
  const [state, setState] = useState<OfflineState>({ phase: "unsupported" });

  // 現在の SW VERSION (`commute-en-${VERSION}` から抽出)
  const swVersionRef = useRef<string>("unknown");

  // 初回マウント: SW の存在確認 + 永続化情報読み出し
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (
        typeof navigator === "undefined" ||
        !("serviceWorker" in navigator) ||
        !navigator.serviceWorker.controller
      ) {
        if (!cancelled) setState({ phase: "unsupported" });
        return;
      }
      const version = await fetchSwVersion();
      if (cancelled) return;
      swVersionRef.current = version;
      const record = readRecord();
      if (record) {
        const staleVersion = record.version !== version && version !== "unknown";
        setState({ phase: "done", record, staleVersion });
      } else {
        setState({ phase: "idle" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // SW からのメッセージ受信ハンドラ
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const data = event.data as SwMessage | undefined;
      if (!data || typeof data !== "object") return;

      if (data.type === "PRECACHE_PROGRESS") {
        // downloading 中のみ反映 (取り違え防止)
        setState((prev) => {
          if (prev.phase !== "downloading") return prev;
          return { phase: "downloading", done: data.done, total: data.total };
        });
        return;
      }
      if (data.type === "PRECACHE_DONE") {
        const version = swVersionRef.current;
        const record: OfflineRecord = {
          version,
          completedAt: new Date().toISOString(),
          total: data.total,
        };
        writeRecord(record);
        setState((prev) => {
          // error が後発で来ることがあるため、PRECACHE_DONE 時点では done に確定させ、
          // 次の PRECACHE_ERROR で error 上書き (previousRecord 付き) に切り替える。
          if (prev.phase === "downloading" || prev.phase === "error") {
            return { phase: "done", record, staleVersion: false };
          }
          return prev;
        });
        return;
      }
      if (data.type === "PRECACHE_ERROR") {
        const failed = Array.isArray(data.failed) ? data.failed : [];
        const message =
          failed.length === 1
            ? "ダウンロード中にエラーが発生しました。ネットワーク接続を確認してください。"
            : `${failed.length} 件のファイルがダウンロードできませんでした。`;
        setState((prev) => {
          const previousRecord =
            prev.phase === "done"
              ? prev.record
              : prev.phase === "error"
                ? prev.previousRecord
                : undefined;
          return { phase: "error", message, failed, previousRecord };
        });
        return;
      }
      if (data.type === "PRECACHE_CLEARED") {
        clearRecord();
        setState({ phase: "idle" });
        return;
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, []);

  const download = useCallback(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      setState({
        phase: "error",
        message:
          "Service Worker が未登録です。ページを再読み込みしてからもう一度お試しください。",
        failed: [],
      });
      return;
    }
    if (typeof navigator.onLine === "boolean" && !navigator.onLine) {
      // オフライン状態でのダウンロード試行は明示エラーにする (UI のクラッシュ防止)
      setState({
        phase: "error",
        message: "ネットワーク接続を確認してください。",
        failed: [],
      });
      return;
    }
    setState({ phase: "downloading", done: 0, total: 0 });
    controller.postMessage({ type: "PRECACHE_ALL" });
  }, []);

  const clear = useCallback(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      clearRecord();
      setState({ phase: "idle" });
      return;
    }
    setState((prev) => {
      if (prev.phase === "done") {
        return { phase: "clearing", record: prev.record };
      }
      return prev;
    });
    controller.postMessage({ type: "PRECACHE_CLEAR" });
  }, []);

  return { state, download, clear };
}
