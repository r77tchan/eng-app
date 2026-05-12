import Link from "next/link";
import { RefreshIcon } from "@/app/_components/icons";
import type { AnswerLog } from "../types";
import { ResultBreakdown } from "./ResultBreakdown";

type Props = {
  logs: AnswerLog[];
  total: number;
  /** このセッションで新たに復習キューに追加された問題数 (Sprint 3) */
  reviewAdded: number;
  /** このセッションで復習キューから卒業した問題数 (Sprint 3) */
  reviewGraduated: number;
  /** Sprint 6: このセッションで「わからない」と回答した問題数 */
  skippedCount: number;
  onRestart: () => void;
};

export function ResultView({
  logs,
  total,
  reviewAdded,
  reviewGraduated,
  skippedCount,
  onRestart,
}: Props) {
  const correctCount = logs.filter((l) => l.correct).length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <main className="flex min-h-screen w-full flex-col px-6">
      <header className="pt-6 pb-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full bg-ink"
            />
            <span>Result</span>
          </p>
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase tabular-nums">
            Session · {total} Q
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          You scored
        </p>
        <p
          className="mt-4 font-mono text-[88px] leading-none font-bold tabular-nums text-ink"
          aria-hidden="true"
        >
          {String(correctCount).padStart(2, "0")}
          <span className="text-ink-muted">
            /{String(total).padStart(2, "0")}
          </span>
        </p>
        <p
          className="mt-4 text-center text-sm font-semibold text-ink"
          data-testid="result-score"
        >
          {total}問中{correctCount}問正解
        </p>
        <p
          aria-hidden="true"
          className="mt-6 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase tabular-nums"
        >
          Accuracy · {percent}%
        </p>

        {/* Sprint 6: セッション内訳ドット + 凡例 + Skipped 件数を ResultBreakdown に分離 */}
        <ResultBreakdown logs={logs} skippedCount={skippedCount} />

        {/* 復習キューに対する差分 (Sprint 3 契約条件)
         *
         * デザイン (Designer):
         * - ホームの 02 / Review と同じ editorial 言語
         *   (mono uppercase セクション符号 + ink ボーダー + tabular-nums) を維持し、
         *   セッションの大型スコア表示との階層をはっきりさせる
         * - 「追加」「卒業」は意味が逆方向なので、warning / success の
         *   サイドストライプで方向感を出す
         *   (Sprint 1・2 確立のトーン: warning は警告、success は正答系)
         */}
        <section
          aria-label="復習キューの変化"
          className="mt-10 w-full max-w-sm"
          data-testid="result-review-summary"
        >
          <div className="flex items-baseline justify-between">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-ink"
              />
              <span className="text-ink">R</span>
              <span className="mx-1.5">/</span>
              Review queue
            </p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase tabular-nums">
              Delta
            </p>
          </div>

          <dl className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch border-t border-ink/90 pt-3">
            <ReviewDeltaItem
              label="復習に追加"
              hint="今回新規にキューへ"
              value={reviewAdded}
              accentClass="bg-warning"
              testId="result-review-added"
            />
            <span
              aria-hidden="true"
              className="mx-2 w-px self-stretch bg-line"
            />
            <ReviewDeltaItem
              label="復習から卒業"
              hint="正答してキュー外へ"
              value={reviewGraduated}
              accentClass="bg-success"
              testId="result-review-graduated"
            />
          </dl>
        </section>
      </div>

      <div className="flex flex-col gap-3 pb-10">
        <button
          type="button"
          onClick={onRestart}
          className="group flex w-full items-center justify-between rounded-lg bg-primary px-6 py-4 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
              Restart
            </span>
            <span className="mt-0.5 text-base">もう1セット</span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-on-primary-faint"
          >
            <RefreshIcon />
          </span>
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-lg border border-ink px-6 py-4 text-center text-base font-semibold text-ink active:scale-[0.985]"
          style={{ minHeight: 48 }}
        >
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}

function ReviewDeltaItem({
  label,
  hint,
  value,
  accentClass,
  testId,
}: {
  label: string;
  hint: string;
  value: number;
  accentClass: string;
  testId: string;
}) {
  const hasValue = value > 0;
  return (
    <div className="flex flex-col">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            hasValue ? accentClass : "bg-line"
          }`}
        />
        <span>{label}</span>
      </dt>
      <dd
        data-testid={testId}
        className="mt-1.5 flex items-baseline gap-1 font-mono text-[28px] leading-none font-semibold tabular-nums text-ink"
      >
        <span>{value}</span>
        <span className="text-[13px] font-medium text-ink-muted">問</span>
      </dd>
      <p className="mt-1.5 text-[11px] leading-tight text-ink-muted">{hint}</p>
    </div>
  );
}
