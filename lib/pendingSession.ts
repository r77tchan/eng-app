/**
 * 「次の 1 セッションだけ」適用するフィルタを sessionStorage に渡す
 * 一時バケット。
 *
 * ## なぜ sessionStorage か
 * - 静的書き出し (`output: 'export'`) では URL のクエリパラメータも使えるが、
 *   useSearchParams は Suspense 境界が必須で、リロード耐性 / 戻る操作の挙動を
 *   制御するコストが高い。
 * - Sprint 5 で「既定カテゴリ / 既定難易度」設定が LocalStorage に追加される予定だが、
 *   それとは別レイヤ (= 「今回 1 回だけの選択」) として分離しておく方が、
 *   Sprint 5 の永続設定と衝突しない。
 *
 * ## 動作
 * - `setPendingSessionFilter` で保存
 * - `consumePendingSessionFilter` は読み出すと同時にクリアする ("単発消費")
 * - SSR / window 不在環境では何もせず null フォールバック
 */
import type { Category, Difficulty, SessionFilter } from "./questions";

const STORAGE_KEY = "commute-en:pending-session:v1";

type Stored = {
  category: Category | null;
  difficulty: Difficulty | null;
};

const ALLOWED_CATEGORIES = new Set<Category>([
  "daily",
  "business",
  "travel",
  "exam",
]);
const ALLOWED_DIFFICULTIES = new Set<Difficulty>([
  "beginner",
  "intermediate",
  "advanced",
]);

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function setPendingSessionFilter(filter: SessionFilter): void {
  if (!isStorageAvailable()) return;
  const payload: Stored = {
    category: filter.category,
    difficulty: filter.difficulty,
  };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 容量超過などは握りつぶす
  }
}

/**
 * 一時バケットの内容を読み出し、同時に削除する。
 * 何も入っていなければ「フィルタなし」(= すべて) を返す。
 */
export function consumePendingSessionFilter(): SessionFilter {
  if (!isStorageAvailable()) {
    return { category: null, difficulty: null };
  }
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return { category: null, difficulty: null };
  }
  if (!raw) return { category: null, difficulty: null };
  try {
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const category =
      parsed && parsed.category && ALLOWED_CATEGORIES.has(parsed.category)
        ? parsed.category
        : null;
    const difficulty =
      parsed && parsed.difficulty && ALLOWED_DIFFICULTIES.has(parsed.difficulty)
        ? parsed.difficulty
        : null;
    return { category, difficulty };
  } catch {
    return { category: null, difficulty: null };
  }
}
