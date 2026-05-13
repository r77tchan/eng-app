import { SettingsSection } from "./SettingsSection";

const APP_VERSION = "1.1.0";
const APP_BUILD = "Sprint · 9/9";

/**
 * アプリ情報セクション (設定画面の最下段)。
 *
 * デザイン: 書籍奥付 (colophon) の言語に寄せた key/value テーブル。
 *   - dt 列は uppercase mono の小ラベル
 *   - dd 列は ink の tabular-nums 値
 *   - 末尾に "—" マークと " / no-cloud · client-only" の極小注記を入れ、
 *     editorial 字組みでアプリの素性 (静的・端末完結) を一目で示す
 */
export function AppAboutSection() {
  return (
    <SettingsSection badge="07" shortLabel="About" title="アプリ情報">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-3">
        <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          Version
        </dt>
        <dd
          data-testid="settings-app-version"
          className="font-mono text-[13px] tabular-nums text-ink"
        >
          {APP_VERSION}
        </dd>
        <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          Build
        </dt>
        <dd className="font-mono text-[13px] text-ink">{APP_BUILD}</dd>
        <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          TTS
        </dt>
        <dd className="font-mono text-[13px] text-ink-muted">
          Web Speech API · en-US
        </dd>
        <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          Storage
        </dt>
        <dd className="font-mono text-[13px] text-ink">LocalStorage</dd>
        <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          Sync
        </dt>
        <dd className="font-mono text-[13px] text-ink-muted">
          無し · この端末のみ
        </dd>
      </dl>
      <p className="mt-4 font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
        — CommuteEnglish · static · client-only
      </p>
    </SettingsSection>
  );
}
