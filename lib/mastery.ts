import type { Level, SublabelProgress } from "./storage";

export const LEVEL_NAMES: Record<Level, string> = {
  1: "Beginner",
  2: "Familiar",
  3: "Proficient",
  4: "Mastery",
};

export const STREAK_TO_LEVEL_UP = 3;

export const START: SublabelProgress = { level: 1, streak: 0 };

function up(level: Level): Level {
  return Math.min(4, level + 1) as Level;
}

function down(level: Level): Level {
  return Math.max(1, level - 1) as Level;
}

/**
 * Sublabels (tiles): 3 correct in a row at the current level moves up one level
 * and starts a new streak. A miss drops one level (never below Beginner) and
 * resets the streak.
 */
export function applySublabelResult(p: SublabelProgress | undefined, correct: boolean): SublabelProgress {
  const cur = p ?? START;
  if (!correct) return { level: down(cur.level), streak: 0 };
  if (cur.level === 4) return { level: 4, streak: 0 };
  const streak = cur.streak + 1;
  if (streak >= STREAK_TO_LEVEL_UP) return { level: up(cur.level), streak: 0 };
  return { level: cur.level, streak };
}

/** Ions (polyatomic page): one correct moves up a level, a miss drops one. */
export function applyIonResult(level: Level | undefined, correct: boolean): Level {
  const cur = level ?? 1;
  return correct ? up(cur) : down(cur);
}
