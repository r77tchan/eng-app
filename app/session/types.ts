export type Phase = "loading" | "error" | "playing" | "feedback" | "result";

export type AnswerLog = {
  questionId: string;
  selected: string;
  correct: boolean;
};
