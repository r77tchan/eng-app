import { CheckIcon, XIcon } from "@/app/_components/icons";

type Props = {
  isCorrect: boolean;
  answer: string;
};

export function FeedbackBanner({ isCorrect, answer }: Props) {
  return (
    <div
      className={`mt-6 w-full max-w-md overflow-hidden rounded-lg border animate-pop-in ${
        isCorrect
          ? "border-success/30 bg-success/8"
          : "border-error/30 bg-error/8"
      }`}
      data-testid="feedback"
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: isCorrect
          ? "rgba(34, 197, 94, 0.08)"
          : "rgba(239, 68, 68, 0.08)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isCorrect ? "bg-success" : "bg-error"
          }`}
        >
          {isCorrect ? (
            <CheckIcon stroke="white" />
          ) : (
            <XIcon stroke="white" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${
              isCorrect ? "text-success" : "text-error"
            }`}
            style={{
              color: isCorrect ? "#15803d" : "#b91c1c",
            }}
          >
            {isCorrect ? "正解" : "不正解"}
          </p>
          {!isCorrect && (
            <p className="mt-0.5 text-xs text-ink-muted">
              正解は{" "}
              <span className="font-semibold text-ink">{answer}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
