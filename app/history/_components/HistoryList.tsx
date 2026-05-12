import type { DailyStats } from "@/lib/history";

type Props = {
  items: DailyStats[];
};

/**
 * 日付フォーマッタ。
 * 例: "2026-05-12" -> { md: "05/12", weekday: "火", year: "2026" }
 * SSR と CSR で同じ結果になるよう、Intl ではなく純粋関数で組み立てる。
 */
function formatDateParts(dateKey: string): {
  md: string;
  weekday: string;
  year: string;
} {
  const [y, m, d] = dateKey.split("-");
  if (!y || !m || !d) return { md: dateKey, weekday: "", year: "" };
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[date.getDay()] ?? "";
  return { md: `${m}/${d}`, weekday: w, year: y };
}

export function HistoryList({ items }: Props) {
  return (
    <div data-testid="history-list-wrap" className="flex flex-col">
      {/* 列ヘッダー (1 度だけ表示する) */}
      <div
        aria-hidden="true"
        className="flex items-baseline justify-between border-t border-ink/90 pt-2 pb-1 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase"
      >
        <span>
          <span className="text-ink">B</span>
          <span className="mx-1.5">/</span>
          Log
        </span>
        <span className="flex items-center gap-6">
          <span>Q</span>
          <span>Acc</span>
        </span>
      </div>

      <ol data-testid="history-list" className="flex flex-col">
        {items.map((item) => {
          const { md, weekday, year } = formatDateParts(item.dateKey);
          return (
            <li
              key={item.dateKey}
              data-testid="history-row"
              data-date={item.dateKey}
              className="flex items-center justify-between border-b border-line py-4"
              style={{ minHeight: 56 }}
            >
              <div className="flex flex-col">
                <span
                  data-testid="history-date"
                  className="font-mono text-[20px] leading-none font-semibold tabular-nums text-ink"
                >
                  {md}
                  <span className="ml-2 text-[11px] font-medium text-ink-muted">
                    {weekday}
                  </span>
                </span>
                <span className="mt-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase tabular-nums">
                  {year}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span
                  data-testid="history-count"
                  className="w-8 text-right font-mono text-base font-semibold tabular-nums text-ink"
                >
                  {item.total}
                </span>
                <AccuracyCell percent={item.accuracyPercent} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AccuracyCell({ percent }: { percent: number }) {
  // 0-100 を 0-1 に正規化。バーの長さで視覚的に正答率を示す。
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  return (
    <span className="flex w-20 items-center gap-2">
      <span
        aria-hidden="true"
        className="relative h-1 flex-1 overflow-hidden rounded-full bg-line"
      >
        <span
          className="absolute inset-y-0 left-0 bg-ink"
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span
        data-testid="history-accuracy"
        className="w-10 text-right font-mono text-base font-semibold tabular-nums text-ink"
      >
        {percent}%
      </span>
    </span>
  );
}
