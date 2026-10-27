import { describe, expect, it } from "vitest";
import { canonicalFormula, checkAnswer, normalizeName } from "@/lib/check";

const ok = (input: string, kind: Parameters<typeof checkAnswer>[1], accepted: string[]) =>
  checkAnswer(input, kind, accepted).correct;

describe("whitespace", () => {
  it("trims and collapses repeated spaces", () => {
    expect(ok("   sulfate  ", "name", ["sulfate"])).toBe(true);
    expect(ok("hydrogen    carbonate", "name", ["hydrogen carbonate"])).toBe(true);
    expect(ok("  SO3    2-  ", "formula", ["SO3 2-"])).toBe(true);
    expect(ok("\tNH4 \t +", "formula", ["NH4 +"])).toBe(true);
  });
});

describe("names", () => {
  it("are case-insensitive", () => {
    expect(ok("Sulfate", "name", ["sulfate"])).toBe(true);
    expect(ok("DIHYDROGEN PHOSPHATE", "name", ["dihydrogen phosphate"])).toBe(true);
    expect(ok("Iron(III) Chloride", "name", ["iron(III) chloride"])).toBe(true);
  });
  it("accept listed alternates", () => {
    expect(ok("bicarbonate", "name", ["hydrogen carbonate", "bicarbonate"])).toBe(true);
    expect(ok("hydrogen carbonate", "name", ["hydrogen carbonate", "bicarbonate"])).toBe(true);
  });
  it("reject wrong names", () => {
    expect(ok("sulfite", "name", ["sulfate"])).toBe(false);
    expect(ok("iron chloride", "name", ["iron(III) chloride"])).toBe(false);
    expect(ok("iron(II) chloride", "name", ["iron(III) chloride"])).toBe(false);
  });
  it("ignore a space before the Roman numeral", () => {
    expect(ok("iron (III) chloride", "name", ["iron(III) chloride"])).toBe(true);
    expect(normalizeName("Copper ( II ) sulfate")).toBe("copper(ii) sulfate");
  });
});

describe("formulas", () => {
  it("are case-sensitive", () => {
    expect(ok("ClO3 -", "formula", ["ClO3 -"])).toBe(true);
    expect(ok("CLO3 -", "formula", ["ClO3 -"])).toBe(false);
    expect(ok("clo3 -", "formula", ["ClO3 -"])).toBe(false);
    expect(ok("NaCl", "formula", ["NaCl"])).toBe(true);
    expect(ok("NACL", "formula", ["NaCl"])).toBe(false);
  });
  it("use formula, one space, then the charge", () => {
    expect(ok("SO3 2-", "formula", ["SO3 2-"])).toBe(true);
    expect(ok("NH4 +", "formula", ["NH4 +"])).toBe(true);
    expect(ok("PO4 3-", "formula", ["PO4 3-"])).toBe(true);
  });
  it("reject carets, missing spaces, and sign-first charges", () => {
    expect(ok("SO3^2-", "formula", ["SO3 2-"])).toBe(false);
    expect(ok("SO32-", "formula", ["SO3 2-"])).toBe(false);
    expect(ok("SO3 -2", "formula", ["SO3 2-"])).toBe(false);
    expect(ok("SO3", "formula", ["SO3 2-"])).toBe(false);
  });
  it("accept both NO3 - and NO3 1- for 1- ions", () => {
    expect(ok("NO3 -", "formula", ["NO3 -"])).toBe(true);
    expect(ok("NO3 1-", "formula", ["NO3 -"])).toBe(true);
    expect(ok("NO3 -", "formula", ["NO3 1-"])).toBe(true);
  });
  it("accept both NH4 + and NH4 1+ for 1+ ions", () => {
    expect(ok("NH4 1+", "formula", ["NH4 +"])).toBe(true);
  });
  it("do not confuse charge magnitudes or signs", () => {
    expect(ok("SO4 -", "formula", ["SO4 2-"])).toBe(false);
    expect(ok("SO4 2+", "formula", ["SO4 2-"])).toBe(false);
    expect(ok("PO4 2-", "formula", ["PO4 3-"])).toBe(false);
  });
  it("accept a typed Unicode minus", () => {
    expect(ok("SO4 2−", "formula", ["SO4 2-"])).toBe(true);
  });
  it("neutral formulas have no charge", () => {
    expect(ok("Fe(NO3)3", "formula", ["Fe(NO3)3"])).toBe(true);
    expect(ok("(NH4)2SO4", "formula", ["(NH4)2SO4"])).toBe(true);
    expect(ok("Fe(NO3)3 0", "formula", ["Fe(NO3)3"])).toBe(false);
    expect(ok("CO2 -", "formula", ["CO2"])).toBe(false);
  });
  it("accept the middle dot, asterisk, or period as the hydrate dot", () => {
    for (const input of ["CuSO4·5H2O", "CuSO4*5H2O", "CuSO4.5H2O", "CuSO4 · 5H2O", "CuSO4 * 5H2O"]) {
      expect(ok(input, "formula", ["CuSO4·5H2O"])).toBe(true);
    }
    expect(ok("CuSO4·6H2O", "formula", ["CuSO4·5H2O"])).toBe(false);
    expect(canonicalFormula("MgSO4.7H2O")).toBe("MgSO4·7H2O");
  });
  it("give hints for near-misses", () => {
    expect(checkAnswer("CLO3 -", "formula", ["ClO3 -"]).hint).toMatch(/Capital/);
    expect(checkAnswer("SO3^2-", "formula", ["SO3 2-"]).hint).toMatch(/caret/);
    expect(checkAnswer("SO3 -2", "formula", ["SO3 2-"]).hint).toMatch(/before the sign/);
    expect(checkAnswer("SO3", "formula", ["SO3 2-"]).hint).toMatch(/charge/);
    expect(checkAnswer("SO32-", "formula", ["SO3 2-"]).hint).toMatch(/space/);
    expect(checkAnswer("NO3-", "formula", ["NO3 -"]).hint).toMatch(/space/);
  });
});

describe("numbers", () => {
  it("are exact integers", () => {
    expect(ok("6", "integer", ["6"])).toBe(true);
    expect(ok(" 32 ", "integer", ["32"])).toBe(true);
    expect(ok("7", "integer", ["6"])).toBe(false);
    expect(ok("6.0", "integer", ["6"])).toBe(false);
    expect(ok("six", "integer", ["6"])).toBe(false);
  });
  it("handle signed formal charges", () => {
    expect(ok("-1", "integer", ["-1"])).toBe(true);
    expect(ok("−1", "integer", ["-1"])).toBe(true);
    expect(ok("+1", "integer", ["1"])).toBe(true);
    expect(ok("1", "integer", ["1"])).toBe(true);
    expect(ok("1", "integer", ["-1"])).toBe(false);
    expect(ok("0", "integer", ["0"])).toBe(true);
  });
  it("accept angles with or without the degree sign", () => {
    expect(ok("109.5", "angle", ["109.5"])).toBe(true);
    expect(ok("109.5°", "angle", ["109.5"])).toBe(true);
    expect(ok("109.5 °", "angle", ["109.5"])).toBe(true);
    expect(ok("180", "angle", ["180"])).toBe(true);
    expect(ok("180°", "angle", ["180"])).toBe(true);
    expect(ok("109", "angle", ["109.5"])).toBe(false);
    expect(ok("104.5", "angle", ["109.5"])).toBe(false);
  });
});

describe("multiple choice", () => {
  it("matches the exact choice", () => {
    expect(ok("seesaw", "choice", ["seesaw"])).toBe(true);
    expect(ok("T-shaped", "choice", ["seesaw"])).toBe(false);
  });
});
