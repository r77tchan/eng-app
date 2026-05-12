/**
 * ユーザー設定の永続化レイヤ (LocalStorage)
 *
 * ## 設計
 * - LocalStorage に Settings を JSON 形式で保存する
 * - クラウド送信は一切行わない (ブラウザ内で完結)
 * - SSR (Next.js の静的書き出し時 prerender 含む) を考慮し、
 *   `window` / `localStorage` 未定義環境ではデフォルト値にフォールバックする
 *
 * ## ストレージスキーマ (バージョン 1)
 * key:   "commute-en:settings:v1"
 * value: JSON.stringify({ version: 1, settings: Settings })
 *
 * 将来のスキーマ変更時は version 番号を上げ、マイグレーションで対応する。
 */
import type { Category, Difficulty } from "./questions";

export type ThemeMode = "system" | "light" | "dark";

export type Settings = {
  /** テーマ: "system" はブラウザの prefers-color-scheme に追従 */
  theme: ThemeMode;
  /** 効果音 ON/OFF (正誤フィードバック音) */
  soundEnabled: boolean;
  /**
   * Sprint 7: 単語読み上げ ON/OFF (Web Speech API / TTS)
   *
   * 「効果音 (soundEnabled)」とは独立した別概念として扱う。
   * 既定値は true。既存ユーザー (このフィールドが LocalStorage に無い) も
   * 読み込み時に true で扱われ、後方互換を維持する。
   */
  speechEnabled: boolean;
  /** 既定カテゴリ (null = 未設定 = ホームから /start 経由) */
  defaultCategory: Category | null;
  /** 既定難易度 (null = 未設定 = ホームから /start 経由) */
  defaultDifficulty: Difficulty | null;
};

type StoredPayload = {
  version: number;
  settings: Settings;
};

export const SETTINGS_STORAGE_KEY = "commute-en:settings:v1";
const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  soundEnabled: true,
  speechEnabled: true,
  defaultCategory: null,
  defaultDifficulty: null,
};

const ALLOWED_THEMES = new Set<ThemeMode>(["system", "light", "dark"]);
const ALLOWED_CATEGORIES = new Set<Category>([
  "daily",
  "business",
  "travel",
  "exam",
]);
const ALLOWED_DIFFICULTIES = new Set<Difficulty>([
  "beginner",
  "intermediate",
  "advanced",
]);

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function sanitize(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS };
  const x = raw as Record<string, unknown>;
  const theme: ThemeMode =
    typeof x.theme === "string" && ALLOWED_THEMES.has(x.theme as ThemeMode)
      ? (x.theme as ThemeMode)
      : DEFAULT_SETTINGS.theme;
  const soundEnabled =
    typeof x.soundEnabled === "boolean"
      ? x.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled;
  // Sprint 7: 既存ペイロードに speechEnabled が無くてもエラーにせず既定値で扱う
  const speechEnabled =
    typeof x.speechEnabled === "boolean"
      ? x.speechEnabled
      : DEFAULT_SETTINGS.speechEnabled;
  const defaultCategory =
    typeof x.defaultCategory === "string" &&
    ALLOWED_CATEGORIES.has(x.defaultCategory as Category)
      ? (x.defaultCategory as Category)
      : null;
  const defaultDifficulty =
    typeof x.defaultDifficulty === "string" &&
    ALLOWED_DIFFICULTIES.has(x.defaultDifficulty as Difficulty)
      ? (x.defaultDifficulty as Difficulty)
      : null;
  return {
    theme,
    soundEnabled,
    speechEnabled,
    defaultCategory,
    defaultDifficulty,
  };
}

function readPayload(): StoredPayload {
  if (!isStorageAvailable()) {
    return { version: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS } };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { version: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS } };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "settings" in parsed
    ) {
      return {
        version: SCHEMA_VERSION,
        settings: sanitize((parsed as StoredPayload).settings),
      };
    }
    // 旧形式 (settings をそのまま入れていた場合) もサポート
    return { version: SCHEMA_VERSION, settings: sanitize(parsed) };
  } catch {
    return { version: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS } };
  }
}

function writePayload(settings: Settings): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, settings }),
    );
  } catch {
    // 容量超過などは握りつぶす
  }
}

/** 現在の設定値を取得 */
export function getSettings(): Settings {
  return readPayload().settings;
}

/** 設定の一部を更新する (浅いマージ) */
export function updateSettings(patch: Partial<Settings>): void {
  const current = readPayload().settings;
  const next: Settings = { ...current, ...patch };
  writePayload(next);
  invalidateSnapshot();
  notifyListeners();
}

/**
 * 全設定を初期値に戻す (Sprint 5: データリセット機能で使う)
 */
export function clearSettings(): void {
  writePayload({ ...DEFAULT_SETTINGS });
  invalidateSnapshot();
  notifyListeners();
}

// ---------------------------------------------------------------------------
// useSyncExternalStore 用の購読 API
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedSnapshot: Settings | null = null;
const SERVER_SNAPSHOT: Settings = { ...DEFAULT_SETTINGS };

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

function notifyListeners(): void {
  for (const l of listeners) l();
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      invalidateSnapshot();
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getSettingsSnapshot(): Settings {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  if (cachedSnapshot === null) {
    cachedSnapshot = readPayload().settings;
  }
  return cachedSnapshot;
}

export function getSettingsServerSnapshot(): Settings {
  return SERVER_SNAPSHOT;
}
