import { ION_BY_KEY, type Ion } from "@/data/polyatomic";
import type { AnswerKind } from "./check";
import { applyIonResult } from "./mastery";
import { scheduleRetry, takeDue, takeEarliest, type Pending } from "./requeue";
import type { Rng } from "./rng";
import { MAX_RETURNS } from "./session";
import type { Direction, DirectionMode, Level } from "./storage";

export type IonLevels = Record<Direction, Record<string, Level>>;

export interface DrillItem {
  key: string;
  dir: Direction;
}

export interface DrillQuestion extends DrillItem {
  /** Name (n2f) or plain-text formula (f2n). */
  prompt: string;
  answer: string;
  accepted: string[];
  kind: AnswerKind;
}

export interface DrillResult extends DrillItem {
  input: string;
  correct: boolean;
  retry: boolean;
}

export interface DrillState {
  keys: string[];
  mode: DirectionMode;
  /** Review pass: every ion once, used when the selection is already mastered. */
  review: boolean;
  reviewQueue: DrillItem[];
  retry: Pending<DrillItem>[];
  /** Re-queue count per "dir|key", capped so a run of misses can't crowd out everything else. */
  returns: Record<string, number>;
  /** Index of the current question (0-based). */
  index: number;
  current: (DrillItem & { isRetry: boolean }) | null;
  recent: string[];
  results: DrillResult[];
  done: boolean;
}

export function directionsFor(mode: DirectionMode): Direction[] {
  return mode === "mixed" ? ["n2f", "f2n"] : [mode];
}

export function levelOf(levels: IonLevels, item: DrillItem): Level {
  return levels[item.dir][item.key] ?? 1;
}

export function allPairs(keys: string[], mode: DirectionMode): DrillItem[] {
  const dirs = directionsFor(mode);
  return keys.flatMap((key) => dirs.map((dir) => ({ key, dir })));
}

/** Share of (ion, direction) pairs at Mastery. */
export function masteredFraction(keys: string[], mode: DirectionMode, levels: IonLevels): number {
  const pairs = allPairs(keys, mode);
  if (pairs.length === 0) return 0;
  return pairs.filter((p) => levelOf(levels, p) === 4).length / pairs.length;
}

export type SetStatus = "Not started" | "In progress" | "Done";

export function setStatus(keys: string[], mode: DirectionMode, levels: IonLevels): SetStatus {
  const pairs = allPairs(keys, mode);
  if (pairs.every((p) => levelOf(levels, p) === 4)) return "Done";
  if (pairs.some((p) => levels[p.dir][p.key] !== undefined)) return "In progress";
  return "Not started";
}

export function buildQuestion(item: DrillItem): DrillQuestion {
  const ion = ION_BY_KEY.get(item.key) as Ion;
  if (item.dir === "n2f") {
    return { ...item, prompt: ion.name, answer: item.key, accepted: [item.key], kind: "formula" };
  }
  return { ...item, prompt: item.key, answer: ion.name, accepted: [ion.name, ...(ion.alt ?? [])], kind: "name" };
}

export function startDrill(keys: string[], mode: DirectionMode, levels: IonLevels, rng: Rng): DrillState {
  const unique = [...new Set(keys)];
  const pairs = allPairs(unique, mode);
  const review = pairs.every((p) => levelOf(levels, p) === 4);
  // A review pass asks each ion once; in Mixed mode each ion gets a random direction.
  const reviewQueue = review
    ? rng.shuffle(unique).map((key) => ({ key, dir: rng.pick(directionsFor(mode)) }))
    : [];
  const state: DrillState = {
    keys: unique,
    mode,
    review,
    reviewQueue,
    retry: [],
    returns: {},
    index: -1,
    current: null,
    recent: [],
    results: [],
    done: false,
  };
  return advance(state, levels, rng);
}

/** Move to the next question (or mark the drill done). */
export function advance(state: DrillState, levels: IonLevels, rng: Rng): DrillState {
  const index = state.index + 1;
  const base = { ...state, index };

  const due = takeDue(state.retry, index);
  if (due) return serve(base, due.item, true, due.rest);

  if (state.review) {
    const [head, ...rest] = state.reviewQueue;
    if (head) return serve({ ...base, reviewQueue: rest }, head, false, state.retry);
  } else {
    const pending = new Set(state.retry.map((p) => `${p.item.dir}|${p.item.key}`));
    const open = allPairs(state.keys, state.mode).filter(
      (p) => levelOf(levels, p) < 4 && !pending.has(`${p.dir}|${p.key}`),
    );
    // Avoid repeating the last few ions when there is anything else to ask.
    const window = Math.min(3, Math.max(0, new Set(open.map((p) => p.key)).size - 1));
    const recent = new Set(state.recent.slice(-window));
    const fresh = open.filter((p) => !recent.has(p.key));
    const pool = fresh.length > 0 ? fresh : open;
    if (pool.length > 0) return serve(base, weightedPick(pool, levels, rng), false, state.retry);
  }

  // Nothing new left: finish any misses still waiting, then stop.
  const earliest = takeEarliest(state.retry);
  if (earliest) return serve(base, earliest.item, true, earliest.rest);
  return { ...base, current: null, done: true };
}

function serve(state: DrillState, item: DrillItem, isRetry: boolean, retry: Pending<DrillItem>[]): DrillState {
  return { ...state, current: { ...item, isRetry }, retry, recent: [...state.recent, item.key].slice(-5) };
}

/** Lower levels come up more often: weight 4 for Beginner down to 1 for Proficient. */
function weightedPick(pool: DrillItem[], levels: IonLevels, rng: Rng): DrillItem {
  const weights = pool.map((p) => 5 - levelOf(levels, p));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Record an answer to the current question. Returns the new drill state and the
 * updated levels (one up for correct, one down for a miss). A miss comes back
 * 2–4 questions later.
 */
export function answerDrill(
  state: DrillState,
  levels: IonLevels,
  input: string,
  correct: boolean,
  rng: Rng,
): { state: DrillState; levels: IonLevels } {
  const cur = state.current;
  if (!cur) return { state, levels };
  const item = { key: cur.key, dir: cur.dir };
  const rid = `${cur.dir}|${cur.key}`;
  // Still unmastered after MAX_RETURNS comebacks? It stays in the normal pool instead.
  const requeue = !correct && (state.returns[rid] ?? 0) < MAX_RETURNS;
  const nextLevels: IonLevels = {
    ...levels,
    [cur.dir]: { ...levels[cur.dir], [cur.key]: applyIonResult(levels[cur.dir][cur.key], correct) },
  };
  return {
    state: {
      ...state,
      retry: requeue ? scheduleRetry(state.retry, item, state.index, rng) : state.retry,
      returns: requeue ? { ...state.returns, [rid]: (state.returns[rid] ?? 0) + 1 } : state.returns,
      results: [...state.results, { ...item, input, correct, retry: cur.isRetry }],
    },
    levels: nextLevels,
  };
}
