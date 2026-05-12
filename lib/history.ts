/**
 * 学習履歴の永続化レイヤ (LocalStorage)
 *
 * ## 設計
 * - LocalStorage に AnswerRecord[] を JSON 形式で保存する
 * - クラウド送信は一切行わない (ブラウザ内で完結)
 * - SSR (Next.js の静的書き出し時 prerender 含む) を考慮し、
 *   `window` / `localStorage` 未定義環境では安全にフォールバックする
 *
 * ## ストレージスキーマ (バージョン 1)
 * key:   "commute-en:history:v1"
 * value: JSON.stringify({ version: 1, records: AnswerRecord[] })
 *
 * 将来のスキーマ変更時は version 番号を上げ、マイグレーションで対応する。
 */
export type AnswerRecord = {
  /** 問題の ID (questions.json の id) */
  questionId: string;
  /** ユーザーが選んだ選択肢 */
  selected: string;
  /** 正誤 */
  correct: boolean;
  /** 解答日時 (ISO 8601 文字列) */
  answeredAt: string;
};

type StoredPayload = {
  version: number;
  records: AnswerRecord[];
};

export const HISTORY_STORAGE_KEY = "commute-en:history:v1";
const SCHEMA_VERSION = 1;

/** SSR 環境でも安全に LocalStorage 参照できるか */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    // Safari プライベートモード等で例外が出るケースに備える
    return false;
  }
}

/** 内部: 生 JSON を取り出して妥当性検証する */
function readPayload(): StoredPayload {
  if (!isStorageAvailable()) {
    return { version: SCHEMA_VERSION, records: [] };
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, records: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "records" in parsed &&
      Array.isArray((parsed as StoredPayload).records)
    ) {
      const records = (parsed as StoredPayload).records.filter(isValidRecord);
      return { version: SCHEMA_VERSION, records };
    }
    return { version: SCHEMA_VERSION, records: [] };
  } catch {
    // 壊れた JSON 等は無視して空とみなす (ユーザー操作で復旧不能にならないように)
    return { version: SCHEMA_VERSION, records: [] };
  }
}

function isValidRecord(r: unknown): r is AnswerRecord {
  if (typeof r !== "object" || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.questionId === "string" &&
    typeof x.selected === "string" &&
    typeof x.correct === "boolean" &&
    typeof x.answeredAt === "string"
  );
}

function writePayload(payload: StoredPayload): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 容量超過などは握りつぶす (学習体験を止めない)
  }
}

/**
 * 解答ログを 1 件追記する。
 * @param record questionId / selected / correct のみ指定。answeredAt は自動付与。
 */
export function appendAnswerLog(
  record: Omit<AnswerRecord, "answeredAt"> & { answeredAt?: string },
): void {
  const answeredAt = record.answeredAt ?? new Date().toISOString();
  const payload = readPayload();
  payload.records.push({
    questionId: record.questionId,
    selected: record.selected,
    correct: record.correct,
    answeredAt,
  });
  writePayload(payload);
  invalidateSnapshot();
  notifyListeners();
}

/** 全レコードを取得する (古い順) */
export function getAllRecords(): AnswerRecord[] {
  return readPayload().records.slice();
}

/**
 * 履歴を全削除する (Sprint 5 のリセット機能用にエクスポート)
 */
export function clearHistory(): void {
  writePayload({ version: SCHEMA_VERSION, records: [] });
  invalidateSnapshot();
  notifyListeners();
}

// ---------------------------------------------------------------------------
// useSyncExternalStore 用の購読 API
// ---------------------------------------------------------------------------
//
// React 19 / Next 16 では「外部ストアから読み込んで state に反映」する処理は
// useEffect + setState ではなく useSyncExternalStore で書くのが推奨される。
// このセクションはそのためのプリミティブを提供する。

type Listener = () => void;
const listeners = new Set<Listener>();

/** スナップショットは同一参照を返す必要があるためキャッシュする */
let cachedSnapshot: AnswerRecord[] | null = null;
/** SSR / Server snapshot 用の安定参照 */
const EMPTY_SNAPSHOT: AnswerRecord[] = [];

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

function notifyListeners(): void {
  for (const l of listeners) l();
}

/**
 * useSyncExternalStore の subscribe 関数。
 * 同タブ内の変更 (appendAnswerLog / clearHistory) と、
 * 他タブからの storage イベントの両方を購読する。
 */
export function subscribeHistory(listener: Listener): () => void {
  listeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === HISTORY_STORAGE_KEY) {
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
 * 同じレコード集合に対しては同一参照を返す (無限レンダー回避)。
 */
export function getHistorySnapshot(): AnswerRecord[] {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  if (cachedSnapshot === null) {
    cachedSnapshot = readPayload().records;
  }
  return cachedSnapshot;
}

/**
 * useSyncExternalStore の getServerSnapshot 関数。
 * SSR 中とクライアントの初回 hydration で同じ参照を返してミスマッチを防ぐ。
 */
export function getHistoryServerSnapshot(): AnswerRecord[] {
  return EMPTY_SNAPSHOT;
}

// ---------------------------------------------------------------------------
// 日付ユーティリティ
// ---------------------------------------------------------------------------

/**
 * 端末ローカルタイムゾーンでの YYYY-MM-DD を返す。
 * (UTC 基準だと日本では深夜帯の学習が前日扱いになり違和感が出るため)
 */
export function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 今日の YYYY-MM-DD (ローカル) */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// 集計
// ---------------------------------------------------------------------------

export type DailyStats = {
  /** YYYY-MM-DD */
  dateKey: string;
  total: number;
  correct: number;
  /** 0-100 の整数。total が 0 の時は 0 */
  accuracyPercent: number;
};

/**
 * 日別の集計を返す (新しい日付が先頭)。
 */
export function getDailyStats(records?: AnswerRecord[]): DailyStats[] {
  const all = records ?? getAllRecords();
  const map = new Map<string, { total: number; correct: number }>();
  for (const r of all) {
    const key = toLocalDateKey(r.answeredAt);
    if (!key) continue;
    const cur = map.get(key) ?? { total: 0, correct: 0 };
    cur.total += 1;
    if (r.correct) cur.correct += 1;
    map.set(key, cur);
  }
  const list: DailyStats[] = [];
  for (const [dateKey, v] of map) {
    list.push({
      dateKey,
      total: v.total,
      correct: v.correct,
      accuracyPercent:
        v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    });
  }
  // 新しい日付が先頭 (降順)
  list.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
  return list;
}

export type TodayStats = {
  total: number;
  correct: number;
  /** 0-100 の整数。今日 0 問の場合は null (UI 側で "-" や "0%" を出し分け可能) */
  accuracyPercent: number | null;
};

/** 今日の合計問題数 / 正答数 / 正答率を取得 */
export function getTodayStats(
  now: Date = new Date(),
  records?: AnswerRecord[],
): TodayStats {
  const all = records ?? getAllRecords();
  const key = todayKey(now);
  let total = 0;
  let correct = 0;
  for (const r of all) {
    if (toLocalDateKey(r.answeredAt) === key) {
      total += 1;
      if (r.correct) correct += 1;
    }
  }
  const accuracyPercent =
    total > 0 ? Math.round((correct / total) * 100) : null;
  return { total, correct, accuracyPercent };
}

/**
 * 連続学習日数 (ストリーク) を計算する。
 *
 * - 「1 日に 1 問以上 (正誤問わず) 解答した日」が連続している日数
 * - 「今日」または「昨日」を起点に過去へ遡り、解答のない日が現れたら止める
 *   - 「昨日」を起点に許容するのは、まだ今日学習していなくても昨日までの連続を維持するため
 *   - 「一昨日まで」さかのぼった所が最新だった場合は 0 (ストリーク途切れ)
 */
export function getStreak(
  now: Date = new Date(),
  records?: AnswerRecord[],
): number {
  const all = records ?? getAllRecords();
  if (all.length === 0) return 0;

  const studiedDays = new Set<string>();
  for (const r of all) {
    const key = toLocalDateKey(r.answeredAt);
    if (key) studiedDays.add(key);
  }

  const todayKeyStr = todayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKeyStr = todayKey(yesterday);

  // 起点を決める
  let cursor: Date;
  if (studiedDays.has(todayKeyStr)) {
    cursor = new Date(now);
  } else if (studiedDays.has(yesterdayKeyStr)) {
    cursor = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  // 安全のため最大 10 年分でループを止める
  for (let i = 0; i < 366 * 10; i++) {
    const key = todayKey(cursor);
    if (studiedDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
