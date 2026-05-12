import Link from "next/link";
import { ArrowRightIcon } from "@/app/_components/icons";

export function HistoryEmpty() {
  return (
    <div
      data-testid="history-empty"
      className="flex flex-1 flex-col items-stretch px-1"
    >
      {/* 上部の編集的なセクションヘッダー */}
      <div className="flex items-baseline justify-between border-t border-ink/90 pt-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span className="text-ink">B</span>
          <span className="mx-1.5">/</span>
          Empty
        </p>
        <p
          aria-hidden="true"
          className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase tabular-nums"
        >
          00 logs
        </p>
      </div>

      <div className="flex flex-1 flex-col items-start justify-center py-10">
        <p
          aria-hidden="true"
          className="font-mono text-[40px] leading-none font-bold tabular-nums text-line"
        >
          0000
        </p>
        <p className="mt-6 text-[20px] leading-tight font-bold text-ink">
          まだ学習履歴が
          <br />
          ありません。
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
          セッションを1回完了すると、ここに日別の学習量と正答率が記録されます。
          所要時間はおよそ90秒。
        </p>

        <Link
          href="/session"
          className="group mt-8 flex items-center gap-3 self-stretch rounded-lg bg-primary px-6 py-4 text-left font-semibold text-white shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase">
              Start session
            </span>
            <span className="mt-0.5 text-base">最初のセッションを始める</span>
          </span>
          <span
            aria-hidden="true"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <ArrowRightIcon />
          </span>
        </Link>
      </div>
    </div>
  );
}
