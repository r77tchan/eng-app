"use client";

import type { MouseEvent } from "react";
import type { Question, SessionFilter } from "@/lib/questions";
import type { AnswerLog } from "../types";
import { SessionProgress } from "./SessionProgress";
import { QuestionCard } from "./QuestionCard";
import { ChoiceButton } from "./ChoiceButton";
import { SessionFilterBanner } from "./SessionFilterBanner";
import { AbortButton } from "./AbortButton";
import { DontKnowButton } from "./DontKnowButton";
import { KeyboardHints } from "./KeyboardHints";
import { WeblioLinkButton } from "./WeblioLinkButton";

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

/**
 * フィードバック中の「画面クリックで次へ進む」判定。
 *
 * - 以下の要素クリックは次へ進めない (専用アクションを優先):
 *   - 中断ボタン (`abort-button`)
 *   - Weblio リンクボタン (`weblio-link-button`)
 *   - 単語の音声再生ボタン (`speak-button`)
 *   - BottomNav 内のリンク (`bottom-nav`) — feedback 中も非表示だが防御的に
 *   - その他 button / a (4 択は disabled だが念のため closest("button") で除外)
 */
function isClickToNext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // 除外対象の testid を持つ祖先があるか
  const blockedTestIds = [
    "abort-button",
    "weblio-link-button",
    "speak-button",
    "bottom-nav",
  ];
  for (const id of blockedTestIds) {
    if (target.closest(`[data-testid="${id}"]`)) return false;
  }
  // button / a への直接クリック (4 択や DontKnow など) も除外
  if (target.closest("button")) return false;
  if (target.closest("a")) return false;
  return true;
}

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

  const handleScreenClick = (event: MouseEvent<HTMLElement>) => {
    if (!isFeedback) return;
    if (!isClickToNext(event.target)) return;
    onNext();
  };

  return (
    <main
      className="flex min-h-screen w-full flex-col px-6"
      data-testid="playing-view"
      data-feedback={isFeedback ? "true" : "false"}
      onClick={handleScreenClick}
    >
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

        {/* フィードバック中は Weblio リンクボタンを表示 (NextButton は廃止) */}
        {isFeedback && <WeblioLinkButton word={currentQuestion.word} />}
      </section>

      {/* Sprint 8: PC 幅 (md 以上) でのみキーボード操作ヒントを表示。
          Enter NEXT 表示は維持 (Enter キーで次へ進める旨を示す) */}
      <KeyboardHints />
    </main>
  );
}
