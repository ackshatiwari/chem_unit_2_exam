import { describe, expect, it } from "vitest";
import { splitRich } from "@/components/RichText";
import { checkAnswer } from "@/lib/check";
import { validateFormula } from "@/lib/formula";
import { GENERATORS } from "@/lib/generators";
import type { Question } from "@/lib/question";
import { createRng } from "@/lib/rng";
import { SECTIONS } from "@/lib/sections";
import { valenceElectrons } from "@/data/elements";

const SAMPLES = 300;

function sample(id: string, n = SAMPLES): Question[] {
  const rng = createRng(1234);
  return Array.from({ length: n }, () => GENERATORS[id](rng));
}

function richFormulas(text: string): string[] {
  return splitRich(text)
    .filter((p) => p.formula)
    .map((p) => p.value);
}

const ids = Object.keys(GENERATORS);

describe("generator registry", () => {
  it("only has ids that exist on a tile", () => {
    const all = new Set(SECTIONS.flatMap((s) => s.sublabels.map((l) => l.id)));
    for (const id of ids) expect(all.has(id), id).toBe(true);
  });
});

describe.each(ids)("generator %s", (id) => {
  const qs = sample(id);

  it("returns well-formed questions", () => {
    for (const q of qs) {
      expect(q.sublabelId).toBe(id);
      expect(q.id.startsWith(`${id}:`)).toBe(true);
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
      expect(q.acceptedAnswers).toContain(q.answer);
      if (q.format === "mc") {
        expect(q.kind).toBe("choice");
        expect(q.choices!.length).toBeGreaterThanOrEqual(2);
        expect(q.choices!.length).toBeLessThanOrEqual(4);
        expect(new Set(q.choices).size).toBe(q.choices!.length);
        expect(q.choices).toContain(q.answer);
      } else {
        expect(q.kind).not.toBe("choice");
      }
    }
  });

  it("accepts its own answer", () => {
    for (const q of qs) {
      expect(checkAnswer(q.answer, q.kind, q.acceptedAnswers).correct, q.id).toBe(true);
    }
  });

  it("only uses valid formulas in {braces}", () => {
    for (const q of qs) {
      for (const text of [q.prompt, q.explanation, q.answer, ...(q.choices ?? [])]) {
        for (const f of richFormulas(text)) expect(validateFormula(f), `${q.id}: ${f}`).toEqual([]);
      }
      if (q.kind === "formula") expect(validateFormula(q.answer), q.id).toEqual([]);
    }
  });

  it("varies its questions", () => {
    expect(new Set(qs.map((q) => q.id)).size).toBeGreaterThan(2);
  });

  it("gives the same id the same answer", () => {
    const seen = new Map<string, string>();
    for (const q of qs) {
      const prev = seen.get(q.id);
      if (prev !== undefined) expect(q.answer, q.id).toBe(prev);
      seen.set(q.id, q.answer);
    }
  });
});

describe("spot checks", () => {
  const find = (id: string, qid: string) => sample(id, 3000).find((q) => q.id === qid);

  it("A1: Se has 6, He has 2", () => {
    expect(find("A1", "A1:Se")?.answer).toBe("6");
    expect(find("A1", "A1:He")?.answer).toBe("2");
    expect(valenceElectrons("Al")).toBe(3);
  });
  it("A2: SO4 2- has 32, Cl- has 8, NH4+ has 8", () => {
    expect(find("A2", "A2:SO4 2-")?.answer).toBe("32");
    expect(find("A2", "A2:Cl -")?.answer).toBe("8");
    expect(find("A2", "A2:NH4 +")?.answer).toBe("8");
    expect(find("A2", "A2:C2H3O2 -")?.answer).toBe("24");
  });
  it("A3: Na–Cl ionic, C–O polar, Cl–Cl nonpolar", () => {
    expect(find("A3", "A3:Na-Cl")?.answer).toBe("Ionic");
    expect(find("A3", "A3:C-O")?.answer).toBe("Polar covalent");
    expect(find("A3", "A3:Cl-Cl")?.answer).toBe("Nonpolar covalent");
  });
  it("A3 never pairs two metals (that would be metallic bonding)", () => {
    const metals = new Set(["Li", "Be", "Na", "Mg", "Al", "K", "Ca", "Cs", "Ba"]);
    for (const q of sample("A3", 2000)) {
      const [a, b] = q.id.replace("A3:", "").split("-");
      expect(metals.has(a) && metals.has(b), q.id).toBe(false);
    }
  });
  it("F: SF4 is seesaw with 5 domains", () => {
    expect(find("F1", "F1:SF4")?.answer).toBe("5");
    expect(find("F3", "F3:SF4")?.answer).toBe("seesaw");
    expect(find("F3", "F3:SF4")?.explanation).toContain("4 bonding + 1 lone pair = 5 domains");
  });
  it("F4 never asks for 104.5 or 107 as a typed answer", () => {
    for (const q of sample("F4", 2000)) {
      if (q.format === "typed") expect(["104.5", "107"]).not.toContain(q.answer);
    }
  });
  it("G2: XeF4 is nonpolar", () => {
    expect(find("G2", "G2:XeF4:np")?.answer).toBe("True");
    expect(find("G2", "G2:XeF4:p")?.answer).toBe("False");
  });
  it("H: names and formulas", () => {
    expect(find("H1", "H1:f2n:Fe2O3")?.answer).toBe("iron(III) oxide");
    expect(find("H4", "H4:n2f:(NH4)2SO4")?.answer).toBe("(NH4)2SO4");
    expect(find("H2", "H2:f2n:H2SO3")?.answer).toBe("sulfurous acid");
    expect(find("H2", "H2:f2n:HCl")?.answer).toBe("hydrochloric acid");
    expect(find("H3", "H3:f2n:CuSO4·5H2O")?.answer).toBe("copper(II) sulfate pentahydrate");
    expect(find("H5", "H5:f2n:N2O4")?.acceptedAnswers).toContain("dinitrogen tetroxide");
  });
  it("H2 never builds an acid from an anion that already has H", () => {
    for (const q of sample("H2", 1000)) {
      expect(q.id).not.toMatch(/H2PO|HSO|HC2O4|HCO3|HPO|C2H3O2|OH$/);
    }
  });
});
