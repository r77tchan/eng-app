/**
 * Sprint 8: キーバインドのキートップを表す共通 `<kbd>` 風コンポーネント。
 *
 * - editorial / 駅看板トーン: font-mono / uppercase / tracking 広めで Sprint 1〜7 の符号と整合
 * - 3 トーンを `tone` で切り替え:
 *   - "neutral": 既定。bg-secondary + ink-muted (KeyboardHints / DontKnowButton 内)
 *   - "on-primary": Primary 背景上の白文字系 (NextButton 内)
 *   - "danger": error 系背景・モーダル内など (未使用だが将来の拡張用)
 * - Tailwind canonical class のみで構成
 * - aria-hidden 既定 true (装飾表現)
 *
 * デザイントークン整合:
 * - 文字サイズ: 10px (既存 mono 符号と同サイズ)
 * - radius: rounded-md (--radius-md / 8px)
 * - border: border-line (--color-border)
 * - bg: bg-bg-secondary (--color-bg-secondary)
 * - text: text-ink-muted (--color-text-secondary)
 */

type Tone = "neutral" | "on-primary";

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const TONE_CLS: Record<Tone, string> = {
  neutral:
    "border-line bg-bg-secondary text-ink-muted",
  "on-primary":
    "border-on-primary-soft/40 bg-on-primary-faint text-on-primary",
};

export function KeyCap({ children, tone = "neutral", className }: Props) {
  const toneCls = TONE_CLS[tone];
  return (
    <kbd
      aria-hidden="true"
      className={`inline-flex min-w-[20px] items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium tracking-[0.08em] tabular-nums ${toneCls}${className ? ` ${className}` : ""}`}
    >
      {children}
    </kbd>
  );
}
