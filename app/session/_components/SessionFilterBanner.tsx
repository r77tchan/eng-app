import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "@/lib/filterOptions";
import type { SessionFilter } from "@/lib/questions";

type Props = {
  filter: SessionFilter;
  fallbackUsed: boolean;
  matchingPoolSize: number;
};

/**
 * Sprint 4: セッション画面に表示する「現在の絞り込み条件」とフォールバック警告。
 *
 * - 「すべて / すべて」かつ fallback なしの場合は描画しない (UI を静かに保つ)
 * - フィルタが効いている場合、現在の条件を mono / uppercase でモノクロのバッジで表示
 * - フォールバック (条件外も補充) が発動した場合、warning カラーで案内する
 *
 * デザイン (Designer / Sprint 4):
 * - 駅看板トーン: SessionProgress (大型符号 + 進捗バー) の直後に置いて
 *   "Filter · Category / Level" の 1 行 (フィルタなしの場合は描画なし) で
 *   学習に集中させつつ、現在の文脈を 1 行で示す
 * - 警告は ShortageNotice と同じ「左に warning 縦バー」言語で
 *   ページをまたいだ一貫性を持たせる
 */
export function SessionFilterBanner({
  filter,
  fallbackUsed,
  matchingPoolSize,
}: Props) {
  const noFilter = filter.category === null && filter.difficulty === null;
  if (noFilter && !fallbackUsed) return null;

  const categoryLabel =
    CATEGORY_OPTIONS.find((o) => o.value === filter.category)?.label ??
    "すべて";
  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((o) => o.value === filter.difficulty)?.label ??
    "すべて";

  return (
    <section
      data-testid="session-filter-banner"
      data-fallback={fallbackUsed ? "true" : "false"}
      className="mt-1 mb-2 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-ink"
          />
          <span>Filter</span>
        </p>
        <p className="truncate font-mono text-[10px] tracking-[0.18em] text-ink uppercase tabular-nums">
          <span>{categoryLabel}</span>
          <span className="mx-1 text-ink-muted">/</span>
          <span>{difficultyLabel}</span>
        </p>
      </div>
      {fallbackUsed && (
        <div
          role="status"
          data-testid="session-shortage-warning"
          data-matching-count={matchingPoolSize}
          className="flex items-start gap-2.5 border-l-2 border-warning bg-warning/5 px-3 py-2"
        >
          <span
            aria-hidden="true"
            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
          />
          <p className="text-[12px] leading-snug text-ink">
            条件に合う問題が不足しているため、他の問題も出題されます。
          </p>
        </div>
      )}
    </section>
  );
}
