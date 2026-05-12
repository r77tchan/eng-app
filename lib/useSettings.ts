"use client";

import { useSyncExternalStore } from "react";
import {
  getSettingsSnapshot,
  getSettingsServerSnapshot,
  subscribeSettings,
  type Settings,
} from "@/lib/settings";

/**
 * LocalStorage に保存されたユーザー設定を購読するカスタムフック。
 *
 * - SSR / 静的書き出し時はデフォルト設定を返す
 * - クライアント側ではマウント後すぐに実データを返し、
 *   updateSettings / clearSettings や storage イベントで再レンダーする
 */
export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );
}
