"use client";

import { useCallback, useState } from "react";
import { clearHistory } from "@/lib/history";
import { clearReviewQueue } from "@/lib/reviewQueue";

/**
 * 学習履歴と復習キューを 1 タップでクリアする。
 *
 * 二段階確認 UI:
 * 1. 「学習データをリセット」ボタンを 1 度タップすると、確認パネルが現れる
 * 2. 「はい、リセットする」をタップすると実行 / 「キャンセル」で取り消し
 *
 * `window.confirm` を使わない理由:
 * - iOS Safari でホームスクリーン起動時にネイティブ confirm が
 *   タップ後の focus 復帰で挙動が崩れることがある
 * - Playwright での自動テストで確認ダイアログを安定して操作したい
 *
 * Sprint 5 契約:
 * - リセット後、ホームの今日の数・正答率・ストリーク・復習件数は全て 0 相当
 */
export function DataResetSection() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = useCallback(() => {
    clearHistory();
    clearReviewQueue();
    setConfirming(false);
    setDone(true);
  }, []);

  // 「キャンセル」または完了表示を閉じる
  const handleCancel = useCallback(() => {
    setConfirming(false);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        data-testid="settings-reset-button"
        aria-haspopup="dialog"
        aria-expanded={confirming}
        onClick={() => {
          setDone(false);
          setConfirming(true);
        }}
        className="flex w-full items-center justify-between rounded-md border border-error/30 bg-error/5 px-4 py-3 text-left transition-colors duration-150 hover:border-error/60"
        style={{ minHeight: 56 }}
      >
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold text-error">
            学習データをリセット
          </span>
          <span className="mt-0.5 text-[12px] leading-snug text-ink-muted">
            学習履歴と復習キューを全て削除します
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-[0.16em] text-error uppercase">
          Reset
        </span>
      </button>

      {confirming ? (
        <div
          role="dialog"
          aria-label="学習データのリセット確認"
          data-testid="settings-reset-confirm"
          className="rounded-md border border-error/40 bg-error/5 p-4"
        >
          <p className="text-[13px] leading-relaxed text-ink">
            この操作は取り消せません。本当に学習履歴と復習キューを削除しますか？
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              data-testid="settings-reset-confirm-yes"
              onClick={handleReset}
              className="w-full rounded-md bg-error px-4 py-3 text-center text-[14px] font-semibold text-bg transition-colors duration-150 hover:opacity-90"
              style={{ minHeight: 48 }}
            >
              はい、リセットする
            </button>
            <button
              type="button"
              data-testid="settings-reset-confirm-cancel"
              onClick={handleCancel}
              className="w-full rounded-md border border-line bg-bg px-4 py-3 text-center text-[14px] text-ink transition-colors duration-150 hover:border-ink/60"
              style={{ minHeight: 48 }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : null}

      {done ? (
        <p
          role="status"
          data-testid="settings-reset-done"
          className="text-[12px] text-ink-muted"
        >
          学習履歴と復習キューをリセットしました。
        </p>
      ) : null}
    </div>
  );
}
