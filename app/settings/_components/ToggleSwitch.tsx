"use client";

type Props = {
  label: string;
  description?: string;
  testId: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

/**
 * シンプルな ON/OFF スイッチ。
 *
 * - role="switch" / aria-checked で a11y 対応
 * - タップ領域 56x44 を確保 (片手操作要件)
 * - 状態を `data-checked` 属性に反映し、Playwright から判定可能
 */
export function ToggleSwitch({
  label,
  description,
  testId,
  checked,
  onChange,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      data-checked={checked ? "true" : "false"}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-bg px-4 py-3 text-left transition-colors duration-150 hover:border-ink/40"
      style={{ minHeight: 56 }}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-[14px] font-semibold text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 text-[12px] leading-snug text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-bg shadow-sm transition-transform duration-150 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
