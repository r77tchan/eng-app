import type { Question, SessionFilter } from "@/lib/questions";
import type { AnswerLog } from "../types";
import { SessionProgress } from "./SessionProgress";
import { QuestionCard } from "./QuestionCard";
import { ChoiceButton } from "./ChoiceButton";
import { NextButton } from "./NextButton";
import { SessionFilterBanner } from "./SessionFilterBanner";
import { AbortButton } from "./AbortButton";
import { DontKnowButton } from "./DontKnowButton";
import { KeyboardHints } from "./KeyboardHints";

type Props = {
  questions: Question[];
  currentIndex: number;
  currentChoices: string[];
  currentQuestion: Question;
  isFeedback: boolean;
  selected: string | null;
  /** Sprint 6: 直近の回答が「わからない」だったか */
  isSkipped: boolean;
  logs: AnswerLog[];
  filter: SessionFilter;
  fallbackUsed: boolean;
  matchingPoolSize: number;
  /** Sprint 7: Web Speech API が利用可能か */
  speechSupported: boolean;
  onSelect: (choice: string) => void;
  onSkip: () => void;
  onAbort: () => void;
  onNext: () => void;
  /** Sprint 7: 単語再生ボタン押下時のハンドラ */
  onSpeak: () => void;
};

export function PlayingView({
  questions,
  currentIndex,
  currentChoices,
  currentQuestion,
  isFeedback,
  selected,
  isSkipped,
  logs,
  filter,
  fallbackUsed,
  matchingPoolSize,
  speechSupported,
  onSelect,
  onSkip,
  onAbort,
  onNext,
  onSpeak,
}: Props) {
  const total = questions.length;
  const isCorrect = isFeedback && selected === currentQuestion.answer;
  const isLast = currentIndex >= total - 1;

  return (
    <main className="flex min-h-screen w-full flex-col px-6">
      {/* Sprint 6: 上部右寄せに中断ボタンを置く。SessionProgress とは
          flex 並びにして横スクロールを発生させない。AbortButton 側で pt-6 を
          持つので、ここでは外側 padding を持たず縦リズムを揃える */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <SessionProgress
            currentIndex={currentIndex}
            total={total}
            isFeedback={isFeedback}
            logs={logs}
          />
        </div>
        <AbortButton onClick={onAbort} />
      </div>

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
        isSkipped={isFeedback && isSkipped}
        speechSupported={speechSupported}
        onSpeak={onSpeak}
      />

      <div className="flex-1 min-h-[8px]" />

      <section className="flex flex-col gap-2.5 pb-4 md:pb-2">
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

        {/* Sprint 6: 4 択の下に控えめに「わからない」を置く */}
        <DontKnowButton isFeedback={isFeedback} onClick={onSkip} />

        {isFeedback && <NextButton isLast={isLast} onClick={onNext} />}
      </section>

      {/* Sprint 8: PC 幅 (md 以上) でのみキーボード操作ヒントを表示。
          アクション群とは独立した足元に置くことで、フィードバック時の
          NextButton がヒントを画面外へ押し出さないようにする */}
      <KeyboardHints />
    </main>
  );
}
