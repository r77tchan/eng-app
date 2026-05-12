"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { cancelSpeech, speakWord } from "@/lib/speech";
import { useSpeechSupported } from "@/lib/useSpeechSupported";
import { getSettings } from "@/lib/settings";
import { LoadingView } from "./LoadingView";
import { ErrorView } from "./ErrorView";
import { PlayingView } from "./PlayingView";
import { ResultView } from "./ResultView";
import { AbortConfirmDialog } from "./AbortConfirmDialog";
import { useSessionKeybindings } from "./useSessionKeybindings";
import type { AnswerLog, Phase } from "../types";

const SESSION_SIZE = 5;

type Props = {
  onRestart: () => void;
};

/**
 * 1 セッション分の状態を持ち、ライフサイクル全体を司るコンポーネント。
 *
 * Sprint 6:
 * - 「わからない」回答ハンドラ `handleSkip` を追加
 * - セッション中断ハンドラ `handleAbort` と確認モーダル状態 `abortDialogOpen` を追加
 */
export function SessionRunner({ onRestart }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [reviewIdsAtStart, setReviewIdsAtStart] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [filter, setFilter] = useState<SessionFilter>({
    category: null,
    difficulty: null,
  });
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [matchingPoolSize, setMatchingPoolSize] = useState(0);
  const [abortDialogOpen, setAbortDialogOpen] = useState(false);
  // Sprint 7: Web Speech API 対応判定。useSyncExternalStore ベースの
  // フックで SSR では false、マウント後に実値を返す。
  const speechSupported = useSpeechSupported();

  useEffect(() => {
    let cancelled = false;
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

  /**
   * Sprint 7: 問題切り替わり時の自動発話。
   *
   * - `phase === "playing"` かつ `currentQuestion.id` が変わった瞬間にのみ発話する
   * - フィードバック表示中 (phase === "feedback") には発話しない
   *   → 「次へ」で playing に戻った時に再び id 変化として検知される
   * - 設定 OFF (speechEnabled=false) の場合は speakWord 側で何もしない
   * - `useEffect` body 内で state 更新はしないので React 19 ルールに準拠
   * - アンマウント / 切り替え時は cancelSpeech() で前の発話を停止 (メモリリーク防止)
   */
  const currentQuestionId = currentQuestion?.id;
  useEffect(() => {
    if (phase !== "playing") return;
    if (!currentQuestionId) return;
    const { speechEnabled } = getSettings();
    speakWord(currentQuestion?.word, speechEnabled);
    return () => {
      cancelSpeech();
    };
    // currentQuestion?.word は currentQuestionId と一対一対応 (id 変化時のみ更新)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestionId]);

  /**
   * Sprint 7: 再生ボタンを押下したときの再生ハンドラ。
   * 設定 OFF の時は speakWord 側で何もしない (= 音は鳴らない)。
   */
  const handleSpeak = useCallback(() => {
    if (!currentQuestion) return;
    const { speechEnabled } = getSettings();
    speakWord(currentQuestion.word, speechEnabled);
  }, [currentQuestion]);

  const handleSelect = useCallback(
    (choice: string) => {
      if (phase !== "playing" || !currentQuestion) return;
      const correct = choice === currentQuestion.answer;
      setSelected(choice);
      setSkipped(false);
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
      const { soundEnabled } = getSettings();
      playFeedbackSound(correct, soundEnabled);
      setPhase("feedback");
    },
    [phase, currentQuestion],
  );

  /**
   * Sprint 6: 「わからない」回答ハンドラ。
   *
   * - 誤答扱い (correct=false) で履歴に追加するが、skipped=true で区別する
   * - 復習キューには追加する (誤答と同じ扱い)
   * - 既に復習キューに居る問題は除外しない (誤答と同じ)
   * - 効果音は誤答音を鳴らす (誤答扱いのため)
   */
  const handleSkip = useCallback(() => {
    if (phase !== "playing" || !currentQuestion) return;
    setSelected(null);
    setSkipped(true);
    setLogs((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selected: "",
        correct: false,
        skipped: true,
      },
    ]);
    appendAnswerLog({
      questionId: currentQuestion.id,
      selected: "",
      correct: false,
      skipped: true,
    });
    addToReviewQueue(currentQuestion.id);
    const { soundEnabled } = getSettings();
    playFeedbackSound(false, soundEnabled);
    setPhase("feedback");
  }, [phase, currentQuestion]);

  const handleNext = useCallback(() => {
    if (phase !== "feedback") return;
    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      setPhase("result");
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setSkipped(false);
    setPhase("playing");
  }, [phase, currentIndex, questions.length]);

  // Sprint 6: 中断ボタン → 確認モーダル → 確定でホーム遷移
  const handleAbortRequest = useCallback(() => {
    setAbortDialogOpen(true);
  }, []);
  const handleAbortCancel = useCallback(() => {
    setAbortDialogOpen(false);
  }, []);
  const handleAbortConfirm = useCallback(() => {
    setAbortDialogOpen(false);
    // Sprint 7: 中断時は進行中の発話を止めてから遷移
    cancelSpeech();
    router.push("/");
  }, [router]);

  // Sprint 7: コンポーネントアンマウント時に発話を確実に止める (メモリリーク防止)
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  // Sprint 8 拡張: 結果画面で Escape を押したときの「ホームに戻る」ハンドラ。
  // Restart は onRestart prop が既にあるのでそのまま渡す。
  const handleResultExit = useCallback(() => {
    cancelSpeech();
    router.push("/");
  }, [router]);

  // Sprint 8: PC キーボード操作
  // - 1〜4 で選択肢、Enter で次へ、Space で「わからない」、Escape で中断
  // - 詳細な発火条件は `useSessionKeybindings` 側に局所化
  // - Sprint 8 拡張: 結果画面では Enter=Restart, Escape=ホーム遷移
  useSessionKeybindings({
    phase,
    abortDialogOpen,
    choices: currentChoices,
    onSelect: handleSelect,
    onNext: handleNext,
    onSkip: handleSkip,
    onAbortRequest: handleAbortRequest,
    onAbortCancel: handleAbortCancel,
    onRestart,
    onResultExit: handleResultExit,
  });

  const reviewDelta = useMemo(
    () => calcReviewDelta(logs, reviewIdsAtStart),
    [logs, reviewIdsAtStart],
  );

  const skippedCount = useMemo(
    () => logs.filter((l) => l.skipped).length,
    [logs],
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
        skippedCount={skippedCount}
        onRestart={onRestart}
      />
    );
  }

  return (
    <>
      <PlayingView
        questions={questions}
        currentIndex={currentIndex}
        currentChoices={currentChoices}
        currentQuestion={currentQuestion!}
        isFeedback={phase === "feedback"}
        selected={selected}
        isSkipped={skipped}
        logs={logs}
        filter={filter}
        fallbackUsed={fallbackUsed}
        matchingPoolSize={matchingPoolSize}
        speechSupported={speechSupported}
        onSelect={handleSelect}
        onSkip={handleSkip}
        onAbort={handleAbortRequest}
        onNext={handleNext}
        onSpeak={handleSpeak}
      />
      {abortDialogOpen && (
        <AbortConfirmDialog
          onConfirm={handleAbortConfirm}
          onCancel={handleAbortCancel}
        />
      )}
    </>
  );
}
