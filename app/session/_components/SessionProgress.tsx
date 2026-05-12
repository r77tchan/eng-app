import type { AnswerLog } from "../types";

type Props = {
  currentIndex: number;
  total: number;
  isFeedback: boolean;
  logs: AnswerLog[];
};

export function SessionProgress({ currentIndex, total, isFeedback, logs }: Props) {
  return (
    <header className="pt-6 pb-4">
      <div className="flex items-center justify-between">
        <p
          className="font-mono text-[11px] font-semibold tracking-[0.18em] tabular-nums text-ink uppercase"
          data-testid="progress"
          aria-label={`${currentIndex + 1} / ${total}`}
        >
          <span>{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="mx-1 text-ink-muted">/</span>
          <span className="text-ink-muted">
            {String(total).padStart(2, "0")}
          </span>
        </p>
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
          Session
        </p>
      </div>
      <ol className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < currentIndex || (i === currentIndex && isFeedback);
          const active = i === currentIndex && !isFeedback;
          const log = logs[i];
          let cls = "bg-line";
          if (done && log) {
            // Sprint 6: 「わからない」回答は warning 色で誤答 (error) と区別する
            if (log.correct) cls = "bg-success";
            else if (log.skipped) cls = "bg-warning";
            else cls = "bg-error";
          } else if (active) {
            cls = "bg-ink";
          }
          return (
            <li
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${cls}`}
            />
          );
        })}
      </ol>
    </header>
  );
}
