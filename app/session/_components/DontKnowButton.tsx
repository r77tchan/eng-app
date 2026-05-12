import { KeyCap } from "./KeyCap";

type Props = {
  isFeedback: boolean;
  onClick: () => void;
};

/**
 * Sprint 6: 「わからない」ボタン (4 択の下に控えめに配置)。
 *
 * - 4 択より下に置き、誤タップを防ぐため見た目を控えめにする
 * - ただしタップ領域は 44×44px を確保する (片手操作要件)
 * - フィードバック表示中は disabled (連打防止)
 *
 * デザイン (Sprint 6 Designer):
 * - 主要ボタン (4 択 / 次へ) のヒエラルキーを崩さないテキストリンク風の控えめなトーン
 * - 左に warning ドット + mono uppercase "Don't know" の小符号で「補助選択肢」を明示
 *   (FeedbackBanner / ResultView の warning ドットと同じ言語に揃える)
 * - 中央の "わからない" は dotted underline で「選択肢の代替」感を保つ
 * - hover で text-ink まで持ち上げて反応を返す
 */
export function DontKnowButton({ isFeedback, onClick }: Props) {
  // フィードバック中は無効状態:
  // - hover での色変化を抑制 (反応しないボタンが動いて見えるのを防ぐ)
  // - cursor-not-allowed で「押せない」ことを明示
  // - 透明度を下げて視覚的に背景に沈める
  const buttonCls = isFeedback
    ? "text-ink-muted/40 cursor-not-allowed"
    : "text-ink-muted hover:text-ink";
  const underlineCls = isFeedback
    ? "decoration-line/50"
    : "decoration-line group-hover:decoration-ink";
  return (
    <button
      type="button"
      onClick={() => {
        // フィードバック中は無効 (連打防止)。
        // disabled 属性は使わず aria-disabled にすることで、ボタン上の
        // クリックイベントが親に伝播し、「画面クリックで次へ進む」が動作する。
        if (isFeedback) return;
        onClick();
      }}
      aria-disabled={isFeedback ? "true" : undefined}
      data-testid="dont-know-button"
      aria-keyshortcuts="Space"
      className={`group mt-1 flex w-full items-center justify-center gap-2.5 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${buttonCls}`}
      style={{ minHeight: 44 }}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] uppercase"
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isFeedback ? "bg-warning/40" : "bg-warning"
          }`}
        />
        <span>Don&apos;t know</span>
      </span>
      <span aria-hidden="true" className="h-3 w-px self-center bg-line" />
      <span
        className={`underline decoration-dotted underline-offset-4 ${underlineCls}`}
      >
        わからない
      </span>
      {/* Sprint 8: PC 幅でのみ Space キーのヒントを表示。スマホ幅は変更なし */}
      <span
        data-testid="dont-know-key-hint"
        className="ml-1 hidden md:inline-flex"
      >
        <KeyCap>Space</KeyCap>
      </span>
    </button>
  );
}
