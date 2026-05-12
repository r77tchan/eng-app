/**
 * Sprint 7: 単語の音声再生ユーティリティ (Web Speech API / TTS)
 *
 * ## 設計判断
 * - 静的ホスティング前提のため、事前録音音声ファイルは同梱しない。
 *   ブラウザ標準の `window.speechSynthesis` でクライアント側生成する。
 * - `lib/sound.ts` (Web Audio API シンセサイザの効果音) には触れない。
 *   効果音と単語読み上げは独立した概念として実装する。
 *
 * ## 言語ロケール
 * - `en-US` 固定。`SpeechSynthesisUtterance.lang = "en-US"`
 *
 * ## ブラウザ互換
 * - 未対応 (`window.speechSynthesis` が undefined) の環境では
 *   再生ボタン非表示・自動再生スキップとする。UI 側で `isSpeechSupported()`
 *   を参照して描画を切り替える。
 * - 連打されても重ならないよう、`speak()` の前に `cancel()` で停止する。
 * - iOS Safari など一部ブラウザでは初回はユーザー操作が必要 (autoplay policy)。
 *   問題切り替わり時の自動再生はユーザーが既に操作して画面遷移している
 *   コンテキストで呼ばれるため、通常は問題ないが、失敗時も例外を握りつぶし
 *   学習体験を止めない。
 *
 * ## API
 * - `isSpeechSupported(): boolean` — Web Speech API が利用可能か
 * - `speakWord(word, enabled)` — 単語を発話。enabled=false なら何もしない
 * - `cancelSpeech()` — 進行中の発話をキャンセル (画面アンマウント時など)
 */

const SPEECH_LANG = "en-US";

/**
 * 現在の実行環境で Web Speech API が利用可能かどうかを判定する。
 *
 * - SSR (window 未定義) でも安全に false を返す
 * - `speechSynthesis` プロパティ取得時の例外も握りつぶす
 */
export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  } catch {
    return false;
  }
}

/**
 * 進行中の発話をキャンセルする。アンマウント時などに呼び出す。
 * 未対応環境では何もしない。
 */
export function cancelSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // 失敗しても学習体験は止めない
  }
}

/**
 * 与えられた単語を `en-US` で発話する。
 *
 * @param word 発話対象の英単語 (空文字や undefined は無視)
 * @param enabled 設定値。false なら何もしない (呼び出し側で `settings.speechEnabled` を渡す想定)
 *
 * - 既に発話中の場合は `cancel()` で停止してから新しい発話を開始するため、
 *   再生ボタン連打や自動再生の二重発火でも音が重ならない。
 * - 未対応ブラウザ・SpeechSynthesisUtterance 生成失敗時は静かにスキップ。
 */
export function speakWord(
  word: string | undefined | null,
  enabled: boolean,
): void {
  if (!enabled) return;
  if (!isSpeechSupported()) return;
  if (typeof word !== "string") return;
  const trimmed = word.trim();
  if (trimmed.length === 0) return;

  try {
    // 連打や自動再生との重複を避けるため、毎回キャンセルしてから話す
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(trimmed);
    utterance.lang = SPEECH_LANG;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // 失敗しても学習体験は止めない
  }
}
