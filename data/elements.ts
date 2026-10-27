// Main-group elements with Pauling electronegativities.
// Values follow the standard Pauling table (CRC / most general-chemistry texts).
// Noble gases without an accepted Pauling value have en: null.

export interface MainGroupElement {
  symbol: string;
  name: string;
  /** IUPAC group: 1, 2, 13–18 */
  group: number;
  period: number;
  en: number | null;
}

export const MAIN_GROUP: MainGroupElement[] = [
  { symbol: "H", name: "hydrogen", group: 1, period: 1, en: 2.2 },
  { symbol: "He", name: "helium", group: 18, period: 1, en: null },

  { symbol: "Li", name: "lithium", group: 1, period: 2, en: 0.98 },
  { symbol: "Be", name: "beryllium", group: 2, period: 2, en: 1.57 },
  { symbol: "B", name: "boron", group: 13, period: 2, en: 2.04 },
  { symbol: "C", name: "carbon", group: 14, period: 2, en: 2.55 },
  { symbol: "N", name: "nitrogen", group: 15, period: 2, en: 3.04 },
  { symbol: "O", name: "oxygen", group: 16, period: 2, en: 3.44 },
  { symbol: "F", name: "fluorine", group: 17, period: 2, en: 3.98 },
  { symbol: "Ne", name: "neon", group: 18, period: 2, en: null },

  { symbol: "Na", name: "sodium", group: 1, period: 3, en: 0.93 },
  { symbol: "Mg", name: "magnesium", group: 2, period: 3, en: 1.31 },
  { symbol: "Al", name: "aluminum", group: 13, period: 3, en: 1.61 },
  { symbol: "Si", name: "silicon", group: 14, period: 3, en: 1.9 },
  { symbol: "P", name: "phosphorus", group: 15, period: 3, en: 2.19 },
  { symbol: "S", name: "sulfur", group: 16, period: 3, en: 2.58 },
  { symbol: "Cl", name: "chlorine", group: 17, period: 3, en: 3.16 },
  { symbol: "Ar", name: "argon", group: 18, period: 3, en: null },

  { symbol: "K", name: "potassium", group: 1, period: 4, en: 0.82 },
  { symbol: "Ca", name: "calcium", group: 2, period: 4, en: 1.0 },
  { symbol: "Ga", name: "gallium", group: 13, period: 4, en: 1.81 },
  { symbol: "Ge", name: "germanium", group: 14, period: 4, en: 2.01 },
  { symbol: "As", name: "arsenic", group: 15, period: 4, en: 2.18 },
  { symbol: "Se", name: "selenium", group: 16, period: 4, en: 2.55 },
  { symbol: "Br", name: "bromine", group: 17, period: 4, en: 2.96 },
  { symbol: "Kr", name: "krypton", group: 18, period: 4, en: 3.0 },

  { symbol: "Rb", name: "rubidium", group: 1, period: 5, en: 0.82 },
  { symbol: "Sr", name: "strontium", group: 2, period: 5, en: 0.95 },
  { symbol: "In", name: "indium", group: 13, period: 5, en: 1.78 },
  // VERIFY: Pauling value for Sn depends on oxidation state (Sn(IV) 1.96, Sn(II) 1.80). Not used in EN questions.
  { symbol: "Sn", name: "tin", group: 14, period: 5, en: 1.96 },
  { symbol: "Sb", name: "antimony", group: 15, period: 5, en: 2.05 },
  { symbol: "Te", name: "tellurium", group: 16, period: 5, en: 2.1 },
  { symbol: "I", name: "iodine", group: 17, period: 5, en: 2.66 },
  { symbol: "Xe", name: "xenon", group: 18, period: 5, en: 2.6 },

  { symbol: "Cs", name: "cesium", group: 1, period: 6, en: 0.79 },
  { symbol: "Ba", name: "barium", group: 2, period: 6, en: 0.89 },
  // VERIFY: Tl value is for Tl(I); Tl(III) is 2.04. Not used in EN questions.
  { symbol: "Tl", name: "thallium", group: 13, period: 6, en: 1.62 },
  // VERIFY: Pb value 2.33 is for Pb(IV); Pb(II) is 1.87. Tables disagree. Not used in EN questions.
  { symbol: "Pb", name: "lead", group: 14, period: 6, en: 2.33 },
  { symbol: "Bi", name: "bismuth", group: 15, period: 6, en: 2.02 },
  // VERIFY: Po and At values are estimates in most tables. Not used in EN questions.
  { symbol: "Po", name: "polonium", group: 16, period: 6, en: 2.0 },
  { symbol: "At", name: "astatine", group: 17, period: 6, en: 2.2 },
  { symbol: "Rn", name: "radon", group: 18, period: 6, en: null },
];

const BY_SYMBOL = new Map(MAIN_GROUP.map((e) => [e.symbol, e]));

export function mainGroup(symbol: string): MainGroupElement | undefined {
  return BY_SYMBOL.get(symbol);
}

/** Valence electrons from the group number: groups 1, 2, 13–18 → 1, 2, 3–8; He → 2. */
export function valenceElectrons(symbol: string): number {
  const el = BY_SYMBOL.get(symbol);
  if (!el) throw new Error(`No main-group data for ${symbol}`);
  if (el.symbol === "He") return 2;
  return el.group <= 2 ? el.group : el.group - 10;
}

export function electronegativity(symbol: string): number {
  const en = BY_SYMBOL.get(symbol)?.en;
  if (en == null) throw new Error(`No electronegativity for ${symbol}`);
  return en;
}

/** Elements used in electronegativity questions (well-established single values). */
export const EN_QUIZ_POOL = [
  "H", "Li", "Be", "B", "C", "N", "O", "F", "Na", "Mg", "Al", "Si",
  "P", "S", "Cl", "K", "Ca", "Se", "Br", "I", "Cs", "Ba",
];

/** Every element symbol, used to validate formulas in the data files. */
export const ALL_SYMBOLS = new Set(
  (
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
    "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce " +
    "Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn " +
    "Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl " +
    "Mc Lv Ts Og"
  ).split(" "),
);
