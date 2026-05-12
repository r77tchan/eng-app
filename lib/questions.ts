import { withBasePath } from "./basePath";

export type Question = {
  id: string;
  word: string;
  answer: string;
  choices: string[];
};

export type QuestionPool = {
  version: number;
  questions: Question[];
};

/**
 * バンドルされた問題プール JSON をクライアントサイドで取得する。
 * GitHub Pages のサブパス配信に対応するため basePath を付与する。
 */
export async function loadQuestionPool(): Promise<QuestionPool> {
  const res = await fetch(withBasePath("/data/questions.json"), {
    // 静的ファイルなのでキャッシュ可
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(`問題プールの読み込みに失敗しました: ${res.status}`);
  }
  const data = (await res.json()) as QuestionPool;
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("問題プールの形式が不正です");
  }
  return data;
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
