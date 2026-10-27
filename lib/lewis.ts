import type { LewisStructure } from "@/data/lewis";
import { valenceElectrons } from "@/data/elements";

/** Sum of bond orders touching atom i. */
export function bondOrderSum(s: LewisStructure, i: number): number {
  return s.bonds.reduce((n, [a, b, o]) => (a === i || b === i ? n + o : n), 0);
}

/** Formal charge = valence − nonbonding electrons − ½ bonding electrons. */
export function formalCharge(s: LewisStructure, i: number): number {
  return valenceElectrons(s.atoms[i].el) - 2 * s.atoms[i].lp - bondOrderSum(s, i);
}

export function formalChargeWork(s: LewisStructure, i: number): string {
  const v = valenceElectrons(s.atoms[i].el);
  const nb = 2 * s.atoms[i].lp;
  const half = bondOrderSum(s, i);
  return `FC = ${v} − ${nb} − ½(${2 * half}) = ${signed(formalCharge(s, i))}`;
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0";
}

/** Electrons shown in the drawing. */
export function electronCount(s: LewisStructure): number {
  return 2 * s.atoms.reduce((n, a) => n + a.lp, 0) + 2 * s.bonds.reduce((n, [, , o]) => n + o, 0);
}

/** Electrons around atom i (lone pairs + shared). */
export function electronsAround(s: LewisStructure, i: number): number {
  return 2 * s.atoms[i].lp + 2 * bondOrderSum(s, i);
}

/** Order of the bond between atoms i and j, or 0. */
export function bondBetween(s: LewisStructure, i: number, j: number): number {
  const b = s.bonds.find(([a, c]) => (a === i && c === j) || (a === j && c === i));
  return b ? b[2] : 0;
}

const ORDER_WORD = { 1: "single", 2: "double", 3: "triple" } as const;

/** Plain description of atom i, e.g. "the central N", "one of the single-bonded O atoms", "the H". */
export function describeAtom(s: LewisStructure, i: number): string {
  const el = s.atoms[i].el;
  if (s.diatomic) {
    const same = s.atoms.filter((a) => a.el === el).length > 1;
    return same ? `the ${i === 0 ? "left" : "right"} ${el}` : `the ${el}`;
  }
  if (i === 0) return `the central ${el}`;
  const order = bondBetween(s, 0, i) as 1 | 2 | 3;
  const sameEl = s.atoms.filter((_, j) => j !== 0 && s.atoms[j].el === el);
  if (sameEl.length === 1) return `the ${el}`;
  const sameKind = s.atoms.filter((a, j) => j !== 0 && a.el === el && bondBetween(s, 0, j) === order);
  const word = ORDER_WORD[order];
  if (sameKind.length === sameEl.length) return `one of the ${el} atoms`;
  return sameKind.length === 1 ? `the ${word}-bonded ${el}` : `one of the ${word}-bonded ${el} atoms`;
}
