import { KeyCap } from "./KeyCap";

/**
 * Sprint 8: PC 幅 (768px 以上) でのみ表示するキーバインドのヒント。
 *
 * - スマホ幅 (`< 768px`) では `hidden`、`md:` 以上で `flex` 表示
 * - editorial 言語に揃える: AbortButton の "Esc" / SpeakWordButton の "Listen / EN-US" と
 *   同じ mono / uppercase / tracking 広め + KeyCap (kbd) を組み合わせた符号化
 * - 学習中の固定操作 (1〜4 / Space / Enter / Esc) を一覧化して可視化
 * - 横スクロールが起きないように `flex-wrap` で折り返し可能にしておく
 *
 * data-testid="keyboard-hints" を付与し、Evaluator がブレークポイント挙動を検査できる。
 *
 * デザイン補足:
 * - 上部に細い区切り線 (border-t) で「ガイドライン」と分離 (editorial)
 * - 左に "K" の符号 + "Keys" のラベルで AbortButton "Esc" / SpeakWordButton "Listen" と統一感
 * - 4 種のキーを縦バー (`bg-line`) で区切り、駅看板のリズムを踏襲
 */

type KeyHint = {
  key: string;
  label: string;
};

const HINTS: KeyHint[] = [
  { key: "1·2·3·4", label: "Choice" },
  { key: "Space", label: "Skip" },
  { key: "Enter", label: "Next" },
  { key: "Esc", label: "Abort" },
];

export function KeyboardHints() {
  return (
    <div
      data-testid="keyboard-hints"
      aria-hidden="true"
      className="hidden md:flex w-full items-center justify-center gap-3 border-t border-line/70 pt-3 pb-5"
    >
      <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-ink-muted/60"
        />
        <span>K</span>
        <span className="text-ink-muted/60">/</span>
        <span>Keys</span>
      </span>
      <span aria-hidden="true" className="h-3 w-px self-center bg-line" />
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {HINTS.map((hint, idx) => (
          <li
            key={hint.key}
            className="flex items-center gap-1.5"
          >
            {idx > 0 && (
              <span
                aria-hidden="true"
                className="mr-1 h-3 w-px self-center bg-line"
              />
            )}
            <KeyCap>{hint.key}</KeyCap>
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              {hint.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
