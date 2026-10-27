// Bonding-capacity and bond-order data for section B.

/** Typical bonding in neutral molecules. */
export const BONDING_CAPACITY = [
  { el: "H", name: "hydrogen", bonds: 1, maxOrder: 1 },
  { el: "F", name: "fluorine", bonds: 1, maxOrder: 1 },
  { el: "Cl", name: "chlorine", bonds: 1, maxOrder: 1 },
  { el: "Br", name: "bromine", bonds: 1, maxOrder: 1 },
  { el: "I", name: "iodine", bonds: 1, maxOrder: 1 },
  { el: "O", name: "oxygen", bonds: 2, maxOrder: 2 },
  { el: "N", name: "nitrogen", bonds: 3, maxOrder: 3 },
  { el: "C", name: "carbon", bonds: 4, maxOrder: 3 },
] as const;

/** Same two atoms at bond order 1, 2, 3. */
export const BOND_FAMILIES = [
  ["C", "C"],
  ["C", "N"],
  ["C", "O"],
  ["N", "N"],
] as const;

export const BOND_SYMBOL = { 1: "–", 2: "=", 3: "≡" } as const;

export interface BondCompareItem {
  /** Rich-text label, e.g. "ethane ({C2H6})". */
  label: string;
  order: number;
  orderText: string;
  /** Approximate bond length in pm, when well established. */
  length?: number;
}

export interface BondCompareSet {
  id: string;
  /** What is being compared, e.g. "C–O bond". */
  bond: string;
  items: BondCompareItem[];
}

// Bond lengths are standard experimental values, rounded (CRC Handbook / general-chemistry tables).
export const BOND_COMPARE_SETS: BondCompareSet[] = [
  {
    id: "CO",
    bond: "C–O bond",
    items: [
      { label: "{CO}", order: 3, orderText: "3 (triple)", length: 113 },
      { label: "{CO2}", order: 2, orderText: "2 (double)", length: 116 },
      { label: "{CO3 2-}", order: 4 / 3, orderText: "1⅓ (resonance over 3 bonds)", length: 129 },
      { label: "methanol ({CH3OH})", order: 1, orderText: "1 (single)", length: 143 },
    ],
  },
  {
    id: "diatomic",
    bond: "bond",
    items: [
      { label: "{N2}", order: 3, orderText: "3 (N≡N)", length: 110 },
      { label: "{O2}", order: 2, orderText: "2 (O=O)", length: 121 },
      { label: "{F2}", order: 1, orderText: "1 (F–F)", length: 142 },
    ],
  },
  {
    id: "CC",
    bond: "C–C bond",
    items: [
      { label: "ethane ({C2H6})", order: 1, orderText: "1 (single)", length: 154 },
      { label: "benzene ({C6H6})", order: 1.5, orderText: "1½ (resonance)", length: 140 },
      { label: "ethene ({C2H4})", order: 2, orderText: "2 (double)", length: 134 },
      { label: "ethyne ({C2H2})", order: 3, orderText: "3 (triple)", length: 120 },
    ],
  },
  {
    id: "OO",
    bond: "O–O bond",
    items: [
      { label: "hydrogen peroxide ({H2O2})", order: 1, orderText: "1 (single)", length: 148 },
      { label: "ozone ({O3})", order: 1.5, orderText: "1½ (resonance)", length: 128 },
      { label: "{O2}", order: 2, orderText: "2 (double)", length: 121 },
    ],
  },
  {
    id: "NO",
    bond: "N–O bond",
    items: [
      // VERIFY: this set relies on bond-order reasoning only (1½ > 1⅓, so NO2- is shorter).
      // Measured N–O lengths in the two ions are within a pm or two of each other.
      { label: "{NO2 -}", order: 1.5, orderText: "1½ (resonance over 2 bonds)" },
      { label: "{NO3 -}", order: 4 / 3, orderText: "1⅓ (resonance over 3 bonds)" },
    ],
  },
];
