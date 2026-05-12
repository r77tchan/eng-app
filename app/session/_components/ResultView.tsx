import Link from "next/link";
import { RefreshIcon } from "@/app/_components/icons";
import type { AnswerLog } from "../types";

type Props = {
  logs: AnswerLog[];
  total: number;
  onRestart: () => void;
};

export function ResultView({ logs, total, onRestart }: Props) {
  const correctCount = logs.filter((l) => l.correct).length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <main className="flex min-h-screen w-full flex-col px-6">
      <header className="pt-6 pb-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            Result
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

        <ol className="mt-8 flex items-center gap-2" aria-label="セッション内訳">
          {logs.map((l, i) => (
            <li
              key={`${l.questionId}-${i}`}
              className={`h-2.5 w-2.5 rounded-full ${
                l.correct ? "bg-success" : "bg-error"
              }`}
              aria-label={`${i + 1}問目: ${l.correct ? "正解" : "不正解"}`}
            />
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 pb-10">
        <button
          type="button"
          onClick={onRestart}
          className="group flex w-full items-center justify-between rounded-lg bg-primary px-6 py-4 text-left font-semibold text-white shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase">
              Restart
            </span>
            <span className="mt-0.5 text-base">もう1セット</span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
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
