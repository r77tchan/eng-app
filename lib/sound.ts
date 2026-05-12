/**
 * 解答時の効果音再生ユーティリティ。
 *
 * ## 設計判断
 * - 「音声ファイルを同梱して `<audio>` で再生」する方式と、
 *   「Web Audio API でシンセサイズして再生」する方式があるが、
 *   後者を採用する。理由:
 *     - 静的書き出し (`output: 'export'`) と完全に整合する (追加ファイルなし)
 *     - mp3 / m4a のライセンス・容量・パスを気にしなくて済む
 *     - GitHub Pages のサブパス配信下でも basePath 解決が不要
 *     - 50ms 程度の短い波形なので 100ms 以内の即時フィードバック要件を満たす
 *
 * ## API
 * - `playFeedbackSound(correct)` — 正答時は二音 (低→高)、誤答時は単音 (低い唸り)
 *
 * ## ブラウザ互換
 * - iOS Safari / Android Chrome は AudioContext を「ユーザー操作起点で」のみ
 *   再生開始できる仕様。本ユーティリティは選択肢タップ (= ユーザー操作) の
 *   ハンドラから呼ばれるので問題ない。
 * - AudioContext は接続失敗時に握りつぶし、UI 体験は止めない。
 */

let cachedCtx: AudioContext | null = null;

type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (cachedCtx) {
    // Safari でブラウザがタブ切替時に suspended になるケースがあるため resume
    if (cachedCtx.state === "suspended") {
      cachedCtx.resume().catch(() => {});
    }
    return cachedCtx;
  }
  try {
    const w = window as WindowWithWebkit;
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    cachedCtx = new Ctor();
    return cachedCtx;
  } catch {
    return null;
  }
}

type Tone = {
  freq: number;
  /** 開始秒 (now からのオフセット) */
  start: number;
  /** 継続秒 */
  duration: number;
  /** 0..1 のピーク音量 */
  volume?: number;
  /** OscillatorNode の波形タイプ */
  type?: OscillatorType;
};

function playTones(tones: Tone[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type ?? "sine";
      osc.frequency.value = t.freq;

      const peak = t.volume ?? 0.18;
      const begin = now + t.start;
      const end = begin + t.duration;

      // クリック音回避のため短いフェードイン/アウトを掛ける
      gain.gain.setValueAtTime(0, begin);
      gain.gain.linearRampToValueAtTime(peak, begin + 0.01);
      gain.gain.linearRampToValueAtTime(0, end);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(begin);
      osc.stop(end + 0.02);
    }
  } catch {
    // 失敗しても学習体験は止めない
  }
}

/**
 * 正誤に応じた効果音を再生する。
 * @param correct true なら正解音、false なら不正解音
 * @param enabled 設定で OFF になっている場合は呼び出し側で false を渡す
 */
export function playFeedbackSound(correct: boolean, enabled: boolean): void {
  if (!enabled) return;
  if (typeof window === "undefined") return;

  if (correct) {
    // 正解: 短く明るい 2 音 (C5 → G5 程度)
    playTones([
      { freq: 523.25, start: 0, duration: 0.09, type: "sine", volume: 0.16 },
      { freq: 783.99, start: 0.08, duration: 0.12, type: "sine", volume: 0.16 },
    ]);
  } else {
    // 不正解: 低めの 1 音 (A3 弱め)
    playTones([
      { freq: 220, start: 0, duration: 0.16, type: "triangle", volume: 0.14 },
    ]);
  }
}
