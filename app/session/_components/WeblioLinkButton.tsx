"use client";

type Props = {
  word: string;
};

/**
 * Weblio (英和辞典) で単語を調べるための外部リンクボタン。
 *
 * - `data-testid="weblio-link-button"`
 * - 外部リンクなので `target="_blank"` + `rel="noopener noreferrer"`
 * - フィードバック画面で表示される「単語の意味を詳しく調べる」導線
 * - クリック時はイベント伝播を止め、PlayingView 側の「画面クリック → 次へ」と衝突しない
 *
 * デザイン (editorial / 駅看板トーン):
 * - SpeakWordButton と対をなす言語: 左に "Lookup" の mono 符号 + 右に外部リンクアイコン
 * - 学習動線を邪魔しないよう控えめなアウトラインボタン
 */
export function WeblioLinkButton({ word }: Props) {
  const url = `https://ejje.weblio.jp/content/${encodeURIComponent(word)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="weblio-link-button"
      aria-label={`Weblio で ${word} を調べる`}
      onClick={(e) => e.stopPropagation()}
      className="group mt-3 flex w-full items-center justify-between rounded-lg border border-line bg-bg px-5 py-3 text-left font-semibold text-ink transition-colors duration-150 hover:border-ink active:scale-[0.985]"
      style={{ minHeight: 48 }}
    >
      <span className="flex flex-col leading-tight">
        <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          Lookup · Weblio
        </span>
        <span className="mt-0.5 text-[15px]">単語の意味を詳しく調べる</span>
      </span>
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase"
        >
          External
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted transition-colors duration-150 group-hover:border-ink group-hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </span>
      </span>
    </a>
  );
}
