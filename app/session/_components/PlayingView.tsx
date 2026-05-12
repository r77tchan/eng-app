import type { Question, SessionFilter } from "@/lib/questions";
import type { AnswerLog } from "../types";
import { SessionProgress } from "./SessionProgress";
import { QuestionCard } from "./QuestionCard";
import { ChoiceButton } from "./ChoiceButton";
import { NextButton } from "./NextButton";
import { SessionFilterBanner } from "./SessionFilterBanner";

type Props = {
  questions: Question[];
  currentIndex: number;
  currentChoices: string[];
  currentQuestion: Question;
  isFeedback: boolean;
  selected: string | null;
  logs: AnswerLog[];
  filter: SessionFilter;
  fallbackUsed: boolean;
  matchingPoolSize: number;
  onSelect: (choice: string) => void;
  onNext: () => void;
};

export function PlayingView({
  questions,
  currentIndex,
  currentChoices,
  currentQuestion,
  isFeedback,
  selected,
  logs,
  filter,
  fallbackUsed,
  matchingPoolSize,
  onSelect,
  onNext,
}: Props) {
  const total = questions.length;
  const isCorrect = isFeedback && selected === currentQuestion.answer;
  const isLast = currentIndex >= total - 1;

  return (
    <main className="flex min-h-screen w-full flex-col px-6">
      <SessionProgress
        currentIndex={currentIndex}
        total={total}
        isFeedback={isFeedback}
        logs={logs}
      />

      <SessionFilterBanner
        filter={filter}
        fallbackUsed={fallbackUsed}
        matchingPoolSize={matchingPoolSize}
      />

      <QuestionCard
        word={currentQuestion.word}
        isFeedback={isFeedback}
        isCorrect={isCorrect}
        answer={currentQuestion.answer}
      />

      <div className="flex-1 min-h-[8px]" />

      <section className="flex flex-col gap-2.5 pb-8">
        {currentChoices.map((choice, idx) => (
          <ChoiceButton
            key={choice}
            choice={choice}
            index={idx}
            isFeedback={isFeedback}
            isThisSelected={selected === choice}
            isAnswer={choice === currentQuestion.answer}
            onSelect={onSelect}
          />
        ))}

        {isFeedback && <NextButton isLast={isLast} onClick={onNext} />}
      </section>
    </main>
  );
}
