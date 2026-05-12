import { CheckIcon, XIcon } from "@/app/_components/icons";

type Props = {
  isCorrect: boolean;
  answer: string;
};

/**
 * 解答フィードバックバナー。
 *
 * デザイン:
 * - 駅看板トーン: 左端の縦バー (border-l-2) で正誤を表現し、
 *   面全体を着色しない。dark でも明色の success/error が読める
 * - 強調文字色は `--color-success-strong` / `--color-error-strong` トークンを
 *   経由し、ライトでは濃緑/濃赤、ダークでは明色そのままになる
 * - アイコン丸の文字色は常に白基調 (--color-on-accent / on-error は white)
 */
export function FeedbackBanner({ isCorrect, answer }: Props) {
  return (
    <div
      className={
        "mt-6 flex w-full max-w-md items-center gap-3 overflow-hidden rounded-lg border-l-2 px-4 py-3 animate-pop-in " +
        (isCorrect
          ? "border-success bg-success/10"
          : "border-error bg-error/10")
      }
      data-testid="feedback"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-bg " +
          (isCorrect ? "bg-success" : "bg-error")
        }
      >
        {isCorrect ? <CheckIcon /> : <XIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={
            "font-mono text-[10px] tracking-[0.22em] uppercase " +
            (isCorrect ? "text-success-strong" : "text-error-strong")
          }
        >
          {isCorrect ? "Correct" : "Wrong"}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          {isCorrect ? "正解" : "不正解"}
          {!isCorrect && (
            <span className="ml-2 text-xs font-medium text-ink-muted">
              正解は <span className="font-semibold text-ink">{answer}</span>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
