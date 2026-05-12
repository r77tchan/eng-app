"use client";

import { useReviewQueue } from "@/lib/useReviewQueue";

/**
 * ホーム画面ダッシュボードに「復習が必要な問題数」を表示するセクション。
 *
 * Sprint 3 契約:
 * - ホーム画面のダッシュボードに復習が必要な問題数が表示される
 * - 復習キューが 0 件の場合も「復習: 0 問」のように 0 件であることが明示される
 * - フォントは `--text-base` 相当以上で、揺れる車内でも読めるレベル
 *
 * 設計 (Designer):
 * - LocalStorage は useSyncExternalStore 経由で購読 (lib/useReviewQueue.ts)
 * - SSR / 静的書き出し時は空配列 → "0" 表示にハイドレーション一致
 * - 既存 DashboardStats (01 / Today) と同じ
 *   「セクション符号 + ボーダー + tabular-nums の数値」言語に揃え、
 *   ホームの通し番号 02 を担当する。
 * - 0 件と 1+ 件で表現を出し分ける:
 *   - 0 件: ドット非表示 / "Clear" / "今は復習対象なし"
 *   - 1+ 件: warning ドット / "Pending" / "次セッションで優先出題"
 */
export function ReviewQueueStat() {
  const queue = useReviewQueue();
  const count = queue.length;
  const hasQueue = count > 0;

  return (
    <section
      data-testid="review-queue-stat"
      aria-label="復習キュー"
      className="relative z-10 px-6 pt-5 pb-1"
    >
      <div className="flex items-baseline justify-between">
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              hasQueue ? "bg-warning" : "bg-line"
            }`}
          />
          <span className="text-ink">02</span>
          <span className="mx-1.5">/</span>
          Review
        </p>
        <p
          className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase tabular-nums"
          aria-hidden="true"
        >
          {hasQueue ? "Pending" : "Clear"}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-end gap-x-4 border-t border-ink/90 pt-3">
        <div className="flex flex-col">
          <p className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
            復習が必要
          </p>
          <p
            data-testid="stat-review-count"
            className="mt-1 flex items-baseline gap-1 font-mono text-[22px] leading-none font-semibold tabular-nums text-ink"
          >
            <span>{count}</span>
            <span className="text-[12px] font-medium text-ink-muted">問</span>
          </p>
        </div>

        <p
          data-testid="stat-review-label"
          className={`justify-self-end pb-0.5 text-right font-mono text-[11px] tracking-[0.14em] uppercase ${
            hasQueue ? "text-ink" : "text-ink-muted"
          }`}
        >
          {hasQueue ? (
            <>
              <span className="text-ink-muted">Next session ·</span>{" "}
              優先出題
            </>
          ) : (
            <>
              <span className="text-ink-muted">No queue ·</span>{" "}
              対象なし
            </>
          )}
        </p>
      </div>
    </section>
  );
}
