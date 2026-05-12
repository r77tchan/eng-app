"use client";

import { useEffect } from "react";

/**
 * Sprint 8: 学習セッション画面のキーボード操作フック。
 *
 * - `window` レベルで `keydown` を購読し、アンマウント時に必ず外す (リーク防止)
 * - キーバインドは `/session` 画面でのみ有効 (このフックを呼ぶのは SessionRunner のみ)
 * - IME 入力中 (`event.isComposing` / keyCode 229) は発火させない
 * - 修飾キー (Ctrl/Cmd/Alt) と組み合わさった場合は発火させない (ブラウザショートカット優先)
 * - フォーカスが `<input>` / `<textarea>` / `[contenteditable]` の場合は発火させない
 * - モーダル (中断確認) が開いているとき:
 *    - 1〜4 / Enter / Space は無視
 *    - Escape は「閉じる」(onAbortCancel) を呼ぶ
 * - 数字キー (1〜4) は `phase === "playing"` 時のみ発火 (feedback 中の連打防止)
 * - Enter は `phase === "feedback"` 時のみ発火 (next)
 * - Space は `phase === "playing"` 時のみ発火、`preventDefault` で
 *   ブラウザのページスクロールを抑制する
 * - Escape は playing / feedback 両方で発火し、中断確認モーダルを開く
 *
 * Sprint 8 拡張 (result phase):
 * - Enter で `onRestart` (もう 1 セット) を発火する
 * - Escape で `onResultExit` (ホームに戻る) を発火する
 * - 1〜4 / Space は result phase では引き続き無視 (誤発火防止)
 *
 * React 19 ルール: `useEffect` body 内では `addEventListener` のみで、
 * 同期的な setState はしない (state 更新は受け取ったハンドラ経由 = イベントハンドラ内で行われる)
 */
type Phase = "loading" | "error" | "playing" | "feedback" | "result";

type Params = {
  phase: Phase;
  /** モーダルが開いているかどうか */
  abortDialogOpen: boolean;
  /** 4 択の選択肢 (シャッフル済み) */
  choices: string[];
  /** 各ハンドラ。SessionRunner のハンドラをそのまま渡す */
  onSelect: (choice: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onAbortRequest: () => void;
  onAbortCancel: () => void;
  /** Sprint 8 拡張: 結果画面で Enter を押したときに呼ぶ「もう 1 セット」 */
  onRestart: () => void;
  /** Sprint 8 拡張: 結果画面で Escape を押したときに呼ぶ「ホームに戻る」 */
  onResultExit: () => void;
};

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useSessionKeybindings({
  phase,
  abortDialogOpen,
  choices,
  onSelect,
  onNext,
  onSkip,
  onAbortRequest,
  onAbortCancel,
  onRestart,
  onResultExit,
}: Params) {
  useEffect(() => {
    // playing / feedback / result の各 phase でリスナを張る。
    // loading / error 中は何もしない (= 副作用範囲を最小化)
    if (phase !== "playing" && phase !== "feedback" && phase !== "result")
      return;

    function handler(event: KeyboardEvent) {
      // IME 入力中は完全に無視
      if (event.isComposing || event.keyCode === 229) return;
      // 修飾キーが押されている場合はブラウザショートカットを優先
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // 入力要素にフォーカスが当たっている場合は発火させない
      if (isEditableElement(event.target)) return;

      const key = event.key;

      // モーダルが開いているときは Escape だけを受ける (cancel)。
      // Enter は AbortConfirmDialog 側で confirm を発火するのでここでは無視する。
      if (abortDialogOpen) {
        if (key === "Escape") {
          event.preventDefault();
          onAbortCancel();
        }
        return;
      }

      // 結果画面: Enter で Restart、Escape でホーム遷移。1〜4 / Space は無視。
      if (phase === "result") {
        if (key === "Enter") {
          event.preventDefault();
          onRestart();
          return;
        }
        if (key === "Escape") {
          event.preventDefault();
          onResultExit();
          return;
        }
        return;
      }

      // Escape: 中断確認モーダルを開く (playing / feedback 両方)
      if (key === "Escape") {
        event.preventDefault();
        onAbortRequest();
        return;
      }

      // 数字キー 1〜4: 選択肢を選ぶ (playing のみ)
      if (key === "1" || key === "2" || key === "3" || key === "4") {
        if (phase !== "playing") return;
        const idx = Number(key) - 1;
        const choice = choices[idx];
        if (!choice) return;
        event.preventDefault();
        onSelect(choice);
        return;
      }

      // Space: わからない (playing のみ)
      if (key === " " || key === "Spacebar") {
        if (phase !== "playing") return;
        event.preventDefault();
        onSkip();
        return;
      }

      // Enter: 次へ (feedback のみ)
      if (key === "Enter") {
        if (phase !== "feedback") return;
        event.preventDefault();
        onNext();
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [
    phase,
    abortDialogOpen,
    choices,
    onSelect,
    onNext,
    onSkip,
    onAbortRequest,
    onAbortCancel,
    onRestart,
    onResultExit,
  ]);
}
