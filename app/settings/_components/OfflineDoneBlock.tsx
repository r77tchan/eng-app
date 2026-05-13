"use client";

import {
  CheckBoldIcon,
  RefreshIcon,
  TrashIcon,
} from "@/app/_components/icons";

/**
 * Sprint 9: 「オフライン対応済み」ステータスブロック。
 * 完了バッジ + 再ダウンロード / キャッシュ削除のメニュー + 確認ダイアログを内包する。
 *
 * Designer (Sprint 9) 仕上げ要点:
 *   - 円形 success バッジに SVG `CheckBoldIcon` を載せ、`ce-check-pop` で scale-in
 *   - 完了日時 / total を colophon 風の key/value 字組みで品よく見せる
 *   - 再ダウンロード / 削除はセカンダリ階層に並列配置 (2 カラム grid)。
 *     375px 幅でも横スクロールしないよう、ラベル + アイコンのみで余白を切り詰める
 *   - 削除確認パネルは `ce-pop-in` で滑り込ませる
 */
type Record = {
  version: string;
  completedAt: string;
  total: number;
};

/** ISO 文字列 (YYYY-MM-DDTHH:mm:ss....) を "YYYY-MM-DD HH:mm" 形式に整形。 */
function formatCompletedAt(iso: string): { date: string; time: string } {
  // 失敗時は元文字列を返す (UI クラッシュ回避)
  if (!iso || iso.length < 16) return { date: iso, time: "" };
  const date = iso.slice(0, 10); // YYYY-MM-DD
  const time = iso.slice(11, 16); // HH:mm
  return { date, time };
}

export function OfflineDoneBlock({
  record,
  staleVersion,
  confirmingClear,
  onRedownload,
  onClearRequest,
  onClearConfirm,
  onClearCancel,
}: {
  record: Record;
  staleVersion: boolean;
  confirmingClear: boolean;
  onRedownload: () => void;
  onClearRequest: () => void;
  onClearConfirm: () => void;
  onClearCancel: () => void;
}) {
  const { date, time } = formatCompletedAt(record.completedAt);

  return (
    <div className="ce-done-rise flex flex-col gap-4">
      {/* 完了バッジ + メタ情報 (colophon 風 key/value 字組み) */}
      <div
        data-testid="offline-status-done"
        className="flex items-stretch gap-3 rounded-lg border border-success/30 bg-success/10 p-3"
      >
        {/* 円形 success バッジ + SVG チェック */}
        <span
          aria-hidden="true"
          className="ce-check-pop inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--color-success)_30%,transparent)]"
        >
          <CheckBoldIcon />
        </span>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="flex items-center gap-2">
            <span className="text-[14px] font-semibold tracking-tight text-success-strong">
              オフライン対応済み
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-success-strong/70 uppercase">
              Ready
            </span>
          </p>
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5">
            <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">
              Completed
            </dt>
            <dd className="font-mono text-[11px] tabular-nums text-ink">
              {date}
              {time ? (
                <span className="ml-1.5 text-ink-muted">{time}</span>
              ) : null}
            </dd>
            <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">
              Cached
            </dt>
            <dd className="font-mono text-[11px] tabular-nums text-ink">
              {record.total.toLocaleString()}
              <span className="ml-1 text-[10px] text-ink-muted">files</span>
            </dd>
          </dl>
        </div>
      </div>

      {staleVersion ? (
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

      {/* セカンダリ操作: 再ダウンロード / キャッシュ削除 を 1:1 で並列配置 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="offline-redownload-button"
          onClick={onRedownload}
          className="flex flex-col items-start gap-1 rounded-md border border-line bg-bg px-3 py-2.5 text-left transition-colors duration-150 hover:border-accent/60 hover:bg-accent/5"
          style={{ minHeight: 56 }}
        >
          <span className="inline-flex items-center gap-1.5 text-accent">
            <RefreshIcon width={12} height={12} />
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase">
              Re-download
            </span>
          </span>
          <span className="text-[13px] font-semibold text-ink">
            再ダウンロード
          </span>
        </button>
        <button
          type="button"
          data-testid="offline-clear-button"
          onClick={onClearRequest}
          className="flex flex-col items-start gap-1 rounded-md border border-line bg-bg px-3 py-2.5 text-left transition-colors duration-150 hover:border-error/60 hover:bg-error/5"
          style={{ minHeight: 56 }}
        >
          <span className="inline-flex items-center gap-1.5 text-error">
            <TrashIcon width={12} height={12} />
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase">
              Clear
            </span>
          </span>
          <span className="text-[13px] font-semibold text-ink">
            キャッシュを削除
          </span>
        </button>
      </div>

      {confirmingClear ? (
        <div
          role="dialog"
          aria-label="オフラインキャッシュ削除の確認"
          data-testid="offline-clear-confirm"
          className="animate-pop-in rounded-md border border-error/40 bg-error/5 p-4"
        >
          <p className="text-[13px] leading-relaxed text-ink">
            オフライン用にダウンロードしたキャッシュを削除します。再度オフライン対応するには再ダウンロードが必要です。
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              data-testid="offline-clear-confirm-yes"
              onClick={onClearConfirm}
              className="w-full rounded-md bg-error px-4 py-3 text-center text-[14px] font-semibold text-bg transition-colors duration-150 hover:opacity-90"
              style={{ minHeight: 48 }}
            >
              はい、削除する
            </button>
            <button
              type="button"
              data-testid="offline-clear-confirm-cancel"
              onClick={onClearCancel}
              className="w-full rounded-md border border-line bg-bg px-4 py-3 text-center text-[14px] text-ink transition-colors duration-150 hover:border-ink/60"
              style={{ minHeight: 48 }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
