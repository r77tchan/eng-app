type Props = {
  streak: number;
};

/**
 * 履歴画面ヘッダー直下に置くストリーク表示。
 *
 * デザイン: Sprint 1 の editorial pull-stat 言語に揃え、
 * 「カードに数字を箱詰めする」UI を避ける。アクセントカラーは
 * ストリーク継続中 (>0) のドットにのみ使う (控えめなアクセント運用)。
 */
export function StreakBadge({ streak }: Props) {
  const isActive = streak > 0;
  return (
    <section
      data-testid="history-streak"
      aria-label="連続学習日数"
      className="mt-2 border-t border-ink/90 mx-6 pt-3"
    >
      <div className="flex items-baseline justify-between">
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isActive ? "bg-accent" : "bg-line"
            }`}
          />
          <span className="text-ink">A</span>
          <span className="mx-1.5">/</span>
          Streak
        </p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          連続学習日数
        </p>
      </div>
      <p className="mt-3 flex items-baseline gap-2 font-mono">
        <span className="text-[56px] leading-none font-bold tabular-nums text-ink">
          {streak}
        </span>
        <span className="text-base font-medium text-ink-muted">日</span>
        <span className="ml-auto self-end font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase tabular-nums">
          {isActive ? "Keep going" : "Start today"}
        </span>
      </p>
    </section>
  );
}
