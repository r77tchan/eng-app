"use client";

import { useSyncExternalStore } from "react";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeHistory,
  type AnswerRecord,
} from "@/lib/history";

/**
 * LocalStorage に保存された学習履歴を購読するカスタムフック。
 *
 * - SSR / 静的書き出し時は空配列を返す (getHistoryServerSnapshot)
 * - クライアント側ではマウント後すぐに実データを返し、
 *   appendAnswerLog / clearHistory や他タブからの storage イベントで再レンダーする
 *
 * 同じレコード集合に対しては同一参照を返すため、無限ループにはならない。
 */
export function useHistoryRecords(): AnswerRecord[] {
  return useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
}
