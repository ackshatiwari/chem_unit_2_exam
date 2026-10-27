// One row per species, checked against the standard VSEPR table
// (domains → electron geometry; bonding domains + lone pairs → shape).
//
// Conventions:
// - `formula` is the app's plain-text form, charge included ("NO3 -").
// - `bondingDomains` counts atoms bonded to the central atom (a double or
//   triple bond is one domain).
// - `lonePairs` is lone pairs on the central atom. For odd-electron species the
//   unpaired electron is counted as a (half-filled) domain here.
// - Diatomics have centralAtom: null and no bond angle.

export type ElectronGeometry =
  | "linear"
  | "trigonal planar"
  | "tetrahedral"
  | "trigonal bipyramidal"
  | "octahedral";

export type MolecularGeometry =
  | "linear"
  | "trigonal planar"
  | "bent"
  | "tetrahedral"
  | "trigonal pyramidal"
  | "trigonal bipyramidal"
  | "seesaw"
  | "T-shaped"
  | "octahedral"
  | "square pyramidal"
  | "square planar";

export type OctetCategory = "octet" | "incomplete" | "expanded" | "odd";

/** Why a molecule is or isn't polar, for G1. */
export type PolarityReason = "polar" | "cancel" | "no-polar-bonds";

export interface Molecule {
  formula: string;
  charge: number;
  centralAtom: string | null;
  totalValence: number;
  domains: number;
  bondingDomains: number;
  lonePairs: number;
  electronGeometry: ElectronGeometry;
  molecularGeometry: MolecularGeometry;
  idealAngles: number[];
  /** Net dipole. Ions are marked false and left out of polarity questions. */
  polar: boolean;
  octet: OctetCategory;
  resonance: boolean;
  /** Real bond angle relative to the ideal, for lone-pair species ("less", "equal"). */
  angleVsIdeal?: "less" | "equal";
  /** Measured angle, used only in MC explanations. */
  actualAngle?: string;
  polarityReason?: PolarityReason;
  /** Extra sentence for the polarity explanation. */
  polarityNote?: string;
  /** Leave out of these question groups (borderline or debated cases). */
  skip?: ("octet" | "vsepr" | "polarity-why" | "polarity")[];
}

const EG: Record<number, ElectronGeometry> = {
  2: "linear",
  3: "trigonal planar",
  4: "tetrahedral",
  5: "trigonal bipyramidal",
  6: "octahedral",
};

// Every column is written out by hand (nothing derived), so the consistency
// tests check real data against the VSEPR tables at the bottom of this file.
const ROWS: Molecule[] = [
  // ---- 2 domains ----
  {
    formula: "CO2", charge: 0, centralAtom: "C", totalValence: 16,
    domains: 2, bondingDomains: 2, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [180],
    polar: false, octet: "octet", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "BeCl2", charge: 0, centralAtom: "Be", totalValence: 16,
    domains: 2, bondingDomains: 2, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [180],
    polar: false, octet: "incomplete", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "HCN", charge: 0, centralAtom: "C", totalValence: 10,
    domains: 2, bondingDomains: 2, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [180],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    polarityNote: "The two ends (H and N) are different, so nothing cancels the C≡N dipole.",
  },

  // ---- 3 domains ----
  {
    formula: "BF3", charge: 0, centralAtom: "B", totalValence: 24,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "incomplete", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "BH3", charge: 0, centralAtom: "B", totalValence: 6,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "incomplete", resonance: false,
    polarityNote: "B–H bonds are nearly nonpolar, and the trigonal planar shape is symmetric anyway.",
    // B–H ΔEN is only 0.16, so "no polar bonds" vs "cancel" is a judgment call.
    skip: ["polarity-why"],
  },
  {
    formula: "AlCl3", charge: 0, centralAtom: "Al", totalValence: 24,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "incomplete", resonance: false, polarityReason: "cancel",
    // VERIFY: treated as the AlCl3 monomer; the solid/vapor is largely Al2Cl6.
  },
  {
    formula: "SO3", charge: 0, centralAtom: "S", totalValence: 24,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "octet", resonance: true, polarityReason: "cancel",
    // VERIFY: octet category depends on the drawing your class uses (one S=O with
    // formal charges = octet + resonance; three S=O = expanded). Left out of E questions.
    skip: ["octet"],
  },
  {
    formula: "NO3 -", charge: -1, centralAtom: "N", totalValence: 24,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "octet", resonance: true,
  },
  {
    formula: "CO3 2-", charge: -2, centralAtom: "C", totalValence: 24,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: false, octet: "octet", resonance: true,
  },
  {
    formula: "CH2O", charge: 0, centralAtom: "C", totalValence: 12,
    domains: 3, bondingDomains: 3, lonePairs: 0,
    electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", idealAngles: [120],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    polarityNote: "The polar C=O bond is not balanced by the two C–H bonds.",
  },
  {
    formula: "SO2", charge: 0, centralAtom: "S", totalValence: 18,
    domains: 3, bondingDomains: 2, lonePairs: 1,
    electronGeometry: "trigonal planar", molecularGeometry: "bent", idealAngles: [120],
    polar: true, octet: "octet", resonance: true, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈119°",
    // VERIFY: same drawing question as SO3 (octet + resonance vs. expanded). Left out of E questions.
    skip: ["octet"],
  },
  {
    formula: "O3", charge: 0, centralAtom: "O", totalValence: 18,
    domains: 3, bondingDomains: 2, lonePairs: 1,
    electronGeometry: "trigonal planar", molecularGeometry: "bent", idealAngles: [120],
    polar: true, octet: "octet", resonance: true,
    angleVsIdeal: "less", actualAngle: "≈117°",
    // O3 is weakly polar even though every bond is O–O; too subtle for the
    // "polar bonds + shape" rule, so it is left out of polarity questions.
    skip: ["polarity", "polarity-why"],
  },
  {
    formula: "NO2 -", charge: -1, centralAtom: "N", totalValence: 18,
    domains: 3, bondingDomains: 2, lonePairs: 1,
    electronGeometry: "trigonal planar", molecularGeometry: "bent", idealAngles: [120],
    polar: false, octet: "octet", resonance: true,
    angleVsIdeal: "less", actualAngle: "≈115°",
  },

  // ---- 4 domains ----
  {
    formula: "CH4", charge: 0, centralAtom: "C", totalValence: 8,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: false, octet: "octet", resonance: false,
    polarityNote: "C–H bonds are nearly nonpolar, and the tetrahedral shape is symmetric anyway.",
    // C–H ΔEN is 0.35, right at the nonpolar cutoff: "cancel" vs "no polar bonds" is debatable.
    skip: ["polarity-why"],
  },
  {
    formula: "NH4 +", charge: 1, centralAtom: "N", totalValence: 8,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: false, octet: "octet", resonance: false,
  },
  {
    formula: "BF4 -", charge: -1, centralAtom: "B", totalValence: 32,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: false, octet: "octet", resonance: false,
  },
  {
    formula: "CCl4", charge: 0, centralAtom: "C", totalValence: 32,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: false, octet: "octet", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "CH2Cl2", charge: 0, centralAtom: "C", totalValence: 20,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    polarityNote: "Tetrahedral, but two C–Cl and two C–H bonds are not the same, so the dipoles don't cancel.",
  },
  {
    formula: "CHCl3", charge: 0, centralAtom: "C", totalValence: 26,
    domains: 4, bondingDomains: 4, lonePairs: 0,
    electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    polarityNote: "Tetrahedral, but one C–H among three C–Cl bonds leaves a net dipole.",
  },
  {
    formula: "NH3", charge: 0, centralAtom: "N", totalValence: 8,
    domains: 4, bondingDomains: 3, lonePairs: 1,
    electronGeometry: "tetrahedral", molecularGeometry: "trigonal pyramidal", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈107°",
  },
  {
    formula: "H3O +", charge: 1, centralAtom: "O", totalValence: 8,
    domains: 4, bondingDomains: 3, lonePairs: 1,
    electronGeometry: "tetrahedral", molecularGeometry: "trigonal pyramidal", idealAngles: [109.5],
    polar: false, octet: "octet", resonance: false,
    // VERIFY: measured H–O–H in H3O+ is reported around 110–113°, i.e. not clearly
    // compressed, so H3O+ is not used in the "lone pairs compress angles" question.
  },
  {
    formula: "PCl3", charge: 0, centralAtom: "P", totalValence: 26,
    domains: 4, bondingDomains: 3, lonePairs: 1,
    electronGeometry: "tetrahedral", molecularGeometry: "trigonal pyramidal", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈100°",
  },
  {
    formula: "H2O", charge: 0, centralAtom: "O", totalValence: 8,
    domains: 4, bondingDomains: 2, lonePairs: 2,
    electronGeometry: "tetrahedral", molecularGeometry: "bent", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈104.5°",
  },
  {
    formula: "H2S", charge: 0, centralAtom: "S", totalValence: 8,
    domains: 4, bondingDomains: 2, lonePairs: 2,
    electronGeometry: "tetrahedral", molecularGeometry: "bent", idealAngles: [109.5],
    polar: true, octet: "octet", resonance: false,
    angleVsIdeal: "less", actualAngle: "≈92°",
    polarityNote: "S–H bonds are only slightly polar, but the bent shape with 2 lone pairs keeps the dipoles from cancelling.",
    // S–H ΔEN is 0.38 (just under the nonpolar cutoff) yet H2S is polar, so it is
    // only used in the plain polar/nonpolar round.
    skip: ["polarity-why"],
  },

  // ---- 5 domains ----
  {
    formula: "PCl5", charge: 0, centralAtom: "P", totalValence: 40,
    domains: 5, bondingDomains: 5, lonePairs: 0,
    electronGeometry: "trigonal bipyramidal", molecularGeometry: "trigonal bipyramidal", idealAngles: [90, 120],
    polar: false, octet: "expanded", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "SF4", charge: 0, centralAtom: "S", totalValence: 34,
    domains: 5, bondingDomains: 4, lonePairs: 1,
    electronGeometry: "trigonal bipyramidal", molecularGeometry: "seesaw", idealAngles: [90, 120],
    polar: true, octet: "expanded", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈102° (equatorial) and ≈87° (axial–equatorial)",
  },
  {
    formula: "ClF3", charge: 0, centralAtom: "Cl", totalValence: 28,
    domains: 5, bondingDomains: 3, lonePairs: 2,
    electronGeometry: "trigonal bipyramidal", molecularGeometry: "T-shaped", idealAngles: [90],
    polar: true, octet: "expanded", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈87.5°",
  },
  {
    formula: "XeF2", charge: 0, centralAtom: "Xe", totalValence: 22,
    domains: 5, bondingDomains: 2, lonePairs: 3,
    electronGeometry: "trigonal bipyramidal", molecularGeometry: "linear", idealAngles: [180],
    polar: false, octet: "expanded", resonance: false, polarityReason: "cancel",
    angleVsIdeal: "equal", actualAngle: "180°",
  },
  {
    formula: "I3 -", charge: -1, centralAtom: "I", totalValence: 22,
    domains: 5, bondingDomains: 2, lonePairs: 3,
    electronGeometry: "trigonal bipyramidal", molecularGeometry: "linear", idealAngles: [180],
    polar: false, octet: "expanded", resonance: false,
    angleVsIdeal: "equal", actualAngle: "180°",
  },

  // ---- 6 domains ----
  {
    formula: "SF6", charge: 0, centralAtom: "S", totalValence: 48,
    domains: 6, bondingDomains: 6, lonePairs: 0,
    electronGeometry: "octahedral", molecularGeometry: "octahedral", idealAngles: [90],
    polar: false, octet: "expanded", resonance: false, polarityReason: "cancel",
  },
  {
    formula: "BrF5", charge: 0, centralAtom: "Br", totalValence: 42,
    domains: 6, bondingDomains: 5, lonePairs: 1,
    electronGeometry: "octahedral", molecularGeometry: "square pyramidal", idealAngles: [90],
    polar: true, octet: "expanded", resonance: false, polarityReason: "polar",
    angleVsIdeal: "less", actualAngle: "≈85°",
  },
  {
    formula: "XeF4", charge: 0, centralAtom: "Xe", totalValence: 36,
    domains: 6, bondingDomains: 4, lonePairs: 2,
    electronGeometry: "octahedral", molecularGeometry: "square planar", idealAngles: [90],
    polar: false, octet: "expanded", resonance: false, polarityReason: "cancel",
    angleVsIdeal: "equal", actualAngle: "90°",
  },

  // ---- odd-electron species (left out of VSEPR questions) ----
  {
    formula: "NO", charge: 0, centralAtom: null, totalValence: 11,
    domains: 1, bondingDomains: 1, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [],
    polar: true, octet: "odd", resonance: false,
    // N–O ΔEN is exactly 0.40, on the nonpolar cutoff.
    skip: ["vsepr", "polarity-why", "polarity"],
  },
  {
    formula: "NO2", charge: 0, centralAtom: "N", totalValence: 17,
    domains: 3, bondingDomains: 2, lonePairs: 1,
    electronGeometry: "trigonal planar", molecularGeometry: "bent", idealAngles: [120],
    polar: true, octet: "odd", resonance: true,
    // The single unpaired electron counts as one domain; measured angle ≈134° (wider, not narrower).
    skip: ["vsepr", "polarity-why", "polarity"],
  },
  {
    formula: "ClO2", charge: 0, centralAtom: "Cl", totalValence: 19,
    domains: 4, bondingDomains: 2, lonePairs: 2,
    electronGeometry: "tetrahedral", molecularGeometry: "bent", idealAngles: [109.5],
    polar: true, octet: "odd", resonance: true,
    // VERIFY: ClO2 has 19 e⁻. Here Cl's lone electrons (one pair + one unpaired electron, or
    // two pairs in some drawings) are counted as 2 domains → 4 domains, bent. Texts vary, and the
    // measured angle is ≈117.5°. Left out of VSEPR and polarity questions.
    skip: ["vsepr", "polarity-why", "polarity"],
  },

  // ---- diatomics ----
  {
    formula: "HF", charge: 0, centralAtom: null, totalValence: 8,
    domains: 1, bondingDomains: 1, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    skip: ["vsepr"],
  },
  {
    formula: "CO", charge: 0, centralAtom: null, totalValence: 10,
    domains: 1, bondingDomains: 1, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [],
    polar: true, octet: "octet", resonance: false, polarityReason: "polar",
    skip: ["vsepr"],
  },
  {
    formula: "N2", charge: 0, centralAtom: null, totalValence: 10,
    domains: 1, bondingDomains: 1, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [],
    polar: false, octet: "octet", resonance: false, polarityReason: "no-polar-bonds",
    skip: ["vsepr"],
  },
  {
    formula: "O2", charge: 0, centralAtom: null, totalValence: 12,
    domains: 1, bondingDomains: 1, lonePairs: 0,
    electronGeometry: "linear", molecularGeometry: "linear", idealAngles: [],
    polar: false, octet: "octet", resonance: false, polarityReason: "no-polar-bonds",
    // The Lewis structure O=O satisfies the octet rule (real O2 is a diradical; beyond this unit).
    skip: ["vsepr"],
  },
];

export const MOLECULES: Molecule[] = ROWS;

export const MOLECULE_BY_FORMULA = new Map(MOLECULES.map((m) => [m.formula, m]));

export function molecule(formula: string): Molecule {
  const m = MOLECULE_BY_FORMULA.get(formula);
  if (!m) throw new Error(`No molecule row for ${formula}`);
  return m;
}

/** Standard VSEPR table: total domains → electron geometry. */
export const ELECTRON_GEOMETRY_BY_DOMAINS = EG;

/** Standard VSEPR table: `${domains},${lonePairs}` → molecular geometry. */
export const SHAPE_BY_DOMAINS: Record<string, MolecularGeometry> = {
  "2,0": "linear",
  "3,0": "trigonal planar",
  "3,1": "bent",
  "4,0": "tetrahedral",
  "4,1": "trigonal pyramidal",
  "4,2": "bent",
  "5,0": "trigonal bipyramidal",
  "5,1": "seesaw",
  "5,2": "T-shaped",
  "5,3": "linear",
  "6,0": "octahedral",
  "6,1": "square pyramidal",
  "6,2": "square planar",
};

/** Ideal angles for each shape, keyed like SHAPE_BY_DOMAINS. */
export const IDEAL_ANGLES_BY_DOMAINS: Record<string, number[]> = {
  "2,0": [180],
  "3,0": [120],
  "3,1": [120],
  "4,0": [109.5],
  "4,1": [109.5],
  "4,2": [109.5],
  "5,0": [90, 120],
  "5,1": [90, 120],
  "5,2": [90],
  "5,3": [180],
  "6,0": [90],
  "6,1": [90],
  "6,2": [90],
};

export const ELECTRON_GEOMETRIES: ElectronGeometry[] = Object.values(EG);
export const MOLECULAR_GEOMETRIES: MolecularGeometry[] = [...new Set(Object.values(SHAPE_BY_DOMAINS))];

export const OCTET_LABELS: Record<OctetCategory, string> = {
  octet: "Follows the octet rule",
  incomplete: "Incomplete octet",
  expanded: "Expanded octet",
  odd: "Odd-electron species",
};
