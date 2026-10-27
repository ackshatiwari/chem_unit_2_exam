import { applySublabelResult } from "./mastery";
import type { Generator, Question } from "./question";
import { scheduleRetry, takeDue, takeEarliest, type Pending } from "./requeue";
import type { Rng } from "./rng";
import type { SublabelProgress } from "./storage";

export type SessionLength = 10 | 20 | 30 | "mastery";

/** Safety stop for "Until mastered". */
export const MASTERY_CAP = 400;

/**
 * A missed question comes back at most this many times. Without a cap, a run of
 * misses would keep re-queueing and new questions would never get a turn.
 */
export const MAX_RETURNS = 2;

export type Levels = Record<string, SublabelProgress>;

export interface SessionResult {
  question: Question;
  input: string;
  correct: boolean;
  isRetry: boolean;
}

export interface SessionState {
  sublabelIds: string[];
  length: SessionLength;
  /** Index of the current question (0-based, counts retries). */
  index: number;
  /** New (non-retry) questions served so far. */
  served: number;
  /** Smooth weighted round-robin counters. */
  wrr: Record<string, number>;
  retry: Pending<Question>[];
  /** How many times each question id has been re-queued. */
  returns: Record<string, number>;
  current: { question: Question; isRetry: boolean } | null;
  recentIds: string[];
  results: SessionResult[];
  startLevels: Levels;
  done: boolean;
}

const levelOf = (levels: Levels, id: string) => levels[id]?.level ?? 1;

/** Lower star levels get more questions: Beginner 4, Familiar 3, Proficient 2, Mastery 1. */
export function weightFor(level: number): number {
  return 5 - level;
}

/**
 * Smooth weighted round-robin (the nginx algorithm). With equal weights this is
 * a plain round-robin; with unequal weights picks stay evenly interleaved.
 */
export function pickSublabel(
  wrr: Record<string, number>,
  ids: string[],
  levels: Levels,
): { id: string; wrr: Record<string, number> } {
  const next = { ...wrr };
  let total = 0;
  let best = ids[0];
  for (const id of ids) {
    const w = weightFor(levelOf(levels, id));
    total += w;
    next[id] = (next[id] ?? 0) + w;
    if (next[id] > next[best]) best = id;
  }
  next[best] -= total;
  return { id: best, wrr: next };
}

export function startSession(
  sublabelIds: string[],
  length: SessionLength,
  levels: Levels,
  generators: Record<string, Generator>,
  rng: Rng,
): SessionState {
  const state: SessionState = {
    sublabelIds: [...sublabelIds],
    length,
    index: -1,
    served: 0,
    wrr: {},
    retry: [],
    returns: {},
    current: null,
    recentIds: [],
    results: [],
    startLevels: Object.fromEntries(sublabelIds.map((id) => [id, levels[id] ?? { level: 1, streak: 0 }])),
    done: false,
  };
  return advanceSession(state, levels, generators, rng);
}

function wantsNew(state: SessionState, levels: Levels): boolean {
  if (state.length === "mastery") {
    return state.served < MASTERY_CAP && state.sublabelIds.some((id) => levelOf(levels, id) < 4);
  }
  return state.served < state.length;
}

export function advanceSession(
  state: SessionState,
  levels: Levels,
  generators: Record<string, Generator>,
  rng: Rng,
): SessionState {
  const index = state.index + 1;
  const base = { ...state, index };

  const due = takeDue(state.retry, index);
  if (due) return { ...base, retry: due.rest, current: { question: reshuffle(due.item, rng), isRetry: true } };

  if (wantsNew(state, levels)) {
    // "Until mastered" only asks about sublabels that aren't mastered yet.
    const pool =
      state.length === "mastery" ? state.sublabelIds.filter((id) => levelOf(levels, id) < 4) : state.sublabelIds;
    const { id, wrr } = pickSublabel(state.wrr, pool, levels);
    const avoid = new Set([...state.recentIds, ...state.retry.map((p) => p.item.id)]);
    let q = generators[id](rng);
    for (let tries = 0; tries < 12 && avoid.has(q.id); tries++) q = generators[id](rng);
    return {
      ...base,
      wrr,
      served: state.served + 1,
      recentIds: [...state.recentIds, q.id].slice(-8),
      current: { question: q, isRetry: false },
    };
  }

  const earliest = takeEarliest(state.retry);
  if (earliest) {
    return { ...base, retry: earliest.rest, current: { question: reshuffle(earliest.item, rng), isRetry: true } };
  }
  return { ...base, current: null, done: true };
}

/** A returning multiple-choice question gets a fresh option order. */
function reshuffle(q: Question, rng: Rng): Question {
  if (q.format !== "mc" || !q.choices || q.choices[0] === "True") return q;
  return { ...q, choices: rng.shuffle(q.choices) };
}

export function answerSession(
  state: SessionState,
  levels: Levels,
  input: string,
  correct: boolean,
  rng: Rng,
): { state: SessionState; levels: Levels } {
  const cur = state.current;
  if (!cur) return { state, levels };
  const id = cur.question.sublabelId;
  const qid = cur.question.id;
  const requeue = !correct && (state.returns[qid] ?? 0) < MAX_RETURNS;
  return {
    state: {
      ...state,
      retry: requeue ? scheduleRetry(state.retry, cur.question, state.index, rng) : state.retry,
      returns: requeue ? { ...state.returns, [qid]: (state.returns[qid] ?? 0) + 1 } : state.returns,
      results: [...state.results, { question: cur.question, input, correct, isRetry: cur.isRetry }],
    },
    levels: { ...levels, [id]: applySublabelResult(levels[id], correct) },
  };
}

/** Score on first attempts only (retries don't count twice). */
export function sessionScore(state: SessionState): { correct: number; total: number } {
  const first = state.results.filter((r) => !r.isRetry);
  return { correct: first.filter((r) => r.correct).length, total: first.length };
}
