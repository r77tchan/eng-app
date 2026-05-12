import { XIcon } from "@/app/_components/icons";

type Props = {
  onClick: () => void;
};

/**
 * Sprint 6: セッション中断ボタン (画面上部右寄せ)。
 *
 * - 親指リーチ (下半分) を邪魔しないよう、上部に配置する設計
 * - タップ領域 44×44px 以上を確保 (片手操作要件)
 * - クリック時は親が確認モーダルを開く。直接遷移はしない (誤タップ防止)
 *
 * デザイン (Sprint 6 Designer):
 * - editorial / 駅看板トーン: 上に "Esc" の符号 + 下に丸ボタン (アイコン)
 *   これで「中断できる」と意味的に分かりやすくしつつ、学習動線 (下半分) を邪魔しない
 * - 既存 SessionProgress の "01 / 05" "SESSION" と同じ tracking / mono / uppercase で
 *   左右の縦リズムを揃える
 * - 色は ink-muted 基調、hover で ink に上げる (Sprint 1〜5 のミニマリストトーン踏襲)
 */
export function AbortButton({ onClick }: Props) {
  return (
    <div className="flex flex-col items-end gap-1.5 pt-6">
      {/* PC 幅 (md 以上) でのみ「Esc」mono ラベルを表示。
          スマホでは非表示 (機能と a11y は維持) */}
      <span
        aria-hidden="true"
        data-testid="abort-key-hint"
        className="hidden md:flex font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase"
      >
        Esc
      </span>
      <button
        type="button"
        onClick={onClick}
        data-testid="abort-button"
        aria-label="セッションを中断する"
        aria-keyshortcuts="Escape"
        className="flex items-center justify-center rounded-full border border-line bg-bg text-ink-muted transition-colors duration-150 hover:border-ink hover:text-ink active:scale-[0.985]"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <XIcon width={14} height={14} />
      </button>
    </div>
  );
}
