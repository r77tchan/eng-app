"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getSettingsServerSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/lib/settings";

/**
 * 設定の `theme` に従い `<html>` の `data-theme` 属性を切り替える。
 *
 * - "light" / "dark" は即時固定
 * - "system" は `prefers-color-scheme` メディアクエリに追従
 *
 * `useSyncExternalStore` で設定値と prefers-color-scheme の両方を購読し、
 * 変化時に `useEffect` で DOM 属性のみを書き換える (setState はしない)。
 * これにより React 19 の `react-hooks/set-state-in-effect` ルールに違反せず、
 * `react-hooks/immutability` (外部値の書き換え禁止) にも引っかからない。
 *
 * このコンポーネントは描画を持たない。
 */
export function ThemeApplier() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );

  const systemPrefersDark = useSyncExternalStore(
    subscribePrefersDark,
    getPrefersDarkSnapshot,
    getPrefersDarkServerSnapshot,
  );

  const effective: "light" | "dark" =
    settings.theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : settings.theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", effective);
    document.documentElement.style.colorScheme = effective;
  }, [effective]);

  return null;
}

// ---------------------------------------------------------------------------
// prefers-color-scheme をストア化 (useSyncExternalStore 用)
// ---------------------------------------------------------------------------

type MediaQueryListWithLegacy = MediaQueryList & {
  addListener?: (l: (e: MediaQueryListEvent) => void) => void;
  removeListener?: (l: (e: MediaQueryListEvent) => void) => void;
};

function getMQ(): MediaQueryListWithLegacy | null {
  if (typeof window === "undefined") return null;
  try {
    return window.matchMedia(
      "(prefers-color-scheme: dark)",
    ) as MediaQueryListWithLegacy;
  } catch {
    return null;
  }
}

function subscribePrefersDark(listener: () => void): () => void {
  const m = getMQ();
  if (!m) return () => {};
  const supportsModern = typeof m.addEventListener === "function";
  if (supportsModern) {
    m.addEventListener("change", listener);
  } else if (m.addListener) {
    m.addListener(listener);
  }
  return () => {
    if (supportsModern) {
      m.removeEventListener("change", listener);
    } else if (m.removeListener) {
      m.removeListener(listener);
    }
  };
}

function getPrefersDarkSnapshot(): boolean {
  const m = getMQ();
  return m ? m.matches : false;
}

function getPrefersDarkServerSnapshot(): boolean {
  return false;
}
