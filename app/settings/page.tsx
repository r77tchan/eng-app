import { SettingsView } from "./_components/SettingsView";

/**
 * /settings/ - 設定画面
 *
 * Sprint 5 で追加。LocalStorage に永続化された設定値を購読し、
 * テーマ・効果音・既定カテゴリ/難易度の変更とデータリセットを行う。
 */
export default function SettingsPage() {
  return <SettingsView />;
}
