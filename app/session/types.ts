export type Phase = "loading" | "error" | "playing" | "feedback" | "result";

export type AnswerLog = {
  questionId: string;
  /** 4 択で選んだ選択肢。「わからない」回答時は "" (空文字列) */
  selected: string;
  /** 正誤。「わからない」は誤答扱いなので false */
  correct: boolean;
  /** Sprint 6: 「わからない」と回答した場合のみ true */
  skipped?: boolean;
};
