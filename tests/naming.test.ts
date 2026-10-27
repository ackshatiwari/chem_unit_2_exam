import { describe, expect, it } from "vitest";
import { CATIONS, COVALENT, HYDRATES, MONATOMIC_ANIONS } from "@/data/naming";
import { ION_BY_KEY, POLYATOMIC_ANIONS } from "@/data/polyatomic";
import { validateFormula } from "@/lib/formula";
import {
  acidFormula,
  acidNameFromAnion,
  cationPart,
  chargeBalance,
  compoundFormula,
  compoundNames,
  covalentNames,
  hydrateFormula,
  hydrateName,
  ionText,
  type IonPart,
} from "@/lib/naming";
import { checkAnswer } from "@/lib/check";

const cat = (formula: string, charge: number) => cationPart(CATIONS.find((c) => c.formula === formula && c.charge === charge)!);
const poly = (key: string): IonPart => ({ ...ION_BY_KEY.get(key)!, polyatomic: true });
const mono = (formula: string): IonPart => ({ ...MONATOMIC_ANIONS.find((a) => a.formula === formula)!, polyatomic: false });

describe("ionic compounds", () => {
  it("balance charges in lowest ratio", () => {
    expect(chargeBalance(3, -2)).toEqual([2, 3]);
    expect(chargeBalance(4, -2)).toEqual([1, 2]);
    expect(chargeBalance(2, -2)).toEqual([1, 1]);
  });
  it("build formulas with parentheses only for multiple polyatomic ions", () => {
    expect(compoundFormula(cat("Fe", 3), poly("NO3 -"))).toBe("Fe(NO3)3");
    expect(compoundFormula(cat("NH4", 1), poly("SO4 2-"))).toBe("(NH4)2SO4");
    expect(compoundFormula(cat("NH4", 1), mono("Cl"))).toBe("NH4Cl");
    expect(compoundFormula(cat("Na", 1), poly("OH -"))).toBe("NaOH");
    expect(compoundFormula(cat("Al", 3), mono("O"))).toBe("Al2O3");
    expect(compoundFormula(cat("Pb", 4), mono("O"))).toBe("PbO2");
    expect(compoundFormula(cat("Ca", 2), poly("PO4 3-"))).toBe("Ca3(PO4)2");
    expect(compoundFormula(cat("Mg", 2), mono("N"))).toBe("Mg3N2");
    expect(compoundFormula(cat("Cu", 1), mono("O"))).toBe("Cu2O");
    expect(compoundFormula(cat("Sn", 4), poly("SO4 2-"))).toBe("Sn(SO4)2");
  });
  it("use Roman numerals only for variable-charge metals", () => {
    for (const c of CATIONS) {
      expect(/\([IV]+\)/.test(c.name), c.name).toBe(c.variable);
    }
    expect(compoundNames(cat("Fe", 3), poly("NO3 -"))[0]).toBe("iron(III) nitrate");
    expect(compoundNames(cat("Na", 1), poly("SO4 2-"))[0]).toBe("sodium sulfate");
  });
  it("Roman numerals match the charge", () => {
    const roman = ["", "I", "II", "III", "IV"];
    for (const c of CATIONS.filter((x) => x.variable)) expect(c.name).toContain(`(${roman[c.charge]})`);
  });
  it("accept alternate anion names", () => {
    const names = compoundNames(cat("Na", 1), poly("HCO3 -"));
    expect(checkAnswer("sodium bicarbonate", "name", names).correct).toBe(true);
    expect(checkAnswer("sodium hydrogen carbonate", "name", names).correct).toBe(true);
  });
});

describe("acids", () => {
  it("-ate → -ic and -ite → -ous, with sulfur and phosphorus stems", () => {
    expect(acidNameFromAnion("sulfate")).toBe("sulfuric acid");
    expect(acidNameFromAnion("sulfite")).toBe("sulfurous acid");
    expect(acidNameFromAnion("phosphate")).toBe("phosphoric acid");
    expect(acidNameFromAnion("phosphite")).toBe("phosphorous acid");
    expect(acidNameFromAnion("hypochlorite")).toBe("hypochlorous acid");
    expect(acidNameFromAnion("perchlorate")).toBe("perchloric acid");
    expect(acidNameFromAnion("nitrite")).toBe("nitrous acid");
    expect(acidNameFromAnion("carbonate")).toBe("carbonic acid");
    expect(acidNameFromAnion("thiosulfate")).toBe("thiosulfuric acid");
    expect(acidNameFromAnion("cyanide")).toBe("hydrocyanic acid");
  });
  it("formulas carry one H per unit of negative charge", () => {
    expect(acidFormula("SO4", -2)).toBe("H2SO4");
    expect(acidFormula("PO4", -3)).toBe("H3PO4");
    expect(acidFormula("ClO", -1)).toBe("HClO");
  });
  it("every oxyacid comes from an H-free anion and parses", () => {
    for (const a of POLYATOMIC_ANIONS.filter((x) => !x.formula.includes("H"))) {
      expect(validateFormula(acidFormula(a.formula, a.charge))).toEqual([]);
      expect(() => acidNameFromAnion(a.name)).not.toThrow();
    }
  });
});

describe("hydrates", () => {
  it.each(HYDRATES.map((h) => [h.formula, h] as const))("%s: hand-written formula and name match the builder", (_, h) => {
    const c = ionText(h.cation);
    const a = ionText(h.anion);
    const catPart = cationPart(CATIONS.find((x) => x.formula === c.formula && x.charge === c.charge)!);
    const anPart: IonPart = ION_BY_KEY.has(h.anion)
      ? { ...ION_BY_KEY.get(h.anion)!, polyatomic: true }
      : { ...MONATOMIC_ANIONS.find((x) => x.formula === a.formula)!, polyatomic: false };
    expect(hydrateFormula(compoundFormula(catPart, anPart), h.water)).toBe(h.formula);
    expect(hydrateName(compoundNames(catPart, anPart)[0], h.water)).toBe(h.name);
    expect(validateFormula(h.formula)).toEqual([]);
  });
  it("covers prefixes 1–10", () => {
    const waters = new Set(HYDRATES.map((h) => h.water));
    for (let n = 1; n <= 10; n++) expect(waters.has(n), `water ${n}`).toBe(true);
  });
});

describe("binary covalent", () => {
  it.each(COVALENT.map((c) => [c.formula, c] as const))("%s: hand-written name matches the prefix rules", (_, c) => {
    const [a, na, b, nb] = c.parts;
    expect(covalentNames(a, na, b, nb)[0]).toBe(c.name);
    expect(validateFormula(c.formula)).toEqual([]);
    const built = `${a}${na === 1 ? "" : na}${b}${nb === 1 ? "" : nb}`;
    expect(built).toBe(c.formula);
  });
  it("drops mono on the first element and the doubled vowel before oxide", () => {
    expect(covalentNames("C", 1, "O", 1)).toEqual(["carbon monoxide"]);
    expect(covalentNames("N", 2, "O", 4)).toEqual(["dinitrogen tetroxide", "dinitrogen tetraoxide"]);
    expect(covalentNames("C", 1, "O", 2)).toEqual(["carbon dioxide"]);
  });
  it("rejects monooxide", () => {
    expect(checkAnswer("carbon monooxide", "name", covalentNames("C", 1, "O", 1)).correct).toBe(false);
    expect(checkAnswer("monocarbon monoxide", "name", covalentNames("C", 1, "O", 1)).correct).toBe(false);
  });
});
