import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LewisDiagram } from "@/components/LewisDiagram";
import { lewis, LEWIS } from "@/data/lewis";
import { MOLECULE_BY_FORMULA } from "@/data/molecules";
import { totalValence } from "@/lib/chem";
import { countAtoms, validateFormula } from "@/lib/formula";
import { describeAtom, electronCount, electronsAround, formalCharge } from "@/lib/lewis";
import { angDist, layoutLewis } from "@/lib/lewisLayout";

const cases = LEWIS.map((s) => [s.formula, s] as const);

describe("Lewis structure data", () => {
  it.each(cases)("%s: shows exactly the total valence electrons", (_, s) => {
    expect(validateFormula(s.formula)).toEqual([]);
    expect(electronCount(s)).toBe(totalValence(s.formula).total);
  });

  it.each(cases)("%s: atoms match the formula", (_, s) => {
    const counts = new Map<string, number>();
    for (const a of s.atoms) counts.set(a.el, (counts.get(a.el) ?? 0) + 1);
    expect(Object.fromEntries(counts)).toEqual(Object.fromEntries(countAtoms(s.formula)));
  });

  it.each(cases)("%s: formal charges add up to the charge", (_, s) => {
    const sum = s.atoms.reduce((n, _, i) => n + formalCharge(s, i), 0);
    expect(sum).toBe(s.charge);
  });

  it.each(cases)("%s: octets match the molecules table", (_, s) => {
    const m = MOLECULE_BY_FORMULA.get(s.formula);
    s.atoms.forEach((a, i) => {
      const e = electronsAround(s, i);
      if (a.el === "H") return expect(e).toBe(2);
      if (i > 0 || s.diatomic) return expect(e, `${a.el} #${i}`).toBe(8);
      // central atom
      if (!m || m.octet === "octet") expect(e, `central ${a.el}`).toBe(8);
      else if (m.octet === "incomplete") expect(e).toBeLessThan(8);
      else if (m.octet === "expanded") expect(e).toBeGreaterThan(8);
    });
  });

  it.each(cases.filter(([, s]) => !s.diatomic))("%s: central atom agrees with the VSEPR row", (_, s) => {
    const m = MOLECULE_BY_FORMULA.get(s.formula);
    if (!m) return;
    expect(s.atoms[0].el).toBe(m.centralAtom);
    expect(s.atoms[0].lp).toBe(m.lonePairs);
    expect(s.bonds.length).toBe(m.bondingDomains);
  });

  it("known formal charges", () => {
    const fc = (f: string, i: number) => formalCharge(lewis(f), i);
    // NO3-: N +1, double-bonded O 0, single-bonded O −1
    expect([fc("NO3 -", 0), fc("NO3 -", 1), fc("NO3 -", 2)]).toEqual([1, 0, -1]);
    expect(fc("NH4 +", 0)).toBe(1);
    // CO: C −1, O +1
    expect([fc("CO", 0), fc("CO", 1)]).toEqual([-1, 1]);
    expect(fc("O3", 0)).toBe(1);
    expect(fc("BF4 -", 0)).toBe(-1);
  });

  it("describes atoms unambiguously", () => {
    expect(describeAtom(lewis("NO3 -"), 0)).toBe("the central N");
    expect(describeAtom(lewis("NO3 -"), 1)).toBe("the double-bonded O");
    expect(describeAtom(lewis("NO3 -"), 2)).toBe("one of the single-bonded O atoms");
    expect(describeAtom(lewis("CO"), 0)).toBe("the C");
    expect(describeAtom(lewis("HCN"), 2)).toBe("the N");
  });
});

describe("Lewis layout", () => {
  it.each(cases)("%s: lone pairs don't sit on top of bonds or each other", (_, s) => {
    const layout = layoutLewis(s);
    layout.atoms.forEach((atom, i) => {
      const bondDirs = layout.bonds
        .filter((b) => b.a === i || b.b === i)
        .map((b) => {
          const other = layout.atoms[b.a === i ? b.b : b.a].pos;
          return (Math.atan2(other.y - atom.pos.y, other.x - atom.pos.x) * 180) / Math.PI;
        });
      for (const lp of atom.lonePairs) {
        for (const d of bondDirs) expect(angDist(lp, d), `${s.formula} atom ${i}`).toBeGreaterThanOrEqual(30);
      }
      for (let a = 0; a < atom.lonePairs.length; a++) {
        for (let b = a + 1; b < atom.lonePairs.length; b++) {
          expect(angDist(atom.lonePairs[a], atom.lonePairs[b])).toBeGreaterThanOrEqual(30);
        }
      }
    });
  });

  it("renders SVG with the right number of bond lines and lone-pair dots", () => {
    const s = lewis("CO2");
    const html = renderToStaticMarkup(<LewisDiagram structure={s} />);
    expect(html.match(/<line/g)).toHaveLength(4); // two double bonds
    expect(html.match(/<circle/g)).toHaveLength(8); // 4 lone pairs × 2 dots
  });

  it("brackets ions and can show formal charges and a highlight", () => {
    const html = renderToStaticMarkup(<LewisDiagram structure={lewis("NO3 -")} highlight={2} showFormalCharges />);
    expect(html).toContain("<path");
    expect(html).toContain("−</text>"); // overall charge
    expect(html).toContain("+1");
    expect(html).toContain("−1");
    expect(html).toContain('stroke="var(--callout)"');
  });
});
