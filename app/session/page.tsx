"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadQuestionPool,
  pickSessionQuestions,
  shuffle,
  type Question,
} from "@/lib/questions";
import { LoadingView } from "./_components/LoadingView";
import { ErrorView } from "./_components/ErrorView";
import { PlayingView } from "./_components/PlayingView";
import { ResultView } from "./_components/ResultView";
import type { AnswerLog, Phase } from "./types";

const SESSION_SIZE = 5;

export default function SessionPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setErrorMessage("");
    setCurrentIndex(0);
    setLogs([]);
    setSelected(null);

    loadQuestionPool()
      .then((pool) => {
        if (cancelled) return;
        const picked = pickSessionQuestions(pool.questions, SESSION_SIZE);
        if (picked.length < SESSION_SIZE) {
          setErrorMessage(
            `問題プールが不足しています (必要: ${SESSION_SIZE}問 / 実際: ${picked.length}問)`,
          );
          setPhase("error");
          return;
        }
        setQuestions(picked);
        setShuffledChoices(picked.map((q) => shuffle(q.choices)));
        setPhase("playing");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "問題の読み込みに失敗しました";
        setErrorMessage(msg);
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

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

  const handleRestart = useCallback(() => {
    setSessionKey((k) => k + 1);
  }, []);

  if (phase === "loading") return <LoadingView />;
  if (phase === "error") return <ErrorView message={errorMessage} />;
  if (phase === "result") {
    return (
      <ResultView
        logs={logs}
        total={questions.length}
        onRestart={handleRestart}
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
      onSelect={handleSelect}
      onNext={handleNext}
    />
  );
}
