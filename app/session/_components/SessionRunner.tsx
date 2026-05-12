"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadQuestionPool,
  shuffle,
  type Question,
  type SessionFilter,
} from "@/lib/questions";
import { appendAnswerLog } from "@/lib/history";
import { consumePendingSessionFilter } from "@/lib/pendingSession";
import {
  addToReviewQueue,
  getReviewIds,
  removeFromReviewQueue,
} from "@/lib/reviewQueue";
import { calcReviewDelta, planSession } from "@/lib/sessionPlanner";
import { playFeedbackSound } from "@/lib/sound";
import { getSettings } from "@/lib/settings";
import { LoadingView } from "./LoadingView";
import { ErrorView } from "./ErrorView";
import { PlayingView } from "./PlayingView";
import { ResultView } from "./ResultView";
import type { AnswerLog, Phase } from "../types";

const SESSION_SIZE = 5;

type Props = {
  onRestart: () => void;
};

/**
 * 1 セッション分の状態を持ち、ライフサイクル全体を司るコンポーネント。
 *
 * 親側で `key` prop を切り替えることで再マウントされる前提のため、
 * リスタート時の状態リセットは「新規マウント」によって自然に行われる。
 * useEffect 内で同期的に setState する必要がなく、
 * React 19 の `react-hooks/set-state-in-effect` ルールにも適合する。
 *
 * Sprint 3:
 * - セッション開始時、復習キューに入っている問題を優先的に出題する
 * - 解答ごとに復習キューを更新する
 * - 結果画面で「復習に追加」「復習から卒業」の件数を表示
 *
 * Sprint 4:
 * - sessionStorage の `pendingSession` フィルタを 1 度だけ消費し、
 *   カテゴリ・難易度の絞り込みで出題する
 * - 条件に合致する問題が 5 問未満の場合、フォールバックで条件外を補充し、
 *   プレイ画面上部に警告メッセージを表示する
 */
export function SessionRunner({ onRestart }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewIdsAtStart, setReviewIdsAtStart] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [filter, setFilter] = useState<SessionFilter>({
    category: null,
    difficulty: null,
  });
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [matchingPoolSize, setMatchingPoolSize] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Sprint 4: マウント時に「次のセッション用フィルタ」を 1 度だけ消費する。
    // リロードで残らないよう sessionStorage で管理しているため、ここで取り出すと消える。
    const appliedFilter = consumePendingSessionFilter();

    loadQuestionPool()
      .then((pool) => {
        if (cancelled) return;
        const reviewIds = getReviewIds();
        const plan = planSession(
          pool.questions,
          reviewIds,
          SESSION_SIZE,
          appliedFilter,
        );

        if (plan.questions.length < SESSION_SIZE) {
          setErrorMessage(
            `問題プールが不足しています (必要: ${SESSION_SIZE}問 / 実際: ${plan.questions.length}問)`,
          );
          setPhase("error");
          return;
        }
        setQuestions(plan.questions);
        setShuffledChoices(plan.questions.map((q) => shuffle(q.choices)));
        setReviewIdsAtStart(plan.reviewIdsAtStart);
        setFilter(appliedFilter);
        setFallbackUsed(plan.fallbackUsed);
        setMatchingPoolSize(plan.matchingPoolSize);
        setPhase("playing");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "問題の読み込みに失敗しました";
        setErrorMessage(msg);
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentChoices = shuffledChoices[currentIndex] ?? [];

  const handleSelect = useCallback(
    (choice: string) => {
      if (phase !== "playing" || !currentQuestion) return;
      const correct = choice === currentQuestion.answer;
      setSelected(choice);
      setLogs((prev) => [
        ...prev,
        { questionId: currentQuestion.id, selected: choice, correct },
      ]);
      appendAnswerLog({
        questionId: currentQuestion.id,
        selected: choice,
        correct,
      });
      if (correct) {
        removeFromReviewQueue(currentQuestion.id);
      } else {
        addToReviewQueue(currentQuestion.id);
      }
      // Sprint 5: 効果音 (設定 ON のときのみ再生 / ユーザー操作起点なので
      // AudioContext のオートプレイ制限にも抵触しない)
      const { soundEnabled } = getSettings();
      playFeedbackSound(correct, soundEnabled);
      setPhase("feedback");
    },
    [phase, currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (phase !== "feedback") return;
    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      setPhase("result");
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setPhase("playing");
  }, [phase, currentIndex, questions.length]);

  const reviewDelta = useMemo(
    () => calcReviewDelta(logs, reviewIdsAtStart),
    [logs, reviewIdsAtStart],
  );

  if (phase === "loading") return <LoadingView />;
  if (phase === "error") return <ErrorView message={errorMessage} />;
  if (phase === "result") {
    return (
      <ResultView
        logs={logs}
        total={questions.length}
        reviewAdded={reviewDelta.addedCount}
        reviewGraduated={reviewDelta.graduatedCount}
        onRestart={onRestart}
      />
    );
  }

  return (
    <PlayingView
      questions={questions}
      currentIndex={currentIndex}
      currentChoices={currentChoices}
      currentQuestion={currentQuestion!}
      isFeedback={phase === "feedback"}
      selected={selected}
      logs={logs}
      filter={filter}
      fallbackUsed={fallbackUsed}
      matchingPoolSize={matchingPoolSize}
      onSelect={handleSelect}
      onNext={handleNext}
    />
  );
}
