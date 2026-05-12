import { ArrowRightIcon } from "@/app/_components/icons";
import { KeyCap } from "./KeyCap";

type Props = {
  isLast: boolean;
  onClick: () => void;
};

export function NextButton({ isLast, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="next-button"
      aria-keyshortcuts="Enter"
      className="group mt-3 flex w-full items-center justify-between rounded-lg bg-primary px-6 py-4 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover animate-pop-in"
      style={{ minHeight: 56 }}
    >
      <span className="flex flex-col leading-tight">
        <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
          {isLast ? "Finish" : "Next"}
        </span>
        <span className="mt-0.5 text-base">
          {isLast ? "結果を見る" : "次へ"}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {/* Sprint 8: PC 幅でのみ Enter キーのヒントを表示。スマホ幅では非表示 */}
        <span
          data-testid="next-key-hint"
          className="hidden md:inline-flex"
        >
          <KeyCap tone="on-primary">Enter</KeyCap>
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-on-primary-faint transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <ArrowRightIcon width={14} height={14} />
        </span>
      </span>
    </button>
  );
}
