"use client";

import { useSyncExternalStore } from "react";
import { isSpeechSupported } from "@/lib/speech";

/**
 * Sprint 7: Web Speech API の利用可否を React コンポーネントから安全に取得するフック。
 *
 * - SSR / 静的書き出し時は false を返す (サーバ側では window 不在)
 * - クライアントマウント後に実値を返す
 * - 値は静的 (実行中に変化しない) のでサブスクライブは noop
 *
 * React 19 ルール (`useEffect` 内で同期 setState 禁止) を回避するために
 * `useState` + `useEffect` ではなく `useSyncExternalStore` を使用する。
 */

function subscribe(): () => void {
  // 実行中に変化しない値なので、リスナーへの通知は不要
  return () => {};
}

function getSnapshot(): boolean {
  return isSpeechSupported();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSpeechSupported(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
