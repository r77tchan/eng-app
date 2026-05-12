"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "@/lib/filterOptions";
import { setPendingSessionFilter } from "@/lib/pendingSession";
import {
  filterPool,
  loadQuestionPool,
  type Category,
  type Difficulty,
} from "@/lib/questions";
import { ArrowRightIcon } from "@/app/_components/icons";
import { useGlobalKey } from "@/lib/useGlobalKey";
import { OptionList } from "./OptionList";
import { ShortageNotice } from "./ShortageNotice";

const SESSION_SIZE = 5;

/**
 * Sprint 4: カテゴリ・難易度の選択 UI。
 *
 * - カテゴリ・難易度はそれぞれ「すべて」含む単一選択
 * - 「この設定で開始」で sessionStorage にフィルタを書き出し /session/ に遷移
 * - 条件に合致する問題数が 5 問未満の場合、画面下に警告を表示し、
 *   フォールバックで条件外も出題される旨を案内する (Sprint 4 契約)
 *
 * デザイン (Designer / Sprint 4):
 * - ホームの editorial / 駅看板トーン (01 Today / 02 Review / 03 Format) と整合
 * - セクション符号は "S / Setup" (Setup ページの通し見出し)
 * - サブ符号 "01 / Category" "02 / Level" で 2 セクションを駅看板的に並べる
 * - 「この設定で開始」CTA はホームの `StartSessionCTA` と同じ言語に揃える
 * - 戻り導線は ResultView 等で使う outline ボタンと一貫させる
 */
export function StartSelectionForm() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 選択肢を変えるたび、条件に合致する問題数をプレビューする。
  // 静的 JSON を 1 度だけ fetch し、その後はメモリ上でフィルタを掛け直す。
  useEffect(() => {
    let cancelled = false;
    loadQuestionPool()
      .then((pool) => {
        if (cancelled) return;
        const count = filterPool(pool.questions, { category, difficulty }).length;
        setMatchingCount(count);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "問題プールの読み込みに失敗しました",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [category, difficulty]);

  const handleStart = useCallback(() => {
    setPendingSessionFilter({ category, difficulty });
    router.push("/session");
  }, [category, difficulty, router]);

  /**
   * Sprint 8 拡張: /start で Enter キーを押すと「この設定で開始」を発火する。
   * OptionList の選択肢は radio button なので、フォーカスがあると Space/Arrow で操作される。
   * Enter 自体は radio button の標準動作では使われないので、衝突しない。
   * IME / 修飾キー / 入力欄判定は useGlobalKey 側で処理済み。
   */
  const handleEnter = useCallback(() => {
    const el = document.querySelector<HTMLButtonElement>(
      '[data-testid="start-confirm"]',
    );
    el?.click();
  }, []);
  useGlobalKey("Enter", handleEnter);

  const isShort =
    matchingCount !== null && matchingCount < SESSION_SIZE;

  return (
    <main
      data-testid="start-page"
      className="relative flex min-h-screen w-full flex-col overflow-hidden pb-28"
    >
      {/* 紙面 (editorial) のドットグリッドを薄く敷いてホームと連続させる */}
      <div
        aria-hidden="true"
        className="bg-dotgrid pointer-events-none absolute inset-0 opacity-50"
      />

      {/* ブランドヘッダー (ホームの AppBrandHeader と同じ言語) */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-accent"
          />
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            Commute / EN
          </span>
        </div>
        <Link
          href="/"
          data-testid="start-back-home"
          aria-label="ホームに戻る"
          className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase transition-colors duration-150 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          <span>Home</span>
        </Link>
      </header>

      {/* ページ符号 + 日付 (DashboardStats の "01 / Today" と同じ符号言語) */}
      <section className="relative z-10 px-6 pb-1">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
            <span className="text-ink">S</span>
            <span className="mx-1.5">/</span>
            Setup
          </p>
          <p className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase tabular-nums">
            Pre-flight
          </p>
        </div>
        <div className="mt-3 border-t border-ink/90" />
      </section>

      {/* 見出し */}
      <section className="relative z-10 px-6 pt-5">
        <p className="font-mono text-[11px] tracking-[0.24em] text-ink-muted uppercase">
          Pick your set
        </p>
        <h1 className="mt-3 text-[32px] leading-[1.08] font-bold tracking-[-0.02em] text-ink">
          何を、
          <br />
          学びますか？
        </h1>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-ink-muted">
          カテゴリと難易度を 1 つずつ選びます。
          選んだ条件に合う問題から 5 問を出題します。
        </p>
      </section>

      <div className="relative z-10 px-6">
        <OptionList
          legend="カテゴリ"
          legendShort="01 / Category"
          testId="category-options"
          options={CATEGORY_OPTIONS.map((o) => ({
            key: o.value ?? "all",
            value: o.value,
            label: o.label,
            short: o.short,
            hint: o.hint,
            testId: `category-option-${o.value ?? "all"}`,
          }))}
          selected={category}
          onSelect={(v) => setCategory(v as Category | null)}
        />

        <OptionList
          legend="難易度"
          legendShort="02 / Level"
          testId="difficulty-options"
          options={DIFFICULTY_OPTIONS.map((o) => ({
            key: o.value ?? "all",
            value: o.value,
            label: o.label,
            short: o.short,
            hint: o.hint,
            testId: `difficulty-option-${o.value ?? "all"}`,
          }))}
          selected={difficulty}
          onSelect={(v) => setDifficulty(v as Difficulty | null)}
        />
      </div>

      <div className="min-h-[8px] flex-1" />

      {/* フッター: ステータス + CTA (画面下半分の親指リーチ) */}
      <section className="relative z-10 flex flex-col gap-3 px-6 pt-6">
        <ShortageNotice
          matchingCount={matchingCount}
          sessionSize={SESSION_SIZE}
          loadError={loadError}
        />

        <button
          type="button"
          onClick={handleStart}
          data-testid="start-confirm"
          data-shortage={isShort ? "true" : "false"}
          className="group flex w-full items-center justify-between rounded-lg bg-primary px-6 py-5 text-left font-semibold text-on-primary shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
          style={{ minHeight: 56 }}
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] tracking-[0.22em] text-on-primary-soft uppercase">
              Begin · {SESSION_SIZE}Q
            </span>
            <span className="mt-0.5 text-lg">この設定で開始</span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-on-primary-faint transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <ArrowRightIcon />
          </span>
        </button>
      </section>
    </main>
  );
}
