"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ArrowRightIcon } from "./icons";
import { useSettings } from "@/lib/useSettings";
import { setPendingSessionFilter } from "@/lib/pendingSession";
import { useGlobalKey } from "@/lib/useGlobalKey";
import { KeyCap } from "@/app/session/_components/KeyCap";

/**
 * ホームのメイン CTA。常に「既定の設定で開始」として動作する。
 *
 * - 既定カテゴリ・既定難易度が未設定 (null) の場合は「カテゴリ=All / 難易度=All」として扱う
 * - クリック / Enter キー押下で sessionStorage にフィルタを書き出してから /session へ直行
 * - 「カテゴリ/難易度を変えて始める」リンク (customize CTA) は常に表示し、
 *   既定設定を変えたい時の動線を提供する
 */
export function StartSessionCTA() {
  const settings = useSettings();
  const router = useRouter();

  const handleDirectStart = useCallback(() => {
    setPendingSessionFilter({
      category: settings.defaultCategory,
      difficulty: settings.defaultDifficulty,
    });
    router.push("/session");
  }, [router, settings.defaultCategory, settings.defaultDifficulty]);

  /**
   * ホーム画面で Enter キーを押すと CTA を発火する。
   * `data-testid="home-start-cta"` の button を click() するだけで動作。
   */
  const handleEnter = useCallback(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-testid="home-start-cta"]',
    );
    el?.click();
  }, []);
  useGlobalKey("Enter", handleEnter);

  return (
    <section className="relative z-10 flex flex-col items-stretch gap-3 px-6 pb-10">
      <button
        type="button"
        onClick={handleDirectStart}
        aria-label="学習を始める"
        data-testid="home-start-cta"
        data-skip-start="true"
        className="group relative flex w-full items-center justify-between rounded-lg bg-primary px-6 py-5 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
        style={{ minHeight: 56 }}
      >
        <span className="flex flex-col leading-tight">
          <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
            Quick · 5Q
          </span>
          <span className="mt-0.5 text-lg">学習を始める</span>
        </span>
        <span className="flex items-center gap-2">
          {/* PC 幅でのみ Enter キーのヒントを表示 */}
          <span
            data-testid="home-start-key-hint"
            className="hidden md:inline-flex"
          >
            <KeyCap tone="on-primary">Enter</KeyCap>
          </span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-on-primary-faint transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <ArrowRightIcon />
          </span>
        </span>
      </button>

      <Link
        href="/start"
        data-testid="home-customize-cta"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg px-4 py-3 text-center text-[13px] font-medium text-ink-muted transition-colors duration-150 hover:border-ink/40 hover:text-ink"
        style={{ minHeight: 44 }}
      >
        <span
          aria-hidden="true"
          className="font-mono text-[10px] tracking-[0.22em] uppercase"
        >
          Customize
        </span>
        <span className="text-ink-muted" aria-hidden="true">
          ·
        </span>
        <span>カテゴリ/難易度を変えて始める</span>
      </Link>
    </section>
  );
}
