"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ArrowRightIcon } from "./icons";
import { useSettings } from "@/lib/useSettings";
import { setPendingSessionFilter } from "@/lib/pendingSession";

/**
 * ホームのメイン CTA。Sprint 5 から「既定カテゴリ・既定難易度」設定の有無で挙動が変わる。
 *
 * - 既定値が両方とも設定済み (どちらも非 null) の場合:
 *     - タップでカテゴリ/難易度選択画面 (/start) を経由せず、
 *       sessionStorage にフィルタをセットして直接 /session へ遷移する
 *     - 「カテゴリ/難易度を変えて始める」リンクが下に表示される
 * - どちらかが「すべて」(null) または未設定の場合:
 *     - 従来どおり /start に遷移する (選択画面を経由)
 */
export function StartSessionCTA() {
  const settings = useSettings();
  const router = useRouter();

  const hasBothDefaults =
    settings.defaultCategory !== null && settings.defaultDifficulty !== null;

  const handleDirectStart = useCallback(() => {
    setPendingSessionFilter({
      category: settings.defaultCategory,
      difficulty: settings.defaultDifficulty,
    });
    router.push("/session");
  }, [router, settings.defaultCategory, settings.defaultDifficulty]);

  const ctaLabel = hasBothDefaults
    ? "既定の設定で開始"
    : "学習を始める";
  const ctaShort = hasBothDefaults ? "Quick · 5Q" : "Start session";

  return (
    <section className="relative z-10 flex flex-col items-stretch gap-3 px-6 pb-10">
      {hasBothDefaults ? (
        <button
          type="button"
          onClick={handleDirectStart}
          aria-label="既定の設定で学習を始める"
          data-testid="home-start-cta"
          data-skip-start="true"
          className="group relative flex w-full items-center justify-between rounded-lg bg-primary px-6 py-5 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
              {ctaShort}
            </span>
            <span className="mt-0.5 text-lg">{ctaLabel}</span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-on-primary-faint transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <ArrowRightIcon />
          </span>
        </button>
      ) : (
        <Link
          href="/start"
          aria-label="学習を始める"
          data-testid="home-start-cta"
          data-skip-start="false"
          className="group relative flex w-full items-center justify-between rounded-lg bg-primary px-6 py-5 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
              {ctaShort}
            </span>
            <span className="mt-0.5 text-lg">{ctaLabel}</span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-on-primary-faint transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <ArrowRightIcon />
          </span>
        </Link>
      )}

      {hasBothDefaults ? (
        <Link
          href="/start"
          data-testid="home-customize-cta"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg px-4 py-3 text-center text-[13px] font-medium text-ink-muted transition-colors duration-150 hover:border-ink/40 hover:text-ink"
          style={{ minHeight: 44 }}
        >
          <span aria-hidden="true" className="font-mono text-[10px] tracking-[0.22em] uppercase">
            Customize
          </span>
          <span className="text-ink-muted" aria-hidden="true">·</span>
          <span>カテゴリ/難易度を変えて始める</span>
        </Link>
      ) : (
        <p className="text-center font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">
          Tap to begin · 5問1セット
        </p>
      )}
    </section>
  );
}
