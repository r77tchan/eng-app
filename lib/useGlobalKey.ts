"use client";

import { useEffect } from "react";

/**
 * Sprint 8 拡張: ページ全体で 1 つの「特殊キー」(Enter / Escape など) を
 * グローバル keydown で待ち受けるための汎用フック。
 *
 * ホーム (`/`)、開始画面 (`/start`)、結果画面、中断モーダル等で再利用する。
 *
 * 設計判断:
 * - 安全策の判定 (IME / 修飾キー / 編集可能要素) を `useSessionKeybindings`
 *   と同じルールで一元化することで挙動のブレを防ぐ
 * - `enabled=false` のときはリスナそのものを張らない (副作用 0 を保証)
 * - `handler` 変更で都度リスナを張り直すので、呼び出し側は
 *   `useCallback` で安定参照を渡すことが推奨
 * - React 19 ルール: `useEffect` 本体では `addEventListener` のみで、
 *   同期 setState はしない (発火は KeyboardEvent コールバック内)
 *
 * 注意: `key` には `"Enter"` / `"Escape"` 等の `KeyboardEvent.key` 値を渡す。
 * 文字キー (`"a"` 等) も渡せるが、本スプリントでは Enter / Escape のみ使用。
 */
type Options = {
  /** false の間はリスナを張らない。ページ表示中だけ true にするなど */
  enabled?: boolean;
  /** 既定: true。発火時に preventDefault する */
  preventDefault?: boolean;
};

export function useGlobalKey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: Options = {},
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== key) return;
      // IME 入力中は無視
      if (event.isComposing || event.keyCode === 229) return;
      // 修飾キーは無視 (ブラウザショートカット優先)
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Enter / Escape は通常 shiftKey 併用しないので shift も無視
      if (event.shiftKey) return;
      // 編集可能要素にフォーカスがある場合は無視 (将来の入力欄追加に備えた防御)
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (target.isContentEditable) return;
      }

      if (preventDefault) {
        event.preventDefault();
      }
      handler(event);
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [key, handler, enabled, preventDefault]);
}
