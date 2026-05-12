"use client";

import { useMemo } from "react";
import { getDailyStats, getStreak } from "@/lib/history";
import { useHistoryRecords } from "@/lib/useHistoryRecords";
import { HistoryList } from "./_components/HistoryList";
import { HistoryEmpty } from "./_components/HistoryEmpty";
import { StreakBadge } from "./_components/StreakBadge";

/**
 * 履歴画面。
 *
 * - 日別の学習問題数 / 正答率を新しい順に表示
 * - 学習履歴 0 件のとき空状態を表示
 * - LocalStorage は useSyncExternalStore 経由で購読する
 *   (SSR / 静的書き出し時は空配列、hydration 直後にクライアント値で再レンダー)
 *
 * デザイン: Sprint 1 のホーム / セッションと同じ editorial 系の
 * 見出し (mono uppercase + tabular-nums) で揃え、A / Streak、B / Log の
 * セクション符号で読み下しのリズムを作る。
 */
export default function HistoryPage() {
  const records = useHistoryRecords();

  const { items, streak } = useMemo(
    () => ({
      items: getDailyStats(records),
      streak: getStreak(new Date(), records),
    }),
    [records],
  );

  return (
    <main className="flex min-h-screen w-full flex-col pb-24">
      <header className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full bg-ink"
            />
            <span>History</span>
          </p>
          <p
            data-testid="history-days-count"
            className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase tabular-nums"
          >
            {`${String(items.length).padStart(2, "0")} days`}
          </p>
        </div>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.02em] text-ink">
          学習履歴
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          1日1問でもストリーク継続。新しい日付が上にきます。
        </p>
      </header>

      <StreakBadge streak={streak} />

      <section className="mt-6 flex flex-1 flex-col px-6">
        {items.length === 0 ? (
          <HistoryEmpty />
        ) : (
          <HistoryList items={items} />
        )}
      </section>
    </main>
  );
}
