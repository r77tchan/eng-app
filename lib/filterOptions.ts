/**
 * カテゴリ・難易度の選択肢メタデータ (UI 表示用)。
 *
 * 「すべて」を `null` 値として扱うため、UI 側はこの配列を順に並べるだけで
 * `[すべて, 日常会話, ビジネス, 旅行, 試験対策]` (= 5 件) のような選択肢が得られる。
 * 契約条件: 「すべて」を含む少なくとも 4 件のカテゴリ / 4 件の難易度。
 */
import type { Category, Difficulty } from "./questions";

export type CategoryOption = {
  value: Category | null;
  label: string;
  /** 駅看板トーンの短い見出し (mono 用) */
  short: string;
  /** 補足: ユーザーが何を学べるか */
  hint: string;
};

export type DifficultyOption = {
  value: Difficulty | null;
  label: string;
  short: string;
  hint: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: null,
    label: "すべて",
    short: "All",
    hint: "全カテゴリから出題",
  },
  {
    value: "daily",
    label: "日常会話",
    short: "Daily",
    hint: "毎日の暮らしの語彙",
  },
  {
    value: "business",
    label: "ビジネス",
    short: "Biz",
    hint: "仕事・会議で使う語彙",
  },
  {
    value: "travel",
    label: "旅行",
    short: "Travel",
    hint: "出張・観光で使う語彙",
  },
  {
    value: "exam",
    label: "試験対策",
    short: "Exam",
    hint: "資格・受験で頻出の語彙",
  },
];

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: null,
    label: "すべて",
    short: "All",
    hint: "全難易度から出題",
  },
  {
    value: "beginner",
    label: "初級",
    short: "Lv.1",
    hint: "中学レベルの基本語",
  },
  {
    value: "intermediate",
    label: "中級",
    short: "Lv.2",
    hint: "高校〜社会人で使う語",
  },
  {
    value: "advanced",
    label: "上級",
    short: "Lv.3",
    hint: "資格試験・抽象語彙",
  },
];
