// Naming data for section H. Formulas use the app's plain-text style.

export interface Cation {
  formula: string;
  charge: number;
  /** Name as used in a compound, with the Roman numeral when the metal has more than one common charge. */
  name: string;
  /** Variable-charge metal: needs a Roman numeral. */
  variable: boolean;
  polyatomic?: boolean;
  /** Other accepted spellings of the cation part. */
  alt?: string[];
}

export interface MonatomicAnion {
  formula: string;
  charge: number;
  name: string;
}

export const CATIONS: Cation[] = [
  { formula: "Na", charge: 1, name: "sodium", variable: false },
  { formula: "K", charge: 1, name: "potassium", variable: false },
  { formula: "Li", charge: 1, name: "lithium", variable: false },
  { formula: "Mg", charge: 2, name: "magnesium", variable: false },
  { formula: "Ca", charge: 2, name: "calcium", variable: false },
  { formula: "Ba", charge: 2, name: "barium", variable: false },
  { formula: "Al", charge: 3, name: "aluminum", variable: false, alt: ["aluminium"] },
  { formula: "Zn", charge: 2, name: "zinc", variable: false },
  { formula: "Ag", charge: 1, name: "silver", variable: false },
  { formula: "NH4", charge: 1, name: "ammonium", variable: false, polyatomic: true },
  { formula: "Fe", charge: 2, name: "iron(II)", variable: true },
  { formula: "Fe", charge: 3, name: "iron(III)", variable: true },
  { formula: "Cu", charge: 1, name: "copper(I)", variable: true },
  { formula: "Cu", charge: 2, name: "copper(II)", variable: true },
  { formula: "Co", charge: 2, name: "cobalt(II)", variable: true },
  { formula: "Co", charge: 3, name: "cobalt(III)", variable: true },
  { formula: "Cr", charge: 2, name: "chromium(II)", variable: true },
  { formula: "Cr", charge: 3, name: "chromium(III)", variable: true },
  { formula: "Mn", charge: 2, name: "manganese(II)", variable: true },
  { formula: "Pb", charge: 2, name: "lead(II)", variable: true },
  { formula: "Pb", charge: 4, name: "lead(IV)", variable: true },
  { formula: "Sn", charge: 2, name: "tin(II)", variable: true },
  { formula: "Sn", charge: 4, name: "tin(IV)", variable: true },
  // VERIFY: Ni is almost always 2+; some classes write "nickel(II)", others just "nickel".
  // Both are accepted; "nickel(II)" is shown as the answer.
  { formula: "Ni", charge: 2, name: "nickel(II)", variable: true, alt: ["nickel"] },
];

export const MONATOMIC_ANIONS: MonatomicAnion[] = [
  { formula: "F", charge: -1, name: "fluoride" },
  { formula: "Cl", charge: -1, name: "chloride" },
  { formula: "Br", charge: -1, name: "bromide" },
  { formula: "I", charge: -1, name: "iodide" },
  { formula: "O", charge: -2, name: "oxide" },
  { formula: "S", charge: -2, name: "sulfide" },
  { formula: "N", charge: -3, name: "nitride" },
  { formula: "P", charge: -3, name: "phosphide" },
];

/** Binary acids: hydro- + root + -ic acid. */
export const BINARY_ACIDS = [
  { formula: "HF", name: "hydrofluoric acid" },
  { formula: "HCl", name: "hydrochloric acid" },
  { formula: "HBr", name: "hydrobromic acid" },
  { formula: "HI", name: "hydroiodic acid" },
  { formula: "H2S", name: "hydrosulfuric acid" },
];

/**
 * Real hydrates. `formula` and `name` are written out by hand; a test checks
 * that the compound builder produces the same thing from cation + anion + water.
 */
export const HYDRATES = [
  { cation: "Cu 2+", anion: "SO4 2-", water: 5, formula: "CuSO4·5H2O", name: "copper(II) sulfate pentahydrate" },
  { cation: "Mg 2+", anion: "SO4 2-", water: 7, formula: "MgSO4·7H2O", name: "magnesium sulfate heptahydrate" },
  { cation: "Ca 2+", anion: "Cl -", water: 2, formula: "CaCl2·2H2O", name: "calcium chloride dihydrate" },
  { cation: "Na +", anion: "CO3 2-", water: 10, formula: "Na2CO3·10H2O", name: "sodium carbonate decahydrate" },
  { cation: "Co 2+", anion: "Cl -", water: 6, formula: "CoCl2·6H2O", name: "cobalt(II) chloride hexahydrate" },
  { cation: "Ba 2+", anion: "Cl -", water: 2, formula: "BaCl2·2H2O", name: "barium chloride dihydrate" },
  { cation: "Fe 2+", anion: "SO4 2-", water: 7, formula: "FeSO4·7H2O", name: "iron(II) sulfate heptahydrate" },
  { cation: "Na +", anion: "SO4 2-", water: 10, formula: "Na2SO4·10H2O", name: "sodium sulfate decahydrate" },
  { cation: "Ca 2+", anion: "SO4 2-", water: 2, formula: "CaSO4·2H2O", name: "calcium sulfate dihydrate" },
  { cation: "Zn 2+", anion: "SO4 2-", water: 7, formula: "ZnSO4·7H2O", name: "zinc sulfate heptahydrate" },
  { cation: "Ni 2+", anion: "Cl -", water: 6, formula: "NiCl2·6H2O", name: "nickel(II) chloride hexahydrate" },
  { cation: "Mg 2+", anion: "Cl -", water: 6, formula: "MgCl2·6H2O", name: "magnesium chloride hexahydrate" },
  { cation: "Li +", anion: "Cl -", water: 1, formula: "LiCl·H2O", name: "lithium chloride monohydrate" },
  { cation: "Al 3+", anion: "Cl -", water: 6, formula: "AlCl3·6H2O", name: "aluminum chloride hexahydrate" },
  { cation: "Fe 3+", anion: "NO3 -", water: 9, formula: "Fe(NO3)3·9H2O", name: "iron(III) nitrate nonahydrate" },
  { cation: "Cu 2+", anion: "NO3 -", water: 3, formula: "Cu(NO3)2·3H2O", name: "copper(II) nitrate trihydrate" },
  { cation: "Na +", anion: "S2O3 2-", water: 5, formula: "Na2S2O3·5H2O", name: "sodium thiosulfate pentahydrate" },
  { cation: "Mn 2+", anion: "Cl -", water: 4, formula: "MnCl2·4H2O", name: "manganese(II) chloride tetrahydrate" },
  { cation: "Ba 2+", anion: "OH -", water: 8, formula: "Ba(OH)2·8H2O", name: "barium hydroxide octahydrate" },
];

/** Binary covalent compounds. Names are hand-written; a test rebuilds them from the prefix rules. */
export const COVALENT = [
  { formula: "CO", parts: ["C", 1, "O", 1], name: "carbon monoxide" },
  { formula: "CO2", parts: ["C", 1, "O", 2], name: "carbon dioxide" },
  { formula: "N2O4", parts: ["N", 2, "O", 4], name: "dinitrogen tetroxide" },
  { formula: "P4O10", parts: ["P", 4, "O", 10], name: "tetraphosphorus decoxide" },
  { formula: "SF6", parts: ["S", 1, "F", 6], name: "sulfur hexafluoride" },
  { formula: "NO2", parts: ["N", 1, "O", 2], name: "nitrogen dioxide" },
  { formula: "N2O", parts: ["N", 2, "O", 1], name: "dinitrogen monoxide" },
  { formula: "CCl4", parts: ["C", 1, "Cl", 4], name: "carbon tetrachloride" },
  { formula: "PCl3", parts: ["P", 1, "Cl", 3], name: "phosphorus trichloride" },
  { formula: "PCl5", parts: ["P", 1, "Cl", 5], name: "phosphorus pentachloride" },
  { formula: "SO3", parts: ["S", 1, "O", 3], name: "sulfur trioxide" },
  { formula: "Cl2O7", parts: ["Cl", 2, "O", 7], name: "dichlorine heptoxide" },
  { formula: "SO2", parts: ["S", 1, "O", 2], name: "sulfur dioxide" },
  { formula: "N2O5", parts: ["N", 2, "O", 5], name: "dinitrogen pentoxide" },
  { formula: "NO", parts: ["N", 1, "O", 1], name: "nitrogen monoxide" },
  { formula: "N2O3", parts: ["N", 2, "O", 3], name: "dinitrogen trioxide" },
  { formula: "P2O5", parts: ["P", 2, "O", 5], name: "diphosphorus pentoxide" },
  { formula: "SiCl4", parts: ["Si", 1, "Cl", 4], name: "silicon tetrachloride" },
  { formula: "SiO2", parts: ["Si", 1, "O", 2], name: "silicon dioxide" },
  { formula: "CS2", parts: ["C", 1, "S", 2], name: "carbon disulfide" },
  { formula: "BF3", parts: ["B", 1, "F", 3], name: "boron trifluoride" },
  { formula: "NF3", parts: ["N", 1, "F", 3], name: "nitrogen trifluoride" },
  { formula: "SF4", parts: ["S", 1, "F", 4], name: "sulfur tetrafluoride" },
  { formula: "IF7", parts: ["I", 1, "F", 7], name: "iodine heptafluoride" },
  { formula: "XeF2", parts: ["Xe", 1, "F", 2], name: "xenon difluoride" },
  { formula: "XeF4", parts: ["Xe", 1, "F", 4], name: "xenon tetrafluoride" },
  { formula: "S2Cl2", parts: ["S", 2, "Cl", 2], name: "disulfur dichloride" },
  { formula: "CBr4", parts: ["C", 1, "Br", 4], name: "carbon tetrabromide" },
  { formula: "PBr3", parts: ["P", 1, "Br", 3], name: "phosphorus tribromide" },
  { formula: "ClF3", parts: ["Cl", 1, "F", 3], name: "chlorine trifluoride" },
  { formula: "BrF5", parts: ["Br", 1, "F", 5], name: "bromine pentafluoride" },
  { formula: "Cl2O", parts: ["Cl", 2, "O", 1], name: "dichlorine monoxide" },
  { formula: "OF2", parts: ["O", 1, "F", 2], name: "oxygen difluoride" },
] as const;

export const PREFIXES = ["", "mono", "di", "tri", "tetra", "penta", "hexa", "hepta", "octa", "nona", "deca"];

/** Element names for the first element of a covalent name. */
export const ELEMENT_NAMES: Record<string, string> = {
  B: "boron", C: "carbon", N: "nitrogen", O: "oxygen", F: "fluorine", Si: "silicon", P: "phosphorus",
  S: "sulfur", Cl: "chlorine", Se: "selenium", Br: "bromine", I: "iodine", Xe: "xenon",
};

/** "-ide" names for the second element. */
export const IDE_NAMES: Record<string, string> = {
  O: "oxide", F: "fluoride", Cl: "chloride", Br: "bromide", I: "iodide", S: "sulfide", N: "nitride", Se: "selenide",
};
