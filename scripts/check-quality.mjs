#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = resolve(__dirname, "../public/data/questions.json");

const pool = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
const questions = pool.questions;

function header(t) {
  console.log(`\n## ${t}`);
}

// 1. Same Japanese answer used by multiple English words → confusion risk
header("answer collisions (同じ和訳を複数の英単語が使用)");
{
  const byAnswer = new Map();
  for (const q of questions) {
    if (!byAnswer.has(q.answer)) byAnswer.set(q.answer, []);
    byAnswer.get(q.answer).push(q);
  }
  const dups = [...byAnswer.entries()].filter(([, qs]) => qs.length > 1);
  if (dups.length === 0) {
    console.log("  (none)");
  } else {
    for (const [ans, qs] of dups) {
      console.log(`  "${ans}": ${qs.map((q) => `${q.id}=${q.word}(${q.category}/${q.difficulty})`).join(", ")}`);
    }
  }
}

// 2. Choices grammatical form mismatch (e.g., answer is na-adj but choice is verb)
header("choice form mismatch (選択肢の品詞・活用形がばらつく)");
{
  function form(s) {
    if (s.endsWith("な")) return "na-adj";
    if (s.endsWith("い")) return "i-adj";
    if (s.endsWith("する")) return "verb-suru";
    if (s.endsWith("る")) return "verb-ru";
    if (s.endsWith("た")) return "ta-form";
    if (s.endsWith("の")) return "no-mod";
    return "other";
  }
  const flagged = [];
  for (const q of questions) {
    const ansForm = form(q.answer);
    if (ansForm === "other") continue;
    const offForms = q.choices.filter((c) => form(c) !== ansForm);
    if (offForms.length >= 2) {
      flagged.push({ q, ansForm, offForms });
    }
  }
  if (flagged.length === 0) {
    console.log("  (none)");
  } else {
    for (const { q, ansForm, offForms } of flagged) {
      console.log(
        `  ${q.id} ${q.word}: answer="${q.answer}"(${ansForm}), off=${offForms.map((c) => `"${c}"(${form(c)})`).join(", ")}`,
      );
    }
  }
}

// 3. Distractor shares substantial kanji set with answer (might be too close)
header("distractor 漢字が answer と完全包含関係 (区別しにくい疑い)");
{
  function kanjiSet(s) {
    return new Set([...s].filter((ch) => /[一-龯]/.test(ch)));
  }
  const flagged = [];
  for (const q of questions) {
    const ans = q.answer;
    const ansK = kanjiSet(ans);
    if (ansK.size < 2) continue;
    for (const c of q.choices) {
      if (c === ans) continue;
      const cK = kanjiSet(c);
      if (cK.size < 2) continue;
      const overlap = [...cK].filter((ch) => ansK.has(ch)).length;
      const minSize = Math.min(ansK.size, cK.size);
      // both kanji sets share all of smaller's kanji
      if (overlap === minSize) {
        flagged.push({ q, c });
      }
    }
  }
  if (flagged.length === 0) {
    console.log("  (none)");
  } else {
    for (const { q, c } of flagged) {
      console.log(`  ${q.id} ${q.word}: ans="${q.answer}" vs choice="${c}"`);
    }
  }
}

// 4. Same English word root appearing at multiple difficulties (e.g., "explain" / "explanation")
header("近い英単語が別の難易度に出現 (語根の重複)");
{
  function root(w) {
    return w
      .toLowerCase()
      .replace(/-/g, "")
      .replace(/(ing|ed|er|ly|ion|tion|sion|ness|ment|ity|ful|less|able|ible|al|ous|ive|ate)$/g, "");
  }
  const byRoot = new Map();
  for (const q of questions) {
    const r = root(q.word);
    if (r.length < 3) continue;
    if (!byRoot.has(r)) byRoot.set(r, []);
    byRoot.get(r).push(q);
  }
  const dups = [...byRoot.entries()].filter(([, qs]) => {
    if (qs.length < 2) return false;
    const diffs = new Set(qs.map((q) => q.difficulty));
    return diffs.size > 1; // different difficulty levels
  });
  if (dups.length === 0) {
    console.log("  (none)");
  } else {
    for (const [r, qs] of dups) {
      console.log(`  root="${r}": ${qs.map((q) => `${q.id}=${q.word}(${q.difficulty})`).join(", ")}`);
    }
  }
}

// 5. Suspect difficulty by word length (very crude heuristic)
header("難易度の長さ違和感 (beginner で 12文字超 / advanced で 4文字以下)");
{
  const flagged = [];
  for (const q of questions) {
    const len = q.word.replace(/[^a-z]/gi, "").length;
    if (q.difficulty === "beginner" && len > 12) {
      flagged.push({ q, reason: `beginner but ${len} letters` });
    }
    if (q.difficulty === "advanced" && len <= 4) {
      flagged.push({ q, reason: `advanced but ${len} letters` });
    }
  }
  if (flagged.length === 0) {
    console.log("  (none)");
  } else {
    for (const { q, reason } of flagged) {
      console.log(`  ${q.id} ${q.word}(${q.category}): ${reason}`);
    }
  }
}
