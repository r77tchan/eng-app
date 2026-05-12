"use client";

import { useEffect, useRef } from "react";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Sprint 6: セッション中断確認モーダル。揺れる車内での誤タップ防止のため
 * ホーム遷移前に必ず確認を取る。背景オーバーレイで下の UI を覆い、
 * 「中断する」(危険操作) と「続ける」(キャンセル) を縦並びで親指リーチに置く。
 *
 * Sprint 8 追加: 初期フォーカスを「続ける」に当て (誤 Enter で中断しない)、
 * Tab/Shift+Tab を confirm⇄cancel の閉ループに閉じ込める focus trap。
 * Escape による閉じる動作はグローバル useSessionKeybindings 側で onCancel が呼ばれる。
 *
 * Sprint 8 拡張:
 * - Enter キーで「中断する」(confirm) を発火する (一般的な UX 規約: Enter = 主アクション確定)
 * - 初期フォーカスは「続ける」のまま (誤クリックで Enter を不意打ちされないように、
 *   ユーザーがダイアログを認識してから明示的に Enter を押す形)
 * - Enter キーはモーダル中だけ有効。preventDefault してフォーカス済みボタンの
 *   デフォルト動作 (cancel ボタンに当たっていれば cancel) と衝突しないようにする
 * - Escape は引き続き useSessionKeybindings 側で onCancel を呼ぶので、ここでは扱わない
 */
export function AbortConfirmDialog({ onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  // 初期フォーカスを「続ける」に。Enter 誤発火でも中断されない安全側
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // フォーカストラップ: Tab / Shift+Tab で confirm⇄cancel の閉ループに閉じ込める。
  // 2 要素しかないので「アクティブ要素の反対側」へ移すだけで Tab/Shift+Tab 双方向に対応できる。
  // Sprint 8 拡張: Enter キーで「中断する」(onConfirm) を発火する。
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Tab") {
        const confirmEl = confirmButtonRef.current;
        const cancelEl = cancelButtonRef.current;
        if (!confirmEl || !cancelEl) return;
        const active = document.activeElement;
        const isInside = active === confirmEl || active === cancelEl;
        event.preventDefault();
        if (!isInside) {
          cancelEl.focus();
          return;
        }
        const next = active === cancelEl ? confirmEl : cancelEl;
        next.focus();
        return;
      }

      if (event.key === "Enter") {
        if (event.isComposing || event.keyCode === 229) return;
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
          return;
        // フォーカス済みボタン (例: 続ける) の標準クリック動作と衝突しないように
        // preventDefault してからグローバルに confirm を発火する
        event.preventDefault();
        onConfirm();
        return;
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onConfirm]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abort-confirm-title"
      data-testid="abort-confirm-dialog"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pt-6 pb-6 sm:items-center"
    >
      {/* 背面オーバーレイ: タップでキャンセル扱いにすると誤操作の温床になるので、
          ここではキャンセル動作は明示ボタンに限定する。 */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-lg border border-line bg-bg shadow-lg">
        {/* 警告ヘッダ: 左 error 縦バーで editorial 言語を踏襲 */}
        <div className="border-l-2 border-error bg-error/5 px-5 py-4">
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-error-strong uppercase">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-error"
            />
            <span>X</span>
            <span className="mx-1 text-ink-muted">/</span>
            <span>Abort</span>
          </p>
          <h2
            id="abort-confirm-title"
            className="mt-2 text-base font-semibold text-ink"
          >
            セッションを中断しますか？
          </h2>
          <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">
            これまでに解答した問題の履歴と復習キューはそのまま残ります。
          </p>
        </div>

        {/* アクション: 中断 (error 塗り) → 続ける (ink アウトライン) の優先順 */}
        <div className="flex flex-col gap-2.5 px-5 pt-4 pb-5">
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            data-testid="abort-confirm-button"
            className="group flex w-full items-center justify-between rounded-lg bg-error px-5 py-3 text-left font-semibold text-bg transition-[transform,opacity] duration-150 outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.985]"
            style={{ minHeight: 48 }}
          >
            <span className="flex flex-col leading-tight">
              <span className="font-mono text-[10px] tracking-[0.22em] text-bg/70 uppercase">
                Confirm
              </span>
              <span className="mt-0.5 text-[15px]">中断する</span>
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-[10px] tracking-[0.22em] text-bg/70 uppercase"
            >
              Exit
            </span>
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            data-testid="abort-cancel-button"
            className="flex w-full items-center justify-between rounded-lg border border-ink px-5 py-3 text-left font-semibold text-ink transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.985]"
            style={{ minHeight: 48 }}
          >
            <span className="flex flex-col leading-tight">
              <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
                Cancel
              </span>
              <span className="mt-0.5 text-[15px]">続ける</span>
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase"
            >
              Stay
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
