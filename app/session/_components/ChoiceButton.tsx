import { CheckIcon, XIcon } from "@/app/_components/icons";

type Props = {
  choice: string;
  index: number;
  isFeedback: boolean;
  isThisSelected: boolean;
  isAnswer: boolean;
  onSelect: (choice: string) => void;
};

export function ChoiceButton({
  choice,
  index,
  isFeedback,
  isThisSelected,
  isAnswer,
  onSelect,
}: Props) {
  let containerCls =
    "border-line bg-bg text-ink hover:border-ink";
  let badgeCls =
    "border-line bg-bg-secondary text-ink-muted";

  if (isFeedback) {
    if (isAnswer) {
      // success/error 面の上は常に bg-token を文字色に使う:
      //   light: 緑/赤の上に白文字 / dark: 明色の上に暗文字 → 両方で読める
      containerCls = "border-success bg-success text-bg";
      badgeCls = "border-bg/30 bg-bg/15 text-bg";
    } else if (isThisSelected) {
      containerCls = "border-error bg-error text-bg";
      badgeCls = "border-bg/30 bg-bg/15 text-bg";
    } else {
      containerCls =
        "border-line bg-bg text-ink-muted opacity-60";
      badgeCls = "border-line bg-bg-secondary text-ink-muted";
    }
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(choice)}
      disabled={isFeedback}
      data-testid="choice"
      data-correct={isAnswer ? "true" : "false"}
      aria-keyshortcuts={String(index + 1)}
      className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-left text-base font-semibold transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.985] disabled:active:scale-100 ${containerCls}`}
      style={{ minHeight: 56 }}
    >
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[12px] tabular-nums transition-colors duration-150 ${badgeCls}`}
      >
        {index + 1}
      </span>
      <span className="flex-1">{choice}</span>
      {isFeedback && isAnswer && (
        <CheckIcon width={16} height={16} className="shrink-0" />
      )}
      {isFeedback && isThisSelected && !isAnswer && (
        <XIcon width={16} height={16} className="shrink-0" />
      )}
    </button>
  );
}
