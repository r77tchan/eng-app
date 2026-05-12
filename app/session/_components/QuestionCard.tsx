import { FeedbackBanner } from "./FeedbackBanner";

type Props = {
  word: string;
  isFeedback: boolean;
  isCorrect: boolean;
  answer: string;
};

export function QuestionCard({ word, isFeedback, isCorrect, answer }: Props) {
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
      <p className="mt-2 text-center text-[12px] text-ink-muted">
        この単語の日本語の意味を選んでください
      </p>

      {isFeedback && <FeedbackBanner isCorrect={isCorrect} answer={answer} />}
    </section>
  );
}
