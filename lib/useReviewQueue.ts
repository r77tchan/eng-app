"use client";

import { useSyncExternalStore } from "react";
import {
  getReviewQueueSnapshot,
  getReviewQueueServerSnapshot,
  subscribeReviewQueue,
} from "@/lib/reviewQueue";

/**
 * LocalStorage に保存された復習キュー (誤答キュー) を購読するカスタムフック。
 *
 * - SSR / 静的書き出し時は空配列を返す (getReviewQueueServerSnapshot)
 * - クライアント側ではマウント後すぐに実データを返し、
 *   addToReviewQueue / removeFromReviewQueue / clearReviewQueue や
 *   他タブからの storage イベントで再レンダーする
 *
 * 同じキュー内容に対しては同一参照を返すため、無限ループにはならない。
 */
export function useReviewQueue(): string[] {
  return useSyncExternalStore(
    subscribeReviewQueue,
    getReviewQueueSnapshot,
    getReviewQueueServerSnapshot,
  );
}
