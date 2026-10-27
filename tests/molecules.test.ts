import { describe, expect, it } from "vitest";
import {
  ELECTRON_GEOMETRY_BY_DOMAINS,
  IDEAL_ANGLES_BY_DOMAINS,
  MOLECULES,
  SHAPE_BY_DOMAINS,
  molecule,
} from "@/data/molecules";
import { totalValence } from "@/lib/chem";
import { countAtoms, splitCharge, validateFormula } from "@/lib/formula";

const REQUIRED = [
  "CO2", "BeCl2", "HCN", "BF3", "SO3", "NO3 -", "CO3 2-", "SO2", "O3", "CH4", "NH4 +", "CCl4", "CH2Cl2",
  "NH3", "H3O +", "PCl3", "H2O", "H2S", "PCl5", "SF4", "ClF3", "XeF2", "I3 -", "SF6", "BrF5", "XeF4",
  "BF4 -", "NO", "NO2", "ClO2", "CHCl3", "HF", "N2", "O2",
];

describe("molecules table", () => {
  it("covers every required species exactly once", () => {
    for (const f of REQUIRED) expect(() => molecule(f), f).not.toThrow();
    const formulas = MOLECULES.map((m) => m.formula);
    expect(new Set(formulas).size).toBe(formulas.length);
  });

  it.each(MOLECULES.map((m) => [m.formula, m] as const))("%s: domains = bonding domains + lone pairs, geometry matches", (_, m) => {
    expect(validateFormula(m.formula)).toEqual([]);
    expect(splitCharge(m.formula).charge).toBe(m.charge);
    expect(m.domains).toBe(m.bondingDomains + m.lonePairs);

    if (m.centralAtom === null) {
      // Diatomics: two atoms, linear, no bond angle.
      const atoms = [...countAtoms(m.formula).values()].reduce((a, b) => a + b, 0);
      expect(atoms).toBe(2);
      expect(m.molecularGeometry).toBe("linear");
      expect(m.idealAngles).toEqual([]);
      return;
    }
    const key = `${m.domains},${m.lonePairs}`;
    expect(m.electronGeometry).toBe(ELECTRON_GEOMETRY_BY_DOMAINS[m.domains]);
    expect(m.molecularGeometry).toBe(SHAPE_BY_DOMAINS[key]);
    expect(m.idealAngles).toEqual(IDEAL_ANGLES_BY_DOMAINS[key]);
    // The central atom is in the formula, and every other atom is bonded to it.
    const counts = countAtoms(m.formula);
    expect(counts.has(m.centralAtom)).toBe(true);
    const totalAtoms = [...counts.values()].reduce((a, b) => a + b, 0);
    expect(m.bondingDomains).toBe(totalAtoms - 1);
  });

  it.each(MOLECULES.map((m) => [m.formula, m] as const))("%s: total valence electrons match the formula", (_, m) => {
    expect(totalValence(m.formula).total).toBe(m.totalValence);
  });

  it("odd-electron category ⇔ odd valence total", () => {
    for (const m of MOLECULES) expect(m.octet === "odd", m.formula).toBe(m.totalValence % 2 === 1);
  });

  it("incomplete and expanded octets match the electron count around the central atom", () => {
    for (const m of MOLECULES.filter((x) => x.octet === "incomplete" || x.octet === "expanded")) {
      const around = 2 * (m.bondingDomains + m.lonePairs);
      if (m.octet === "incomplete") expect(around, m.formula).toBeLessThan(8);
      else expect(around, m.formula).toBeGreaterThan(8);
    }
  });

  it("matches the spec's exception lists", () => {
    const cat = (f: string) => molecule(f).octet;
    for (const f of ["BF3", "BH3", "BeCl2", "AlCl3"]) expect(cat(f)).toBe("incomplete");
    for (const f of ["PCl5", "SF4", "SF6", "ClF3", "XeF2", "XeF4", "I3 -", "BrF5"]) expect(cat(f)).toBe("expanded");
    for (const f of ["NO", "NO2", "ClO2"]) expect(cat(f)).toBe("odd");
  });

  it("gets the tricky polarity cases right", () => {
    const polar = (f: string) => molecule(f).polar;
    expect(polar("CO2")).toBe(false);
    expect(polar("CH2Cl2")).toBe(true);
    expect(polar("CCl4")).toBe(false);
    expect(polar("SF4")).toBe(true);
    expect(polar("XeF4")).toBe(false);
    expect(polar("BF3")).toBe(false);
    expect(polar("NH3")).toBe(true);
  });

  it("polarity reasons agree with the polar flag", () => {
    for (const m of MOLECULES) {
      if (!m.polarityReason) continue;
      expect(m.polar, m.formula).toBe(m.polarityReason === "polar");
    }
  });

  it("resonance flags match the spec's examples and foils", () => {
    for (const f of ["O3", "NO3 -", "CO3 2-", "SO2", "NO2 -"]) expect(molecule(f).resonance, f).toBe(true);
    for (const f of ["H2O", "CH4", "NH3", "CO2", "HCN"]) expect(molecule(f).resonance, f).toBe(false);
  });

  it("uses 104.5° and 107° only as explanation text", () => {
    expect(molecule("H2O").idealAngles).toEqual([109.5]);
    expect(molecule("NH3").idealAngles).toEqual([109.5]);
    expect(molecule("H2O").actualAngle).toContain("104.5");
    expect(molecule("NH3").actualAngle).toContain("107");
  });
});
