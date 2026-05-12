import Link from "next/link";

/**
 * 設定画面のヘッダ。
 *
 * - ホームと同じブランドドット + "Commute / EN" ワードマーク
 * - 右側に「ホームに戻る」リンク
 * - 下に大きな見出し ("Settings" / "アプリの挙動を調整")
 *
 * Start 画面の `StartSelectionForm` ヘッダと同じ言語に揃え、editorial /
 * 駅看板トーンを保つ。
 */
export function SettingsHeader() {
  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-accent"
          />
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            Commute / EN
          </span>
        </div>
        <Link
          href="/"
          data-testid="settings-back-home"
          aria-label="ホームに戻る"
          className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase transition-colors duration-150 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          <span>Home</span>
        </Link>
      </header>

      <section className="relative z-10 px-6 pt-2">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] tracking-[0.24em] text-ink-muted uppercase">
            Settings
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase tabular-nums">
            Local · v1.0
          </p>
        </div>
        <h1 className="mt-2 text-[28px] leading-[1.08] font-bold tracking-[-0.02em] text-ink">
          アプリの挙動を調整
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">
          全ての設定はこの端末のみに保存され、外部に送信されません。
        </p>
      </section>
    </>
  );
}
