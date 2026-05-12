"use client";

type Props = {
  onClick: () => void;
};

/**
 * Sprint 7: 単語の音声再再生ボタン。
 *
 * - `data-testid="speak-button"` (Evaluator が判定する)
 * - タップ領域 44x44px 以上 (片手操作要件)
 * - Web Speech API 非対応環境では呼び出し側で非表示にする (このコンポーネントは表示判定を持たない)
 * - 設定 OFF 時の処理は呼び出し側で行う (onClick 内で speakWord(word, false) を呼ぶか、別途分岐)
 *
 * デザイン (Sprint 7 Designer):
 * - AbortButton (右上「Esc + ×」) と対をなす editorial 言語:
 *   左に "Listen" の mono 符号 + 右下に "en-US" のロケール記号で
 *   「タップして発音を聞ける」「言語は en-US 固定」を一目で示す
 * - 丸ボタンは AbortButton と同形 (border-line + hover で ink) で控えめに
 * - 学習動線 (4 択タップ) を邪魔しないよう、QuestionCard 内の質問語直下に
 *   水平方向に並べ、視覚的に「単語に紐づく操作」と分かるアフォーダンスにする
 */
export function SpeakWordButton({ onClick }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase"
      >
        Listen
      </span>
      <button
        type="button"
        data-testid="speak-button"
        aria-label="単語を再生"
        onClick={onClick}
        className="flex items-center justify-center rounded-full border border-line bg-bg text-ink-muted transition-colors duration-150 hover:border-ink hover:text-ink active:scale-[0.985]"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* スピーカー本体 */}
          <path d="M11 5 6 9H3v6h3l5 4z" />
          {/* 音波 (2 本) */}
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      </button>
      <span
        aria-hidden="true"
        className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase tabular-nums"
      >
        en-US
      </span>
    </div>
  );
}
