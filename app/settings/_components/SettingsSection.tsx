import type { ReactNode } from "react";

type Props = {
  /** 番号符号 (例 "01") */
  badge: string;
  /** 英字短ラベル (例 "Theme") */
  shortLabel: string;
  /** 日本語見出し */
  title: string;
  /** 補足文 (任意) */
  description?: string;
  children: ReactNode;
};

/**
 * 設定画面の共通セクション枠。
 *
 * ホームの `DashboardStats` ("01 / Today") や Start 画面と同じ editorial /
 * 駅看板トーンに揃え、番号符号 + 英字短ラベル + 日本語見出しの 3 行構成にする。
 */
export function SettingsSection({
  badge,
  shortLabel,
  title,
  description,
  children,
}: Props) {
  return (
    <section className="relative z-10 px-6 pt-7">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span className="text-ink">{badge}</span>
          <span className="mx-1.5">/</span>
          {shortLabel}
        </p>
      </div>
      <h2 className="mt-2 text-[18px] leading-tight font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-3 border-t border-ink/90" />
      <div className="mt-4">{children}</div>
    </section>
  );
}
