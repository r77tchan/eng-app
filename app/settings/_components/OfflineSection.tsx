"use client";

import { useCallback, useState } from "react";
import { SettingsSection } from "./SettingsSection";
import { OfflineProgress } from "./OfflineProgress";
import { OfflineDoneBlock } from "./OfflineDoneBlock";
import { useOfflineCache } from "@/lib/useOfflineCache";
import { AlertIcon, DownloadIcon } from "@/app/_components/icons";

/**
 * Sprint 9: 設定画面の「オフライン対応」セクション。
 *
 * 状態機械 (`useOfflineCache` フックが管理):
 *   - idle          : 「オフライン用にダウンロード」ボタンを表示
 *   - downloading   : 進捗バー + 件数表示、メインボタン disabled
 *   - done          : 「オフライン対応済み」バッジ + 再ダウンロード / キャッシュ削除
 *   - error         : エラーメッセージ + 「再試行」ボタン
 *   - clearing      : 削除中、ボタン disabled
 *   - unsupported   : SW 未登録の案内
 *
 * Designer (Sprint 9) 仕上げ要点:
 *   - idle のプライマリ CTA を「黒背景・白抜き文字」に格上げし、他セクションの
 *     セカンダリ (RESET ボタン等) との階層を明確にする
 *   - SVG `DownloadIcon` をプライマリに、`AlertIcon` をエラーに採用
 *   - idle / progress / done / error 各ブロックに `ce-done-rise` (260ms) を付け、
 *     状態遷移時の唐突さを抑える
 *   - 進捗バー演出 / 完了バッジ演出は子コンポーネントに局所化
 */
export function OfflineSection() {
  const { state, download, clear } = useOfflineCache();
  // 「キャッシュを削除」確認ダイアログの開閉
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearRequest = useCallback(() => {
    setConfirmingClear(true);
  }, []);
  const handleClearConfirm = useCallback(() => {
    setConfirmingClear(false);
    clear();
  }, [clear]);
  const handleClearCancel = useCallback(() => {
    setConfirmingClear(false);
  }, []);

  const percent =
    state.phase === "downloading" && state.total > 0
      ? Math.min(100, Math.floor((state.done / state.total) * 100))
      : 0;

  return (
    <SettingsSection
      badge="06"
      shortLabel="Offline"
      title="オフライン対応"
      description="設定画面で 1 回ダウンロードすると、機内モードや圏外でも全ページとセッションを利用できます。"
    >
      <div data-testid="offline-section" className="flex flex-col gap-3">
        {state.phase === "unsupported" ? (
          <p className="rounded-md border border-line bg-bg-secondary px-3 py-2.5 text-[13px] leading-relaxed text-ink-muted">
            ページを再読み込みしてからもう一度お試しください。
          </p>
        ) : null}

        {state.phase === "idle" ? (
          <div className="ce-done-rise flex flex-col gap-3">
            {state.previousRecord ? (
              <p
                data-testid="offline-update-hint"
                className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] leading-relaxed text-warning"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
                />
                <span>アプリが更新されました。再ダウンロードを推奨します。</span>
              </p>
            ) : null}
            <button
              type="button"
              data-testid="offline-download-button"
              onClick={download}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg bg-primary px-4 py-4 text-left text-on-primary shadow-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              style={{ minHeight: 64 }}
            >
              {/* 左肩の路線記号風 3 本線 (駅看板トーンの控えめ装飾) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-2 right-3 flex flex-col items-end gap-[3px] opacity-30"
              >
                <span className="block h-px w-5 bg-on-primary" />
                <span className="block h-px w-3 bg-on-primary" />
                <span className="block h-px w-5 bg-on-primary" />
              </span>

              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-primary-faint text-on-primary transition-transform duration-200 group-hover:translate-y-[1px]"
              >
                <DownloadIcon width={18} height={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold tracking-tight">
                  オフライン用にダウンロード
                </span>
                <span className="mt-0.5 text-[11px] leading-snug text-on-primary-soft">
                  全ページ・画像・音声を一括キャッシュ
                </span>
              </span>
            </button>

            {/* 補足: 何が落ちるか / 容量目安。書籍奥付調で控えめに */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-line/70 pt-3">
              <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">
                Includes
              </dt>
              <dd className="font-mono text-[11px] text-ink-muted">
                HTML · CSS · JS · 音声 · フォント
              </dd>
              <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">
                Storage
              </dt>
              <dd className="font-mono text-[11px] text-ink-muted">
                端末のみ · クラウド送信なし
              </dd>
            </dl>
          </div>
        ) : null}

        {state.phase === "downloading" ? (
          <OfflineProgress
            done={state.done}
            total={state.total}
            percent={percent}
          />
        ) : null}

        {state.phase === "done" ? (
          <OfflineDoneBlock
            record={state.record}
            staleVersion={state.staleVersion}
            confirmingClear={confirmingClear}
            onRedownload={download}
            onClearRequest={handleClearRequest}
            onClearConfirm={handleClearConfirm}
            onClearCancel={handleClearCancel}
          />
        ) : null}

        {state.phase === "clearing" ? (
          <div className="ce-done-rise flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-ink-muted">
              キャッシュを削除中…
            </p>
            <button
              type="button"
              data-testid="offline-clear-button"
              disabled
              aria-disabled="true"
              className="flex w-full items-center justify-between rounded-md border border-line bg-bg-secondary px-4 py-3 text-left opacity-60"
              style={{ minHeight: 48 }}
            >
              <span className="text-[14px] font-semibold text-ink-muted">
                削除中…
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
                Clearing
              </span>
            </button>
          </div>
        ) : null}

        {state.phase === "error" ? (
          <div className="ce-done-rise flex flex-col gap-3">
            <div
              role="alert"
              data-testid="offline-error-message"
              className="flex items-start gap-2.5 rounded-md border border-error/40 bg-error/5 px-3 py-2.5 text-[13px] leading-relaxed text-error"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center"
              >
                <AlertIcon />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-error-strong">
                  {state.message}
                </span>
                {state.failed.length > 0 ? (
                  <span className="font-mono text-[11px] tabular-nums text-error-strong/80">
                    failed:{" "}
                    <span className="font-semibold">
                      {state.failed.length.toLocaleString()}
                    </span>{" "}
                    file{state.failed.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </span>
            </div>
            <button
              type="button"
              data-testid="offline-retry-button"
              onClick={download}
              className="flex w-full items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-left transition-colors duration-150 hover:border-accent/70 hover:bg-accent/10"
              style={{ minHeight: 48 }}
            >
              <span className="text-[14px] font-semibold text-accent">
                再試行
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
                Retry
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  );
}
