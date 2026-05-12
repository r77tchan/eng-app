"use client";

import type { ReactNode } from "react";

export type OptionItem<V extends string | null> = {
  key: string;
  value: V;
  label: string;
  short: string;
  hint: string;
  testId: string;
};

type Props<V extends string | null> = {
  legend: string;
  legendShort: string;
  testId: string;
  options: OptionItem<V>[];
  selected: V;
  onSelect: (value: V) => void;
};

/**
 * 単一選択 (radio) 動作のオプションリスト。
 *
 * - role="radiogroup" + ボタンに aria-checked を付与してスクリーンリーダ対応
 * - タップ領域 56px (≥ 44px) で片手操作 OK
 * - canonical Tailwind class のみで構築
 *
 * デザイン (Designer / Sprint 4):
 * - 駅看板トーン: セクション符号 + ink ボーダー で 1 枠を構成
 * - 行は左に "番号 + accent ドット" の駅看板的なマーカーを置き、
 *   active 状態は bg-ink + 白文字反転 で視覚的にスイッチ感を出す
 * - inactive 行はホワイトベースに 1px border (line) を引き、
 *   ホバーで ink/40 にトーンアップ
 * - hint テキストは inactive のときは ink-muted、active のときは white/70
 */
export function OptionList<V extends string | null>({
  legend,
  legendShort,
  testId,
  options,
  selected,
  onSelect,
}: Props<V>): ReactNode {
  return (
    <section
      className="mt-7"
      role="radiogroup"
      aria-label={legend}
      data-testid={testId}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          {legend}
        </h2>
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          {legendShort}
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2 border-t border-ink/90 pt-3">
        {options.map((opt, idx) => {
          const isActive = opt.value === selected;
          const indexLabel = String(idx + 1).padStart(2, "0");
          return (
            <li key={opt.key}>
              <button
                type="button"
                role="radio"
                aria-checked={isActive}
                data-testid={opt.testId}
                data-selected={isActive ? "true" : "false"}
                onClick={() => onSelect(opt.value)}
                className={
                  "group flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 " +
                  (isActive
                    ? "border-ink bg-ink text-bg shadow-sm"
                    : "border-line bg-bg text-ink hover:border-ink/50")
                }
                style={{ minHeight: 56 }}
              >
                {/* 駅看板の番号マーカー: active は反転、inactive は ink-muted */}
                <span
                  aria-hidden="true"
                  className={
                    "font-mono text-[10px] tracking-[0.18em] tabular-nums uppercase " +
                    (isActive ? "text-bg/50" : "text-ink-muted")
                  }
                >
                  {indexLabel}
                </span>
                <span className="flex flex-1 flex-col leading-tight">
                  <span
                    className={
                      "font-mono text-[10px] tracking-[0.22em] uppercase " +
                      (isActive ? "text-bg/60" : "text-ink-muted")
                    }
                  >
                    {opt.short}
                  </span>
                  <span className="mt-0.5 text-[15px] font-semibold tracking-tight">
                    {opt.label}
                  </span>
                </span>
                <span
                  className={
                    "max-w-[42%] text-right text-[11px] leading-tight " +
                    (isActive ? "text-bg/70" : "text-ink-muted")
                  }
                >
                  {opt.hint}
                </span>
                {/* 右端の選択インジケーター: active = アクセントドット, inactive = 1px ライン */}
                <span
                  aria-hidden="true"
                  className={
                    "ml-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150 " +
                    (isActive
                      ? "bg-accent"
                      : "bg-transparent group-hover:bg-ink/30")
                  }
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
