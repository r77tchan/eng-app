import { FeedbackBanner } from "./FeedbackBanner";
import { SpeakWordButton } from "./SpeakWordButton";

type Props = {
  word: string;
  isFeedback: boolean;
  isCorrect: boolean;
  answer: string;
  /** Sprint 6: 「わからない」回答による誤答かどうか */
  isSkipped?: boolean;
  /** Sprint 7: 単語読み上げ機能が利用可能か (false なら再生ボタン非表示) */
  speechSupported: boolean;
  /** Sprint 7: 再生ボタン押下時に呼ばれる。設定 OFF 時は呼び出し側で無効化する */
  onSpeak: () => void;
};

export function QuestionCard({
  word,
  isFeedback,
  isCorrect,
  answer,
  isSkipped,
  speechSupported,
  onSpeak,
}: Props) {
  return (
    <section className="flex flex-col items-center pt-8">
      <p className="font-mono text-[11px] tracking-[0.22em] text-ink-muted uppercase">
        What does it mean?
      </p>
      <p
        className="mt-4 text-center font-mono text-[44px] leading-[1.05] font-bold tracking-[-0.02em] text-ink"
        data-testid="question-word"
      >
        {word}
      </p>
      {speechSupported && (
        <div className="mt-5">
          <SpeakWordButton onClick={onSpeak} />
        </div>
      )}
      <p className="mt-5 text-center text-[12px] text-ink-muted">
        この単語の日本語の意味を選んでください
      </p>

      {isFeedback && (
        <FeedbackBanner
          isCorrect={isCorrect}
          answer={answer}
          isSkipped={isSkipped}
        />
      )}
    </section>
  );
}
