"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, HistoryIcon, SettingsIcon } from "./icons";

type TabDef = {
  href: string;
  label: string;
  testId: string;
  Icon: (p: { width?: number; height?: number }) => React.ReactElement;
};

const TABS: TabDef[] = [
  { href: "/", label: "Home", testId: "nav-home", Icon: HomeIcon },
  {
    href: "/history",
    label: "History",
    testId: "nav-history",
    Icon: HistoryIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    testId: "nav-settings",
    Icon: SettingsIcon,
  },
];

/**
 * 画面下部に固定表示するナビゲーション。
 *
 * Sprint 2 契約:
 * - 学習セッション中 (/session) では表示しない
 * - 現在のタブをハイライト表示
 * - タップ領域は 44x44 以上
 *
 * デザイン: Sprint 1 のブランドドット (`AppBrandHeader`) を active タブに
 * 引き継ぎ、editorial / 駅看板トーンに揃える。ラベルは英数の方が見出しと
 * 連続して読めるため Home / History の英字で統一 (アクセシブルラベルは別途付与)。
 */
export function BottomNav() {
  const pathname = usePathname() ?? "/";

  // 学習セッション中は学習に集中させるため非表示
  // Next.js の trailingSlash:true に対応し前方一致で判定
  if (pathname === "/session" || pathname.startsWith("/session/")) {
    return null;
  }

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname === tab.href ||
                pathname.startsWith(`${tab.href}/`);
          const aria =
            tab.testId === "nav-home"
              ? "ホーム"
              : tab.testId === "nav-history"
                ? "履歴"
                : "設定";
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-label={aria}
                aria-current={isActive ? "page" : undefined}
                data-testid={tab.testId}
                data-active={isActive ? "true" : "false"}
                className={`group relative flex h-14 w-full flex-col items-center justify-center gap-1 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-150 ${
                  isActive ? "text-ink" : "text-ink-muted"
                }`}
                style={{ minHeight: 56 }}
              >
                {/* 上端のアクティブインジケータ (駅看板の上線) */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-6 top-0 h-px transition-colors duration-150 ${
                    isActive ? "bg-ink" : "bg-transparent"
                  }`}
                />
                <span className="flex items-center gap-1.5">
                  {/* active 時はブランドドットを灯す */}
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
                      isActive ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                  <tab.Icon width={18} height={18} />
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
