// Lewis structures as data: atoms (with lone pairs) and bonds. atoms[0] is the
// central atom (or the left atom of a diatomic). Positions are computed by
// lib/lewisLayout.ts. For resonance species this is one resonance form.
//
// Tests check every structure: electron count = total valence electrons,
// formal charges sum to the charge, and octets match the molecules table.

export interface LewisAtom {
  el: string;
  /** Lone pairs on this atom. */
  lp: number;
}

export interface LewisStructure {
  /** Plain-text formula with charge, e.g. "NO3 -". */
  formula: string;
  charge: number;
  atoms: LewisAtom[];
  /** [atom index, atom index, bond order] */
  bonds: [number, number, 1 | 2 | 3][];
  /** Two-atom species: drawn side by side, no central atom. */
  diatomic?: boolean;
}

type Terminal = [el: string, lp: number, order: 1 | 2 | 3];

/** Central atom with terminals bonded to it, in drawing order. */
function star(formula: string, charge: number, central: [string, number], terminals: Terminal[]): LewisStructure {
  return {
    formula,
    charge,
    atoms: [{ el: central[0], lp: central[1] }, ...terminals.map(([el, lp]) => ({ el, lp }))],
    bonds: terminals.map(([, , order], i) => [0, i + 1, order]),
  };
}

function diatomic(formula: string, charge: number, a: [string, number], b: [string, number], order: 1 | 2 | 3): LewisStructure {
  return {
    formula,
    charge,
    atoms: [
      { el: a[0], lp: a[1] },
      { el: b[0], lp: b[1] },
    ],
    bonds: [[0, 1, order]],
    diatomic: true,
  };
}

const H: Terminal = ["H", 0, 1];
const F: Terminal = ["F", 3, 1];
const Cl: Terminal = ["Cl", 3, 1];

export const LEWIS: LewisStructure[] = [
  star("H2O", 0, ["O", 2], [H, H]),
  star("H2S", 0, ["S", 2], [H, H]),
  star("NH3", 0, ["N", 1], [H, H, H]),
  star("CH4", 0, ["C", 0], [H, H, H, H]),
  star("NH4 +", 1, ["N", 0], [H, H, H, H]),
  star("H3O +", 1, ["O", 1], [H, H, H]),
  star("CO2", 0, ["C", 0], [["O", 2, 2], ["O", 2, 2]]),
  star("HCN", 0, ["C", 0], [H, ["N", 1, 3]]),
  star("CH2O", 0, ["C", 0], [["O", 2, 2], H, H]),
  star("BeCl2", 0, ["Be", 0], [Cl, Cl]),
  star("BF3", 0, ["B", 0], [F, F, F]),
  star("BF4 -", -1, ["B", 0], [F, F, F, F]),
  star("CCl4", 0, ["C", 0], [Cl, Cl, Cl, Cl]),
  star("CH2Cl2", 0, ["C", 0], [H, Cl, H, Cl]),
  star("CHCl3", 0, ["C", 0], [H, Cl, Cl, Cl]),
  star("PCl3", 0, ["P", 1], [Cl, Cl, Cl]),
  star("NO3 -", -1, ["N", 0], [["O", 2, 2], ["O", 3, 1], ["O", 3, 1]]),
  star("CO3 2-", -2, ["C", 0], [["O", 2, 2], ["O", 3, 1], ["O", 3, 1]]),
  star("O3", 0, ["O", 1], [["O", 2, 2], ["O", 3, 1]]),
  star("NO2 -", -1, ["N", 1], [["O", 2, 2], ["O", 3, 1]]),
  star("PCl5", 0, ["P", 0], [Cl, Cl, Cl, Cl, Cl]),
  star("SF4", 0, ["S", 1], [F, F, F, F]),
  star("ClF3", 0, ["Cl", 2], [F, F, F]),
  star("XeF2", 0, ["Xe", 3], [F, F]),
  star("I3 -", -1, ["I", 3], [["I", 3, 1], ["I", 3, 1]]),
  star("SF6", 0, ["S", 0], [F, F, F, F, F, F]),
  star("BrF5", 0, ["Br", 1], [F, F, F, F, F]),
  star("XeF4", 0, ["Xe", 2], [F, F, F, F]),
  diatomic("HF", 0, ["H", 0], ["F", 3], 1),
  diatomic("N2", 0, ["N", 1], ["N", 1], 3),
  diatomic("O2", 0, ["O", 2], ["O", 2], 2),
  diatomic("CO", 0, ["C", 1], ["O", 1], 3),
  diatomic("CN -", -1, ["C", 1], ["N", 1], 3),
];

export const LEWIS_BY_FORMULA = new Map(LEWIS.map((s) => [s.formula, s]));

export function lewis(formula: string): LewisStructure {
  const s = LEWIS_BY_FORMULA.get(formula);
  if (!s) throw new Error(`No Lewis structure for ${formula}`);
  return s;
}
