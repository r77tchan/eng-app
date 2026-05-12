"use client";

type Option<V extends string | null> = {
  value: V;
  label: string;
  /** data-testid 値 */
  testId: string;
};

type Props<V extends string | null> = {
  /** スクリーンリーダ向けラベル (画面に表示する見出しは別途呼び出し側で出す) */
  label: string;
  /** 画面に出す小見出し (任意。出すと駅看板トーンになる) */
  visibleLabel?: string;
  /** 見出しの右に出す英字短ラベル (任意) */
  shortLabel?: string;
  testId: string;
  options: ReadonlyArray<Option<V>>;
  value: V;
  onChange: (v: V) => void;
};

/**
 * 横並びのセグメンテッドコントロール。
 *
 * テーマ・効果音・既定カテゴリ/難易度の単一選択に使う。
 * - タップ可能領域は最小 44x44px を確保 (`minHeight: 44`)
 * - 選択中はインク背景 + 反転文字、それ以外は外枠 + 通常テキスト
 *
 * 5 件など割り切れない件数でも視覚バランスを保つため、件数に応じて
 * `grid-cols-2 / 3 / 4` を切り替える。Tailwind canonical class のみ使用。
 */
export function SegmentedControl<V extends string | null>({
  label,
  visibleLabel,
  shortLabel,
  testId,
  options,
  value,
  onChange,
}: Props<V>) {
  const cols = pickGridCols(options.length);
  return (
    <fieldset
      data-testid={testId}
      aria-label={label}
      className="flex w-full flex-col gap-2"
    >
      <legend className="sr-only">{label}</legend>
      {visibleLabel ? (
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold tracking-tight text-ink">
            {visibleLabel}
          </span>
          {shortLabel ? (
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              {shortLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={`grid w-full gap-2 ${cols}`}>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={String(opt.value ?? "null")}
              type="button"
              data-testid={opt.testId}
              data-selected={isSelected ? "true" : "false"}
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              className={`rounded-md border px-3 py-2.5 text-center font-mono text-[12px] tracking-[0.04em] transition-colors duration-150 ${
                isSelected
                  ? "border-ink bg-ink text-bg"
                  : "border-line bg-bg text-ink hover:border-ink/60"
              }`}
              style={{ minHeight: 44, minWidth: 60 }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function pickGridCols(n: number): string {
  // 1〜2 件はそのまま均等 / 3 件は 3 / 4 件は 4 / 5 件は 3 列 (1 行目 3 + 2 行目 2)
  // 6 件以上は 3 列折り返し
  if (n <= 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  if (n === 4) return "grid-cols-4";
  if (n === 5) return "grid-cols-3";
  return "grid-cols-3";
}
