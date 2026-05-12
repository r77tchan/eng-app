import { withBasePath } from "./basePath";

/**
 * 問題プールのカテゴリ。
 *
 * Sprint 4 で追加。プールには「すべて」というカテゴリは存在せず、
 * 「すべて」は UI / 出題プラン側でフィルタを掛けないことを意味する。
 */
export type Category = "daily" | "business" | "travel" | "exam";

/**
 * 問題プールの難易度。
 *
 * Sprint 4 で追加。同様に「すべて」はプールには存在しない。
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Question = {
  id: string;
  word: string;
  answer: string;
  choices: string[];
  /** Sprint 4 追加: カテゴリメタデータ */
  category: Category;
  /** Sprint 4 追加: 難易度メタデータ */
  difficulty: Difficulty;
};

export type QuestionPool = {
  version: number;
  questions: Question[];
};

const ALLOWED_CATEGORIES: ReadonlyArray<Category> = [
  "daily",
  "business",
  "travel",
  "exam",
];
const ALLOWED_DIFFICULTIES: ReadonlyArray<Difficulty> = [
  "beginner",
  "intermediate",
  "advanced",
];

function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (ALLOWED_CATEGORIES as readonly string[]).includes(v);
}

function isDifficulty(v: unknown): v is Difficulty {
  return (
    typeof v === "string" && (ALLOWED_DIFFICULTIES as readonly string[]).includes(v)
  );
}

/**
 * バンドルされた問題プール JSON をクライアントサイドで取得する。
 * GitHub Pages のサブパス配信に対応するため basePath を付与する。
 *
 * Sprint 4: カテゴリ / 難易度メタデータの検証を追加。不正値が混入していた場合は
 * その問題だけスキップして残りを返す (アプリ全体を止めない)。
 */
export async function loadQuestionPool(): Promise<QuestionPool> {
  const res = await fetch(withBasePath("/data/questions.json"), {
    // 静的ファイルなのでキャッシュ可
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(`問題プールの読み込みに失敗しました: ${res.status}`);
  }
  const data = (await res.json()) as Partial<QuestionPool>;
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("問題プールの形式が不正です");
  }

  const validated: Question[] = [];
  for (const q of data.questions) {
    if (
      q &&
      typeof q.id === "string" &&
      typeof q.word === "string" &&
      typeof q.answer === "string" &&
      Array.isArray(q.choices) &&
      q.choices.every((c) => typeof c === "string") &&
      isCategory((q as Question).category) &&
      isDifficulty((q as Question).difficulty)
    ) {
      validated.push({
        id: q.id,
        word: q.word,
        answer: q.answer,
        choices: q.choices,
        category: (q as Question).category,
        difficulty: (q as Question).difficulty,
      });
    }
  }

  if (validated.length === 0) {
    throw new Error("問題プールの形式が不正です");
  }

  return {
    version: typeof data.version === "number" ? data.version : 1,
    questions: validated,
  };
}

/**
 * Fisher–Yates シャッフル。元配列を破壊せず新しい配列を返す。
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * プールからランダムに重複なく count 問を選ぶ。
 * プールが count 未満の場合は全問返す。
 */
export function pickSessionQuestions(pool: Question[], count: number): Question[] {
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 選択フィルタの値。`null` は「すべて」(=フィルタなし) を意味する。
 *
 * Sprint 4 でカテゴリ・難易度をそれぞれ単一選択 (または「すべて」) として
 * 扱うため、UI 層・プランナー層で共通の表現として用いる。
 */
export type SessionFilter = {
  category: Category | null;
  difficulty: Difficulty | null;
};

/** プールから「カテゴリ・難易度が両方一致する」問題だけを取り出す */
export function filterPool(
  pool: readonly Question[],
  filter: SessionFilter,
): Question[] {
  return pool.filter((q) => {
    if (filter.category !== null && q.category !== filter.category) return false;
    if (filter.difficulty !== null && q.difficulty !== filter.difficulty) return false;
    return true;
  });
}
