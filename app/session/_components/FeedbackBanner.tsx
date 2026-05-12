import { CheckIcon, XIcon } from "@/app/_components/icons";

type Props = {
  isCorrect: boolean;
  answer: string;
  /** Sprint 6: 「わからない」回答による誤答かどうか */
  isSkipped?: boolean;
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
 *
 * Sprint 6:
 * - 「わからない」回答時はラベルを "Don't know / わからないと回答しました" に切り替える
 * - 色は warning ベースに切り替える (正答=success / 誤答=error / 中立=warning)
 *   これで「不正解とは違う、判断保留の中立」感を視覚的に表現する
 * - 正解の選択肢は ChoiceButton 側で常にハイライトされるので、ここでは
 *   ユーザーの選択が「わからない」であった旨を明示する
 */
export function FeedbackBanner({ isCorrect, answer, isSkipped }: Props) {
  // Sprint 6: skipped は warning トーン。それ以外は従来通り correct/error。
  const tone = isCorrect ? "correct" : isSkipped ? "skipped" : "wrong";

  const borderCls =
    tone === "correct"
      ? "border-success bg-success/10"
      : tone === "skipped"
        ? "border-warning bg-warning/10"
        : "border-error bg-error/10";

  const iconBgCls =
    tone === "correct"
      ? "bg-success"
      : tone === "skipped"
        ? "bg-warning"
        : "bg-error";

  const labelCls =
    tone === "correct"
      ? "text-success-strong"
      : tone === "skipped"
        ? "text-ink"
        : "text-error-strong";

  const labelEn =
    tone === "correct" ? "Correct" : tone === "skipped" ? "Don't know" : "Wrong";
  const labelJa =
    tone === "correct"
      ? "正解"
      : tone === "skipped"
        ? "わからないと回答しました"
        : "不正解";

  return (
    <div
      className={
        "mt-6 flex w-full max-w-md items-center gap-3 overflow-hidden rounded-lg border-l-2 px-4 py-3 animate-pop-in " +
        borderCls
      }
      data-testid="feedback"
      data-skipped={isSkipped ? "true" : "false"}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-bg " +
          iconBgCls
        }
      >
        {tone === "correct" ? (
          <CheckIcon />
        ) : tone === "skipped" ? (
          // 「わからない = 中立」を表す "—" 字。XIcon (誤答) と区別する。
          <span
            aria-hidden="true"
            className="block h-[2px] w-3 rounded-full bg-bg"
          />
        ) : (
          <XIcon />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={
            "font-mono text-[10px] tracking-[0.22em] uppercase " + labelCls
          }
        >
          {labelEn}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          {labelJa}
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
