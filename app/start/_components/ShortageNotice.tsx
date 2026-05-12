type Props = {
  matchingCount: number | null;
  sessionSize: number;
  loadError: string | null;
};

/**
 * Sprint 4 契約: 条件に合致する問題数が `sessionSize` 未満なら警告を表示。
 *
 * - 読み込み前 (matchingCount === null) は何も出さない
 * - 件数 0 → 「この条件に合う問題はありません」+ 補充される旨
 * - 0 < 件数 < sessionSize → 「不足するため他の問題も出題されます」
 * - 件数 ≥ sessionSize → 件数を Matching · N と editorial に表示
 * - エラー時 → エラーメッセージ
 *
 * デザイン (Designer / Sprint 4):
 * - Sprint 1〜3 で確立された「セクション符号 + ink ボーダー」の editorial 言語
 *   に揃え、警告も「箱詰めカード」ではなく駅看板の警告灯のトーンで提示する
 * - warning カラーはトーン全体ではなく、左の縦バー + 符号ドットだけに当て、
 *   情報密度を保ったまま視認性を出す
 * - success/error カラーとの取り違えを避けるため、shortage 系は warning に限定
 */
export function ShortageNotice({ matchingCount, sessionSize, loadError }: Props) {
  if (loadError) {
    return (
      <div
        data-testid="start-load-error"
        role="alert"
        className="flex items-start gap-3 border-l-2 border-error bg-error/5 px-4 py-3"
      >
        <span
          aria-hidden="true"
          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-error"
        />
        <div className="flex min-w-0 flex-col">
          <p className="font-mono text-[10px] tracking-[0.22em] text-error uppercase">
            Error · Pool
          </p>
          <p className="mt-1 text-sm leading-snug text-ink">{loadError}</p>
        </div>
      </div>
    );
  }
  if (matchingCount === null) {
    return null;
  }
  if (matchingCount >= sessionSize) {
    return (
      <div
        data-testid="start-match-ok"
        className="flex items-center justify-between border-t border-line pt-3"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-success"
          />
          <span>Matching</span>
        </p>
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink uppercase tabular-nums">
          <span className="text-ink">{matchingCount}</span>
          <span className="mx-1 text-ink-muted">/</span>
          <span className="text-ink-muted">{sessionSize}+ ready</span>
        </p>
      </div>
    );
  }
  return (
    <div
      role="status"
      data-testid="start-shortage-warning"
      data-matching-count={matchingCount}
      className="flex items-start gap-3 border-l-2 border-warning bg-warning/5 px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
      />
      <div className="flex min-w-0 flex-col">
        <p className="flex items-baseline gap-2 font-mono text-[10px] tracking-[0.22em] text-warning uppercase">
          <span>Shortage</span>
          <span className="text-warning/70 tabular-nums">
            {matchingCount}/{sessionSize}
          </span>
        </p>
        <p className="mt-1 text-sm leading-snug text-ink">
          条件に合う問題が不足しているため、他の問題も出題されます。
        </p>
      </div>
    </div>
  );
}
