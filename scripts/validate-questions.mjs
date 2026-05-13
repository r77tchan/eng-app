#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, "../public/data/questions.json");

const ALLOWED_CATEGORIES = ["daily", "business", "travel", "exam"];
const ALLOWED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function validate(filePath) {
  const raw = readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { errors: [`JSON parse error: ${e.message}`], warnings: [], stats: null };
  }

  const errors = [];
  const warnings = [];

  if (typeof parsed !== "object" || parsed === null) {
    errors.push("root must be an object");
    return { errors, warnings, stats: null };
  }
  if (typeof parsed.version !== "number") {
    errors.push("version must be a number");
  }
  if (!Array.isArray(parsed.questions)) {
    errors.push("questions must be an array");
    return { errors, warnings, stats: null };
  }

  const seenIds = new Map();
  const seenWords = new Map();
  const buckets = new Map();

  parsed.questions.forEach((q, idx) => {
    const ref = `[${idx}]${q && q.id ? ` id=${q.id}` : ""}`;

    if (!q || typeof q !== "object") {
      errors.push(`${ref}: not an object`);
      return;
    }
    if (typeof q.id !== "string" || !q.id) {
      errors.push(`${ref}: id must be a non-empty string`);
    } else if (seenIds.has(q.id)) {
      errors.push(`${ref}: duplicate id (first seen at index ${seenIds.get(q.id)})`);
    } else {
      seenIds.set(q.id, idx);
    }

    if (typeof q.word !== "string" || !q.word) {
      errors.push(`${ref}: word must be a non-empty string`);
    } else {
      const key = q.word.toLowerCase();
      if (seenWords.has(key)) {
        warnings.push(
          `${ref}: duplicate word "${q.word}" (first seen at index ${seenWords.get(key)})`,
        );
      } else {
        seenWords.set(key, idx);
      }
    }

    if (typeof q.answer !== "string" || !q.answer) {
      errors.push(`${ref}: answer must be a non-empty string`);
    }

    if (!Array.isArray(q.choices)) {
      errors.push(`${ref}: choices must be an array`);
    } else {
      if (q.choices.length !== 4) {
        errors.push(`${ref}: choices must have exactly 4 items (got ${q.choices.length})`);
      }
      if (!q.choices.every((c) => typeof c === "string" && c.length > 0)) {
        errors.push(`${ref}: choices must all be non-empty strings`);
      } else {
        const unique = new Set(q.choices);
        if (unique.size !== q.choices.length) {
          errors.push(`${ref}: choices must be unique`);
        }
        if (typeof q.answer === "string" && !q.choices.includes(q.answer)) {
          errors.push(`${ref}: answer "${q.answer}" not in choices`);
        }
      }
    }

    if (!ALLOWED_CATEGORIES.includes(q.category)) {
      errors.push(
        `${ref}: category must be one of ${ALLOWED_CATEGORIES.join("|")} (got ${q.category})`,
      );
    }
    if (!ALLOWED_DIFFICULTIES.includes(q.difficulty)) {
      errors.push(
        `${ref}: difficulty must be one of ${ALLOWED_DIFFICULTIES.join("|")} (got ${q.difficulty})`,
      );
    }

    if (
      ALLOWED_CATEGORIES.includes(q.category) &&
      ALLOWED_DIFFICULTIES.includes(q.difficulty)
    ) {
      const k = `${q.category}/${q.difficulty}`;
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
  });

  const stats = {
    total: parsed.questions.length,
    buckets: Object.fromEntries(
      [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)),
    ),
  };

  return { errors, warnings, stats };
}

const target = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_PATH;
const { errors, warnings, stats } = validate(target);

console.log(`# validate-questions: ${target}`);
if (stats) {
  console.log(`\ntotal: ${stats.total}`);
  console.log("buckets:");
  for (const [k, v] of Object.entries(stats.buckets)) {
    console.log(`  ${k}: ${v}`);
  }
}
if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\nerrors (${errors.length}):`);
  for (const e of errors) console.log(`  x ${e}`);
  process.exit(1);
}
console.log("\nOK");
