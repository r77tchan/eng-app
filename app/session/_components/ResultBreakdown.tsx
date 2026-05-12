import type { AnswerLog } from "../types";

type Props = {
  logs: AnswerLog[];
  /** Sprint 6: 「わからない」と回答した問題数 */
  skippedCount: number;
};

/**
 * Sprint 6 Designer: 結果画面の "セッション内訳" 領域を切り出した子コンポーネント。
 *
 * - ResultView の肥大化を抑える (1 ファイル 150 行制約)
 * - 内訳ドット (success/warning/error) と凡例、Skipped セクション符号を 1 まとめに扱う
 *
 * デザイン:
 * - 既存 editorial 言語 (mono uppercase 符号 + tabular-nums) を踏襲
 * - skippedCount が 0 のときは Skipped ドットを line 色で「該当なし」を静かに示す
 */
export function ResultBreakdown({ logs, skippedCount }: Props) {
  return (
    <>
      <ol className="mt-8 flex items-center gap-2" aria-label="セッション内訳">
        {logs.map((l, i) => (
          <li
            key={`${l.questionId}-${i}`}
            className={`h-2.5 w-2.5 rounded-full ${
              l.correct
                ? "bg-success"
                : l.skipped
                  ? "bg-warning"
                  : "bg-error"
            }`}
            aria-label={`${i + 1}問目: ${
              l.correct ? "正解" : l.skipped ? "わからない" : "不正解"
            }`}
          />
        ))}
      </ol>

      {/* 凡例: success / warning / error の意味を 1 行で開示する */}
      <ul
        aria-hidden="true"
        className="mt-3 flex items-center justify-center gap-4 font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase"
      >
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          <span>Correct</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
          <span>Don&apos;t know</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-error" />
          <span>Wrong</span>
        </li>
      </ul>

      {/* 「わからない」回答数: 0 件でも表示する (Sprint 6 契約) */}
      <section
        data-testid="result-skipped"
        aria-label="わからないと回答した問題数"
        className="mt-8 flex w-full max-w-sm items-center justify-between gap-3"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              skippedCount > 0 ? "bg-warning" : "bg-line"
            }`}
          />
          <span className="text-ink">S</span>
          <span className="mx-1.5">/</span>
          Skipped
        </p>
        <p className="flex items-baseline gap-1 font-mono text-[13px] tabular-nums text-ink">
          <span className="font-semibold">{skippedCount}</span>
          <span className="text-[11px] font-medium text-ink-muted">問</span>
          <span className="ml-2 font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
            Don&apos;t know
          </span>
        </p>
      </section>
    </>
  );
}
