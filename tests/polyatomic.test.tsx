import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Formula } from "@/components/Formula";
import { ALL_IONS, ION_SETS, ionKey } from "@/data/polyatomic";
import { checkAnswer } from "@/lib/check";
import { chargeLabel, parseFormula, validateFormula } from "@/lib/formula";
import { advance, answerDrill, buildQuestion, masteredFraction, setStatus, startDrill, type IonLevels } from "@/lib/drill";
import { createRng } from "@/lib/rng";

const set = (id: string) => ION_SETS.find((s) => s.id === id)!;

describe("polyatomic data", () => {
  it("has exactly 1 / 25 / 10 / 4 ions per set, 40 total", () => {
    expect(set("ox1p").ions).toHaveLength(1);
    expect(set("ox1m").ions).toHaveLength(25);
    expect(set("ox2m").ions).toHaveLength(10);
    expect(set("ox3m").ions).toHaveLength(4);
    expect(ALL_IONS).toHaveLength(40);
    expect(set("all").ions).toHaveLength(40);
  });

  it("charges match their set", () => {
    expect(set("ox1p").ions.every((i) => i.charge === 1)).toBe(true);
    expect(set("ox1m").ions.every((i) => i.charge === -1)).toBe(true);
    expect(set("ox2m").ions.every((i) => i.charge === -2)).toBe(true);
    expect(set("ox3m").ions.every((i) => i.charge === -3)).toBe(true);
  });

  it("formulas and names are unique", () => {
    expect(new Set(ALL_IONS.map(ionKey)).size).toBe(40);
    expect(new Set(ALL_IONS.map((i) => i.name)).size).toBe(40);
  });

  it.each(ALL_IONS.map((i) => [ionKey(i), i] as const))("%s parses and renders with <Formula>", (key, ion) => {
    expect(validateFormula(key)).toEqual([]);
    const parsed = parseFormula(key);
    expect(parsed.charge).toBe(ion.charge);
    expect(parsed.body).toBe(ion.formula);
    const html = renderToStaticMarkup(<Formula text={key} />);
    expect(html).toContain(`<sup>${chargeLabel(ion.charge)}</sup>`);
    // Every digit in the formula body is a subscript.
    const subs = parsed.tokens.filter((t) => t.kind === "sub").map((t) => t.value).join("");
    expect(subs).toBe(ion.formula.replace(/\D/g, ""));
  });

  it("each ion's own answers pass the checker in both directions", () => {
    for (const ion of ALL_IONS) {
      for (const dir of ["n2f", "f2n"] as const) {
        const q = buildQuestion({ key: ionKey(ion), dir });
        expect(checkAnswer(q.answer, q.kind, q.accepted).correct).toBe(true);
      }
    }
    const hco3 = buildQuestion({ key: "HCO3 -", dir: "f2n" });
    expect(checkAnswer("bicarbonate", hco3.kind, hco3.accepted).correct).toBe(true);
    const no3 = buildQuestion({ key: "NO3 -", dir: "n2f" });
    expect(checkAnswer("NO3 1-", no3.kind, no3.accepted).correct).toBe(true);
  });
});

const empty = (): IonLevels => ({ n2f: {}, f2n: {} });

describe("drill engine", () => {
  const keys = set("ox3m").ions.map(ionKey);

  it("ends once every ion reaches Mastery when always correct", () => {
    const rng = createRng(1);
    let levels = empty();
    let s = startDrill(keys, "n2f", levels, rng);
    let guard = 0;
    while (!s.done && guard++ < 100) {
      const r = answerDrill(s, levels, "", true, rng);
      levels = r.levels;
      s = advance(r.state, levels, rng);
    }
    expect(s.done).toBe(true);
    // 4 ions × 3 level-ups each
    expect(s.results).toHaveLength(12);
    expect(masteredFraction(keys, "n2f", levels)).toBe(1);
    expect(setStatus(keys, "n2f", levels)).toBe("Done");
    expect(setStatus(keys, "f2n", levels)).toBe("Not started");
  });

  it("brings a missed ion back 2–4 questions later", () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRng(seed);
      let levels = empty();
      let s = startDrill(set("ox1m").ions.map(ionKey), "f2n", levels, rng);
      const missed = s.current!.key;
      let r = answerDrill(s, levels, "wrong", false, rng);
      levels = r.levels;
      s = advance(r.state, levels, rng);
      let gap = 1;
      while (s.current!.key !== missed) {
        r = answerDrill(s, levels, "", true, rng);
        levels = r.levels;
        s = advance(r.state, levels, rng);
        gap++;
      }
      expect(gap).toBeGreaterThanOrEqual(2);
      expect(gap).toBeLessThanOrEqual(4);
      expect(s.current!.isRetry).toBe(true);
    }
  });

  it("tracks levels separately per direction and Mixed updates the asked direction", () => {
    const rng = createRng(7);
    let levels = empty();
    let s = startDrill(keys, "mixed", levels, rng);
    for (let i = 0; i < 10; i++) {
      const cur = s.current!;
      const before = levels[cur.dir][cur.key] ?? 1;
      const other = cur.dir === "n2f" ? "f2n" : "n2f";
      const otherBefore = levels[other][cur.key];
      const r = answerDrill(s, levels, "", true, rng);
      expect(r.levels[cur.dir][cur.key]).toBe(Math.min(4, before + 1));
      expect(r.levels[other][cur.key]).toBe(otherBefore);
      levels = r.levels;
      s = advance(r.state, levels, rng);
    }
    const dirs = new Set(s.results.map((x) => x.dir));
    expect(dirs.size).toBe(2);
  });

  it("a miss drops the level by one", () => {
    const rng = createRng(3);
    const levels: IonLevels = { n2f: Object.fromEntries(keys.map((k) => [k, 3])), f2n: {} };
    const s = startDrill(keys, "n2f", levels, rng);
    const r = answerDrill(s, levels, "x", false, rng);
    expect(r.levels.n2f[s.current!.key]).toBe(2);
  });

  it("runs a single review pass when everything is already mastered", () => {
    const rng = createRng(5);
    const levels: IonLevels = { n2f: Object.fromEntries(keys.map((k) => [k, 4])), f2n: {} };
    let s = startDrill(keys, "n2f", levels, rng);
    expect(s.review).toBe(true);
    let n = 0;
    while (!s.done) {
      s = advance(answerDrill(s, levels, "", true, rng).state, levels, rng);
      n++;
    }
    expect(n).toBe(keys.length);
  });
});
