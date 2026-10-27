import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Formula } from "@/components/Formula";
import { countAtoms, parseFormula, validateFormula } from "@/lib/formula";

describe("parseFormula", () => {
  it("renders Cr2O7 2- with subscripts and a 2− superscript", () => {
    const html = renderToStaticMarkup(<Formula text="Cr2O7 2-" />);
    expect(html).toContain("<sub>2</sub>");
    expect(html).toContain("<sub>7</sub>");
    expect(html).toContain("<sup>2−</sup>");
  });
  it("drops the 1 on 1− and 1+ charges", () => {
    expect(parseFormula("NO3 -").tokens.at(-1)).toEqual({ kind: "sup", value: "−" });
    expect(parseFormula("NH4 +").tokens.at(-1)).toEqual({ kind: "sup", value: "+" });
  });
  it("treats hydrate coefficients as normal-size text", () => {
    const { tokens } = parseFormula("CuSO4·5H2O");
    expect(tokens).toEqual([
      { kind: "text", value: "CuSO" },
      { kind: "sub", value: "4" },
      { kind: "text", value: "·5H" },
      { kind: "sub", value: "2" },
      { kind: "text", value: "O" },
    ]);
  });
  it("subscripts after parentheses", () => {
    const { tokens } = parseFormula("(NH4)2SO4");
    expect(tokens.filter((t) => t.kind === "sub").map((t) => t.value)).toEqual(["4", "2", "4"]);
  });
  it("neutral formulas have no superscript", () => {
    expect(parseFormula("CO2").tokens.some((t) => t.kind === "sup")).toBe(false);
  });
  it("reads two-letter symbols", () => {
    expect(parseFormula("NaCl").symbols).toEqual(["Na", "Cl"]);
    expect(parseFormula("CO").symbols).toEqual(["C", "O"]);
    expect(parseFormula("Co").symbols).toEqual(["Co"]);
  });
});

describe("validateFormula", () => {
  it("accepts good formulas", () => {
    for (const f of ["SO4 2-", "Fe(NO3)3", "CuSO4·5H2O", "NH4 +", "XeF4"]) {
      expect(validateFormula(f)).toEqual([]);
    }
  });
  it("rejects typos", () => {
    expect(validateFormula("Xx2")).not.toEqual([]);
    expect(validateFormula("Fe(NO3")).not.toEqual([]);
    expect(validateFormula("SO4 2")).not.toEqual([]);
  });
});

describe("countAtoms", () => {
  it("expands parentheses and hydrates", () => {
    expect(Object.fromEntries(countAtoms("(NH4)2SO4"))).toEqual({ N: 2, H: 8, S: 1, O: 4 });
    expect(Object.fromEntries(countAtoms("CuSO4·5H2O"))).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(Object.fromEntries(countAtoms("C2H3O2 -"))).toEqual({ C: 2, H: 3, O: 2 });
  });
});
