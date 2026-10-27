import { electronegativity, valenceElectrons } from "@/data/elements";
import { IONIC_MIN, NONPOLAR_MAX } from "./config";
import { countAtoms, splitCharge } from "./formula";

export type BondType = "Nonpolar covalent" | "Polar covalent" | "Ionic";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function deltaEN(a: string, b: string): number {
  return round2(Math.abs(electronegativity(a) - electronegativity(b)));
}

export function bondType(dEN: number): BondType {
  if (dEN <= NONPOLAR_MAX) return "Nonpolar covalent";
  if (dEN >= IONIC_MIN) return "Ionic";
  return "Polar covalent";
}

/** Total valence electrons for a formula with optional charge, plus a worked line. */
export function totalValence(text: string): { total: number; work: string } {
  const { charge } = splitCharge(text);
  const counts = countAtoms(text);
  let sum = 0;
  const parts: string[] = [];
  for (const [sym, n] of counts) {
    const v = valenceElectrons(sym);
    sum += n * v;
    parts.push(n === 1 ? `${sym} ${v}` : `${n}×${sym} ${v}`);
  }
  const total = sum - charge;
  let work = parts.length === 1 ? `${parts[0]}` : `${parts.join(" + ")} = ${sum}`;
  if (charge < 0) work += `, +${-charge} for the ${-charge === 1 ? "" : -charge}− charge → ${total}`;
  if (charge > 0) work += `, −${charge} for the ${charge === 1 ? "" : charge}+ charge → ${total}`;
  return { total, work };
}

