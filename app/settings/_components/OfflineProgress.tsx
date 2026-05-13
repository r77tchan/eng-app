"use client";

import { DownloadIcon } from "@/app/_components/icons";

/**
 * Sprint 9: ダウンロード中のプログレスバーと件数表示。
 *
 * `data-testid="offline-progress-bar"` を持ち、`role="progressbar"` と
 * `aria-valuemin / aria-valuemax / aria-valuenow` を満たす ARIA 仕様に従う。
 * 等幅フォント (`font-mono` + `tabular-nums`) を採用し、数値桁変動でレイアウトを揺らさない。
 *
 * Designer (Sprint 9) で仕上げた点:
 *   - バー本体は `transition: width 200ms ease-out` を維持しつつ、
 *     上に "shimmer" ハイライト (1.6s loop) を重ねて「今動いている感」を出す
 *   - バー外周には微細な accent ring の pulse を入れる (2.4s)
 *   - 進捗値は font-mono + tabular-nums で大きめに表示し、% はサイズ階層で 1 段上げる
 *   - 「ダウンロード中…」の disabled プライマリは、idle のプライマリと同じ高さ /
 *     形状を保ち、状態遷移でレイアウトジャンプしないようにする
 */
export function OfflineProgress({
  done,
  total,
  percent,
}: {
  done: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="ce-done-rise flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold tracking-tight text-ink">
          ダウンロード中…
        </p>
        <p className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-[12px] text-ink-muted">
            {done} <span className="opacity-60">/</span> {total || "?"}
          </span>
          <span
            aria-hidden="true"
            className="inline-block h-3 w-px bg-line"
          />
          <span className="text-[15px] font-semibold text-accent">
            {percent}
            <span className="ml-0.5 text-[10px] tracking-[0.12em] text-accent/70">
              %
            </span>
          </span>
        </p>
      </div>

      <div
        data-testid="offline-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="ce-progress-pulse relative h-2.5 w-full overflow-hidden rounded-full bg-bg-secondary ring-1 ring-line/60"
        style={{ minHeight: 10 }}
      >
        {/* 進捗本体 (width transition 維持) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        >
          {/* バー内側の縦縞ハイライト (上端を 1px だけ明るくしてエッジを締める) */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[1px] bg-white/40"
          />
          {/* shimmer (進捗バー本体の中だけを流れる光沢) */}
          <span aria-hidden="true" className="ce-progress-shimmer" />
        </div>
      </div>

      <button
        type="button"
        data-testid="offline-download-button"
        disabled
        aria-disabled="true"
        className="flex w-full items-center justify-between rounded-md border border-line bg-bg-secondary px-4 py-3 text-left opacity-70"
        style={{ minHeight: 56 }}
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-bg text-ink-muted"
          >
            <DownloadIcon className="animate-pulse" />
          </span>
          <span className="flex flex-col">
            <span className="text-[14px] font-semibold text-ink-muted">
              ダウンロード中…
            </span>
            <span className="mt-0.5 text-[11px] leading-snug text-ink-muted/80">
              通信状況により完了まで数十秒かかります
            </span>
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
          {percent.toString().padStart(2, "0")}%
        </span>
      </button>
    </div>
  );
}
