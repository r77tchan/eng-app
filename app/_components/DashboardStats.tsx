"use client";

import { useMemo } from "react";
import { getStreak, getTodayStats } from "@/lib/history";
import { useHistoryRecords } from "@/lib/useHistoryRecords";

/**
 * ホーム画面上部に表示するダッシュボード。
 *
 * - 今日の学習問題数
 * - 今日の正答率 (今日 0 問なら "-")
 * - 連続学習日数 (ストリーク)
 *
 * LocalStorage は useSyncExternalStore 経由で購読し、
 * SSR / 静的 prerender 中は空配列を返してハイドレーション一致させる。
 *
 * デザイン: Sprint 1 の editorial / 駅看板トーンに揃え、
 * 「カードに数字を箱詰めする」UI ではなく、セクション番号付きの
 * タイポグラフィ主体の見出しとして提示する。
 */
export function DashboardStats() {
  const records = useHistoryRecords();

  const { todayTotal, todayAccuracyLabel, streak } = useMemo(() => {
    const now = new Date();
    const today = getTodayStats(now, records);
    return {
      todayTotal: today.total,
      todayAccuracyLabel:
        today.accuracyPercent === null ? "-" : `${today.accuracyPercent}%`,
      streak: getStreak(now, records),
    };
  }, [records]);

  const hasStreak = streak > 0;

  return (
    <section
      data-testid="dashboard-stats"
      aria-label="今日の学習サマリー"
      className="relative z-10 px-6 pt-2 pb-1"
    >
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span className="text-ink">01</span>
          <span className="mx-1.5">/</span>
          Today
        </p>
        <p
          suppressHydrationWarning
          className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase tabular-nums"
        >
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
          }).format(new Date())}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end border-t border-ink/90 pt-3">
        <StatItem
          label="問題数"
          value={String(todayTotal)}
          testId="stat-today-count"
        />
        <Divider />
        <StatItem
          label="正答率"
          value={todayAccuracyLabel}
          testId="stat-today-accuracy"
        />
        <Divider />
        <StreakItem label="連続" value={streak} highlight={hasStreak} />
      </dl>
    </section>
  );
}

function StatItem({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
        {label}
      </dt>
      <dd
        data-testid={testId}
        className="mt-1 font-mono text-[22px] leading-none font-semibold tabular-nums text-ink"
      >
        {value}
      </dd>
    </div>
  );
}

function StreakItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
        {highlight && (
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
          />
        )}
        <span>{label}</span>
      </dt>
      <dd
        data-testid="stat-streak"
        className="mt-1 flex items-baseline gap-0.5 font-mono text-[22px] leading-none font-semibold tabular-nums text-ink"
      >
        <span>{value}</span>
        <span className="text-[12px] font-medium text-ink-muted">日</span>
      </dd>
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-2 h-7 w-px self-end bg-line"
    />
  );
}
