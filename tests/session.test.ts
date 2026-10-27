import { describe, expect, it } from "vitest";
import type { Generator } from "@/lib/question";
import { typed } from "@/lib/question";
import { createRng } from "@/lib/rng";
import {
  advanceSession,
  answerSession,
  MASTERY_CAP,
  MAX_RETURNS,
  pickSublabel,
  sessionScore,
  startSession,
  type Levels,
  type SessionState,
} from "@/lib/session";

/** Fake generators: each question id is unique so dedupe never interferes. */
function fakeGens(ids: string[]): Record<string, Generator> {
  let n = 0;
  return Object.fromEntries(
    ids.map((id) => [id, () => typed(id, String(n++), `q${n}`, "integer", "1", "because")]),
  );
}

function run(
  ids: string[],
  length: SessionState["length"],
  answer: (s: SessionState) => boolean,
  levels: Levels = {},
  seed = 1,
) {
  const rng = createRng(seed);
  const gens = fakeGens(ids);
  let lv = levels;
  let s = startSession(ids, length, lv, gens, rng);
  let guard = 0;
  while (!s.done && guard++ < 2000) {
    const r = answerSession(s, lv, "", answer(s), rng);
    lv = r.levels;
    s = advanceSession(r.state, lv, gens, rng);
  }
  return { s, lv };
}

describe("sublabel picking", () => {
  it("is a plain round-robin when levels are equal", () => {
    const ids = ["X1", "X2", "X3"];
    let wrr = {};
    const picks: string[] = [];
    for (let i = 0; i < 9; i++) {
      const r = pickSublabel(wrr, ids, {});
      wrr = r.wrr;
      picks.push(r.id);
    }
    expect(picks).toEqual(["X1", "X2", "X3", "X1", "X2", "X3", "X1", "X2", "X3"]);
  });

  it("weights lower star levels more heavily", () => {
    const ids = ["LOW", "HIGH"];
    const levels: Levels = { LOW: { level: 1, streak: 0 }, HIGH: { level: 4, streak: 0 } };
    let wrr = {};
    const counts: Record<string, number> = { LOW: 0, HIGH: 0 };
    for (let i = 0; i < 50; i++) {
      const r = pickSublabel(wrr, ids, levels);
      wrr = r.wrr;
      counts[r.id]++;
    }
    // weights 4 : 1
    expect(counts).toEqual({ LOW: 40, HIGH: 10 });
  });
});

describe("session engine", () => {
  it("asks exactly N new questions when all are right", () => {
    for (const n of [10, 20, 30] as const) {
      const { s } = run(["X1", "X2"], n, () => true);
      expect(s.results).toHaveLength(n);
      expect(sessionScore(s)).toEqual({ correct: n, total: n });
    }
  });

  it("spreads questions evenly across sublabels at equal levels", () => {
    const { s } = run(["X1", "X2", "X3"], 30, () => true);
    const per = (id: string) => s.results.filter((r) => r.question.sublabelId === id).length;
    // Levels rise during the run, so allow a little drift from a perfect 10/10/10.
    for (const id of ["X1", "X2", "X3"]) expect(per(id)).toBeGreaterThanOrEqual(8);
  });

  it("re-asks a missed question 2–4 questions later, and still finishes", () => {
    for (let seed = 0; seed < 40; seed++) {
      let first = true;
      const { s } = run(
        ["X1", "X2"],
        10,
        () => {
          const miss = first;
          first = false;
          return !miss;
        },
        {},
        seed,
      );
      const missed = s.results[0].question.id;
      const back = s.results.findIndex((r, i) => i > 0 && r.question.id === missed);
      expect(back).toBeGreaterThanOrEqual(2);
      expect(back).toBeLessThanOrEqual(4);
      expect(s.results[back].isRetry).toBe(true);
      expect(s.results).toHaveLength(11);
      expect(sessionScore(s)).toEqual({ correct: 9, total: 10 });
    }
  });

  it("serves leftover retries before ending", () => {
    // Miss the last new question: it must still come back.
    const { s } = run(["X1"], 10, (st) => st.served !== 10 || st.current!.isRetry);
    expect(s.results).toHaveLength(11);
    expect(s.results[10].isRetry).toBe(true);
  });

  it("'Until mastered' stops once every sublabel reaches Mastery", () => {
    const { s, lv } = run(["X1", "X2"], "mastery", () => true);
    expect(lv.X1.level).toBe(4);
    expect(lv.X2.level).toBe(4);
    // 3 correct per level-up × 3 level-ups × 2 sublabels
    expect(s.results).toHaveLength(18);
  });

  it("finishes even when every answer is wrong (each miss returns at most twice)", () => {
    const { s } = run(["X1", "X2"], 10, () => false);
    expect(s.done).toBe(true);
    expect(s.served).toBe(10);
    expect(s.results).toHaveLength(10 * (1 + MAX_RETURNS));
  });

  it("'Until mastered' has a safety cap", () => {
    const { s } = run(["X1"], "mastery", () => false);
    expect(s.served).toBe(MASTERY_CAP);
  });

  it("updates sublabel levels with the streak rules", () => {
    const { lv } = run(["X1"], 10, () => true);
    // 10 correct: 1→2 (3), 2→3 (6), 3→4 (9), then Mastery
    expect(lv.X1).toEqual({ level: 4, streak: 0 });
  });
});
