/**
 * セッション出題プランナー
 *
 * Sprint 3 で追加された「復習キュー優先出題」のためのロジックを集約する。
 * Sprint 4 で「カテゴリ / 難易度フィルタ」と「件数不足時のフォールバック」を追加する。
 * UI / 永続化レイヤから純粋関数として切り出しておくことで、テストしやすい状態を保つ。
 *
 * ## 仕様 (Sprint 3 + Sprint 4 契約条件より)
 * - フィルタなし (= 「すべて」):
 *   - 復習キューが空 → 問題プールからランダム 5 問
 *   - 復習キューに 1 〜 4 問 → それらが全て含まれ、残りは問題プールから補充
 *   - 復習キューに 5 問以上 → 復習キューから 5 問
 * - フィルタあり (= カテゴリ or 難易度 or 両方):
 *   - 復習キューのうち「条件に合致するもの」を優先的に採用 (Sprint 4 契約)
 *   - 残りはプールのうち「条件に合致するもの」から補充
 *   - それでも 5 問に満たない場合、「条件外」の問題で補充して 5 問にする (Sprint 4 フォールバック)
 *     - その際は呼び出し側に `fallbackUsed = true` を返し、UI で警告を出せるようにする
 * - 1 セッション内で同じ問題が 2 回以上出題されない
 * - 問題プールに含まれない (削除された等) ID が復習キューに残っていても、
 *   エラーにせず単純に無視する
 */
import { shuffle, type Question, type SessionFilter } from "./questions";

export type SessionPlan = {
  /** 実際に出題される問題 (順序はそのまま出題順) */
  questions: Question[];
  /** このセッションで使う、復習キューに「セッション開始前から」入っていた問題 ID の集合 */
  reviewIdsAtStart: Set<string>;
  /**
   * Sprint 4: フィルタ条件に合致する問題が不足し、条件外の問題で補充されたか。
   * UI 側はこれが true の場合「条件に合う問題が不足しているため他の問題も出題されます」等の
   * 警告を表示する責務を負う。
   */
  fallbackUsed: boolean;
  /** Sprint 4: 条件に合致する問題の総数 (UI 表示用) */
  matchingPoolSize: number;
};

const NO_FILTER: SessionFilter = { category: null, difficulty: null };

/**
 * セッション出題候補を計画する純粋関数。
 *
 * @param pool      問題プール全体 (questions.json 由来)
 * @param reviewIds 復習キューに入っている問題 ID (追加順を想定)
 * @param sessionSize 1 セッションに出題する問題数 (既定 5)
 * @param filter    Sprint 4: カテゴリ・難易度フィルタ (省略時はフィルタなし = 「すべて」)
 */
export function planSession(
  pool: readonly Question[],
  reviewIds: readonly string[],
  sessionSize: number,
  filter: SessionFilter = NO_FILTER,
): SessionPlan {
  // プールを ID 引きできるマップ化
  const byId = new Map<string, Question>();
  for (const q of pool) {
    byId.set(q.id, q);
  }

  const matchesFilter = (q: Question): boolean => {
    if (filter.category !== null && q.category !== filter.category) return false;
    if (filter.difficulty !== null && q.difficulty !== filter.difficulty) return false;
    return true;
  };

  // 復習キュー内の ID のうち、現存する問題に変換する
  // (プールから削除された ID は無視する)
  const reviewQuestionsAll: Question[] = [];
  const seenReviewIds = new Set<string>();
  for (const id of reviewIds) {
    const q = byId.get(id);
    if (q && !seenReviewIds.has(id)) {
      reviewQuestionsAll.push(q);
      seenReviewIds.add(id);
    }
  }

  // セッション開始前から復習キューに入っていた ID (UI フィードバック計算用)
  // Sprint 3 と同様、「プールに現存し復習キューに居る」ID のみが対象。
  const reviewIdsAtStart = new Set<string>(seenReviewIds);

  // Sprint 4: 復習キューを「条件に合致するもの」「合致しないもの」に分割する。
  // 契約: 「復習キューに含まれる問題のうち、選択した条件に合致するものは優先的に出題される」
  const reviewMatching = reviewQuestionsAll.filter(matchesFilter);

  // 選択中の問題セット (重複防止用)
  const usedIds = new Set<string>();
  const picked: Question[] = [];

  /**
   * `qs` をシャッフルして「未使用かつ picked が sessionSize 未満」の間、
   * picked に追加する。`limit` は今回の呼び出しで追加してよい最大件数。
   */
  const take = (qs: readonly Question[], limit: number) => {
    if (limit <= 0) return;
    const start = picked.length;
    const shuffled = shuffle(qs);
    for (const q of shuffled) {
      if (picked.length >= sessionSize) break;
      if (picked.length - start >= limit) break;
      if (usedIds.has(q.id)) continue;
      picked.push(q);
      usedIds.add(q.id);
    }
  };

  // (1) 復習キュー × フィルタ合致 を優先採用
  take(reviewMatching, sessionSize - picked.length);

  // (2) プール × フィルタ合致 で補充
  if (picked.length < sessionSize) {
    const poolMatchingRest = pool.filter(
      (q) => matchesFilter(q) && !usedIds.has(q.id),
    );
    take(poolMatchingRest, sessionSize - picked.length);
  }

  // (3) Sprint 4 フォールバック: それでも足りない場合は条件外の問題で補充
  //
  // ここで「条件外」を許す優先順は:
  //   3-a. 復習キューに居る (= ユーザーが過去に間違えた問題) を先に
  //   3-b. プールの残り
  // とすることで、フィルタを跨いでも復習を優先する Sprint 3 のポリシーを維持する。
  let fallbackUsed = false;
  if (picked.length < sessionSize) {
    fallbackUsed = true;
    const reviewOutside = reviewQuestionsAll.filter((q) => !usedIds.has(q.id));
    take(reviewOutside, sessionSize - picked.length);
  }
  if (picked.length < sessionSize) {
    fallbackUsed = true;
    const poolRest = pool.filter((q) => !usedIds.has(q.id));
    take(poolRest, sessionSize - picked.length);
  }

  // 上で「ちょうど sessionSize に届かない」ケース (= プール全体が小さい) は
  // フォールバックフラグは立てるが、出題数自体は picked.length のまま返す。
  // (UI 側で必要数を満たせなければエラー表示する)

  return {
    questions: picked,
    reviewIdsAtStart,
    fallbackUsed,
    matchingPoolSize: pool.filter(matchesFilter).length,
  };
}

export type ReviewQueueDelta = {
  /** このセッションで「初めて誤答」してキューに追加された問題数 */
  addedCount: number;
  /** このセッションで「キューにあったが正答」してキューから卒業した問題数 */
  graduatedCount: number;
};

/**
 * セッション結果から、復習キューに対する差分 (追加 / 卒業) を計算する純粋関数。
 *
 * - `addedCount`: 「そのセッションで初めて誤答してキューに入った問題数」
 *   = (このセッションで誤答した) かつ (セッション開始前は復習キューに居なかった) 問題 ID 数
 * - `graduatedCount`: 「そのセッション前から復習キューにあった問題のうち、
 *    今回正答してキューから除外された問題数」
 *   = (セッション開始前から復習キューに居た) かつ (このセッションで正答した) 問題 ID 数
 *
 * 同一問題に対する複数の解答ログ (再回答) は基本発生しないが、
 * 仕様変更で発生する可能性に備え「誤答が 1 度でもあれば誤答扱い」「正答かつ誤答無しなら正答扱い」とする。
 */
export function calcReviewDelta(
  logs: readonly { questionId: string; correct: boolean }[],
  reviewIdsAtStart: ReadonlySet<string>,
): ReviewQueueDelta {
  // questionId ごとに、このセッション内で 1 度でも誤答したか集計
  const wrongInSession = new Set<string>();
  const correctInSession = new Set<string>();
  for (const l of logs) {
    if (l.correct) {
      correctInSession.add(l.questionId);
    } else {
      wrongInSession.add(l.questionId);
    }
  }

  let addedCount = 0;
  let graduatedCount = 0;

  // 「追加」: 誤答した & 開始前キューに居なかった
  for (const id of wrongInSession) {
    if (!reviewIdsAtStart.has(id)) {
      addedCount += 1;
    }
  }

  // 「卒業」: 開始前キューに居た & 正答した & このセッション内で誤答していない
  for (const id of reviewIdsAtStart) {
    if (correctInSession.has(id) && !wrongInSession.has(id)) {
      graduatedCount += 1;
    }
  }

  return { addedCount, graduatedCount };
}
