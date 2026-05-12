/**
 * 復習キュー (誤答キュー) の永続化レイヤ (LocalStorage)
 *
 * ## 設計
 * - LocalStorage に「復習が必要な問題 ID の配列」を JSON で保存する
 * - クラウド送信は一切行わない (ブラウザ内で完結)
 * - SSR / 静的書き出し時 (window 未定義) では空配列フォールバック
 * - 同一 ID の重複登録はせず、追加順を保ったまま de-dup する
 * - React 19 の useSyncExternalStore で購読できるよう、
 *   subscribe / getSnapshot / getServerSnapshot API を提供
 *
 * ## ストレージスキーマ (バージョン 1)
 * key:   "commute-en:review-queue:v1"
 * value: JSON.stringify({ version: 1, ids: string[] })
 *
 * 将来のスキーマ変更時は version 番号を上げ、マイグレーションで対応する。
 *
 * ## 出題ロジックとの分離
 * 「キューに溜まった ID をどう問題化するか」「カテゴリで絞り込むか」は
 * このモジュールの責務外。lib/sessionPlanner.ts 側に置く。
 */

export const REVIEW_QUEUE_STORAGE_KEY = "commute-en:review-queue:v1";
const SCHEMA_VERSION = 1;

type StoredPayload = {
  version: number;
  ids: string[];
};

/** SSR 環境でも安全に LocalStorage 参照できるか */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    // Safari プライベートモード等
    return false;
  }
}

function isValidId(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function readPayload(): StoredPayload {
  if (!isStorageAvailable()) {
    return { version: SCHEMA_VERSION, ids: [] };
  }
  try {
    const raw = window.localStorage.getItem(REVIEW_QUEUE_STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, ids: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "ids" in parsed &&
      Array.isArray((parsed as StoredPayload).ids)
    ) {
      // 不正値混入を防ぐ + 重複除去 (追加順保持)
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const v of (parsed as StoredPayload).ids) {
        if (isValidId(v) && !seen.has(v)) {
          seen.add(v);
          ids.push(v);
        }
      }
      return { version: SCHEMA_VERSION, ids };
    }
    return { version: SCHEMA_VERSION, ids: [] };
  } catch {
    // 壊れた JSON は無視して空とみなす
    return { version: SCHEMA_VERSION, ids: [] };
  }
}

function writePayload(payload: StoredPayload): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(
      REVIEW_QUEUE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // 容量超過などは握りつぶす (学習体験を止めない)
  }
}

/** 現在の復習キュー (追加順) を取得 */
export function getReviewIds(): string[] {
  return readPayload().ids.slice();
}

/** 指定 ID が復習キューに入っているか */
export function isInReviewQueue(id: string): boolean {
  return readPayload().ids.includes(id);
}

/**
 * 復習キューに ID を追加する。
 * 既に存在する場合は何もしない (重複登録はされない)。
 * @returns 実際に新規追加された場合 true
 */
export function addToReviewQueue(id: string): boolean {
  if (!isValidId(id)) return false;
  const payload = readPayload();
  if (payload.ids.includes(id)) {
    return false;
  }
  payload.ids.push(id);
  writePayload(payload);
  invalidateSnapshot();
  notifyListeners();
  return true;
}

/**
 * 復習キューから ID を取り除く。
 * 存在しない場合は何もしない。
 * @returns 実際に取り除かれた場合 true
 */
export function removeFromReviewQueue(id: string): boolean {
  if (!isValidId(id)) return false;
  const payload = readPayload();
  const idx = payload.ids.indexOf(id);
  if (idx < 0) return false;
  payload.ids.splice(idx, 1);
  writePayload(payload);
  invalidateSnapshot();
  notifyListeners();
  return true;
}

/**
 * 復習キューを全削除する (Sprint 5 のデータリセット機能用)
 */
export function clearReviewQueue(): void {
  writePayload({ version: SCHEMA_VERSION, ids: [] });
  invalidateSnapshot();
  notifyListeners();
}

// ---------------------------------------------------------------------------
// useSyncExternalStore 用の購読 API
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

/** スナップショットは同一参照を返す必要があるためキャッシュする */
let cachedSnapshot: string[] | null = null;
/** SSR / Server snapshot 用の安定参照 */
const EMPTY_SNAPSHOT: string[] = [];

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

function notifyListeners(): void {
  for (const l of listeners) l();
}

/**
 * useSyncExternalStore の subscribe 関数。
 * 同タブ内変更と他タブからの storage イベントの両方を購読する。
 */
export function subscribeReviewQueue(listener: Listener): () => void {
  listeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === REVIEW_QUEUE_STORAGE_KEY) {
      invalidateSnapshot();
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

/**
 * useSyncExternalStore の getSnapshot 関数。
 * 同じキュー内容なら同一参照を返す (無限レンダー回避)。
 */
export function getReviewQueueSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  if (cachedSnapshot === null) {
    cachedSnapshot = readPayload().ids;
  }
  return cachedSnapshot;
}

/**
 * useSyncExternalStore の getServerSnapshot 関数。
 * SSR 中とクライアントの初回 hydration で同じ参照を返してミスマッチを防ぐ。
 */
export function getReviewQueueServerSnapshot(): string[] {
  return EMPTY_SNAPSHOT;
}
