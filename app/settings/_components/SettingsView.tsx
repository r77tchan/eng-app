"use client";

import { useCallback } from "react";
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/filterOptions";
import type { Category, Difficulty } from "@/lib/questions";
import { updateSettings, type ThemeMode } from "@/lib/settings";
import { useSettings } from "@/lib/useSettings";
import { playFeedbackSound } from "@/lib/sound";
import { speakWord } from "@/lib/speech";
import { useSpeechSupported } from "@/lib/useSpeechSupported";
import { SettingsHeader } from "./SettingsHeader";
import { SettingsSection } from "./SettingsSection";
import { SegmentedControl } from "./SegmentedControl";
import { ToggleSwitch } from "./ToggleSwitch";
import { DataResetSection } from "./DataResetSection";
import { OfflineSection } from "./OfflineSection";
import { AppAboutSection } from "./AppAboutSection";

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeMode;
  label: string;
  testId: string;
}> = [
  { value: "system", label: "自動", testId: "theme-option-system" },
  { value: "light", label: "ライト", testId: "theme-option-light" },
  { value: "dark", label: "ダーク", testId: "theme-option-dark" },
];

/**
 * 設定画面の本体。LocalStorage の設定値を購読し、変更を即時反映する。
 *
 * セクション構成:
 *   01 / Defaults — 既定カテゴリ / 既定難易度
 *   02 / Theme    — ライト / ダーク / 自動
 *   03 / Sound    — 効果音 ON/OFF (テスト再生付き)
 *   04 / Speech   — 単語読み上げ ON/OFF (Sprint 7)
 *   05 / Data     — 学習データのリセット
 *   06 / Offline  — ワンボタンフルキャッシュ (Sprint 9)
 *   07 / About    — バージョン情報
 */
export function SettingsView() {
  const settings = useSettings();

  // Sprint 7: Web Speech API 対応判定 (SSR では false / マウント後に実値)
  const speechSupported = useSpeechSupported();

  const handleCategory = useCallback((v: Category | null) => {
    updateSettings({ defaultCategory: v });
  }, []);
  const handleDifficulty = useCallback((v: Difficulty | null) => {
    updateSettings({ defaultDifficulty: v });
  }, []);
  const handleTheme = useCallback((v: ThemeMode) => {
    updateSettings({ theme: v });
  }, []);
  const handleSound = useCallback((v: boolean) => {
    updateSettings({ soundEnabled: v });
    if (v) playFeedbackSound(true, true);
  }, []);
  // Sprint 7: 単語読み上げトグル。ON にした瞬間にサンプル発話 (どのトグルか分かるように)
  const handleSpeech = useCallback(
    (v: boolean) => {
      updateSettings({ speechEnabled: v });
      if (v && speechSupported) {
        speakWord("hello", true);
      }
    },
    [speechSupported],
  );

  return (
    <main
      data-testid="settings-page"
      className="relative flex min-h-screen w-full flex-col overflow-hidden pb-28"
    >
      <div
        aria-hidden="true"
        className="bg-dotgrid pointer-events-none absolute inset-0 opacity-40"
      />

      <SettingsHeader />

      <SettingsSection
        badge="01"
        shortLabel="Defaults"
        title="既定の学習条件"
        description="設定するとホームから直接セッションが始まります。"
      >
        <div className="flex flex-col gap-5">
          <SegmentedControl<Category | null>
            label="既定カテゴリ"
            visibleLabel="カテゴリ"
            shortLabel="A / Category"
            testId="setting-default-category"
            options={CATEGORY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.short,
              testId: `setting-category-${o.value ?? "all"}`,
            }))}
            value={settings.defaultCategory}
            onChange={handleCategory}
          />
          <SegmentedControl<Difficulty | null>
            label="既定難易度"
            visibleLabel="難易度"
            shortLabel="B / Level"
            testId="setting-default-difficulty"
            options={DIFFICULTY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.short,
              testId: `setting-difficulty-${o.value ?? "all"}`,
            }))}
            value={settings.defaultDifficulty}
            onChange={handleDifficulty}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        badge="02"
        shortLabel="Theme"
        title="テーマ"
        description="夜間の通勤や明るい屋外でも読みやすい配色を選べます。"
      >
        <SegmentedControl<ThemeMode>
          label="テーマ"
          testId="setting-theme"
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={handleTheme}
        />
      </SettingsSection>

      <SettingsSection
        badge="03"
        shortLabel="Sound"
        title="効果音"
        description="正誤フィードバックの音を ON/OFF できます。"
      >
        <ToggleSwitch
          label="解答時の効果音"
          description={
            settings.soundEnabled
              ? "正解音・不正解音が鳴ります"
              : "完全に無音で学習できます"
          }
          testId="setting-sound-toggle"
          checked={settings.soundEnabled}
          onChange={handleSound}
        />
      </SettingsSection>

      {/* Sprint 7: 単語読み上げ。効果音 (03) とは独立した別セクション。 */}
      <SettingsSection
        badge="04"
        shortLabel="Speech"
        title="単語読み上げ"
        description="出題時に英単語を音声 (TTS) で発音します。効果音とは独立して設定できます。"
      >
        <ToggleSwitch
          label="単語の自動読み上げ"
          description={
            !speechSupported
              ? "お使いのブラウザでは利用できません"
              : settings.speechEnabled
                ? "出題時に英単語が読み上げられます"
                : "音声は再生されません"
          }
          testId="speech-toggle"
          checked={speechSupported ? settings.speechEnabled : false}
          onChange={speechSupported ? handleSpeech : () => {}}
          disabled={!speechSupported}
        />
      </SettingsSection>

      <SettingsSection
        badge="05"
        shortLabel="Data"
        title="学習データ"
        description="この端末に保存された学習履歴・復習キューを削除できます。"
      >
        <DataResetSection />
      </SettingsSection>

      {/* Sprint 9: ワンボタンでサイト全体をオフラインキャッシュする */}
      <OfflineSection />

      <AppAboutSection />
    </main>
  );
}
