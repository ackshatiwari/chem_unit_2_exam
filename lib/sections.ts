export type SectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export interface Sublabel {
  id: string;
  text: string;
}

export interface Section {
  id: SectionId;
  title: string;
  sublabels: Sublabel[];
}

export const SECTIONS: Section[] = [
  {
    id: "A",
    title: "Electrons & bonding type",
    sublabels: [
      { id: "A1", text: "I can count valence electrons for any main-group element." },
      { id: "A2", text: "I can count valence electrons for ions (add for – charge, subtract for + charge)." },
      { id: "A3", text: "I can decide if a bond is ionic / polar covalent / nonpolar covalent using electronegativity." },
      { id: "A4", text: "I can identify the most polar / least polar bond given EN values." },
    ],
  },
  {
    id: "B",
    title: "Bonding capacity & bond order",
    sublabels: [
      { id: "B1", text: "I know standard atoms' limits for single / double / triple bonds." },
      { id: "B2", text: "I can relate bond order to bond length and bond strength (triple = shortest/strongest; single = longest/weakest)." },
      { id: "B3", text: "I can compare bond distances across molecules." },
    ],
  },
  {
    id: "C",
    title: "Lewis structures",
    sublabels: [
      { id: "C1", text: "I can write a correct Lewis structure for molecules and polyatomic ions." },
      { id: "C2", text: "I can calculate total valence electrons before drawing." },
      { id: "C3", text: "I can handle multiple bonds when needed." },
      { id: "C4", text: "I can recognize when multiple valid drawings imply resonance." },
    ],
  },
  {
    id: "D",
    title: "Formal charge & resonance",
    sublabels: [
      { id: "D1", text: "I can compute formal charge on any atom in my Lewis structure." },
      { id: "D2", text: "I know resonance structures differ by electron placement, not atom positions." },
      { id: "D3", text: "I can explain resonance as the average/hybrid of forms." },
    ],
  },
  {
    id: "E",
    title: "Octet rule & exceptions",
    sublabels: [
      { id: "E1", text: "I can identify molecules that follow the octet rule." },
      { id: "E2", text: "I can identify incomplete octet examples." },
      { id: "E3", text: "I can identify expanded octet examples." },
      { id: "E4", text: "I can identify odd-electron species (uneven total valence electrons)." },
    ],
  },
  {
    id: "F",
    title: "VSEPR geometry + angles",
    sublabels: [
      { id: "F1", text: "I can count electron domains." },
      { id: "F2", text: "I can find electron-domain geometry (linear…octahedral)." },
      { id: "F3", text: "I can determine molecular geometry (bent, trigonal pyramidal, seesaw, T-shaped, square planar, etc.)." },
      { id: "F4", text: "I know common bond angles: 180°, 120°, 109.5°, 90° — and that lone pairs compress angles some." },
    ],
  },
  {
    id: "G",
    title: "Polarity",
    sublabels: [
      { id: "G1", text: "I can decide if a molecule has a dipole moment using (1) polar bonds + (2) shape/symmetry." },
      { id: "G2", text: "I can label molecules as polar vs nonpolar confidently." },
    ],
  },
  {
    id: "H",
    title: "Naming",
    sublabels: [
      { id: "H1", text: "I can name/write ionic compounds (including transition metals: Roman numerals)." },
      { id: "H2", text: "I can name/write acids." },
      { id: "H3", text: "I can name/write hydrates (· xH₂O)." },
      { id: "H4", text: "I can name/write correct formulas using polyatomic ions." },
      { id: "H5", text: "I can name/write molecules." },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}

const SUBLABELS = new Map(SECTIONS.flatMap((s) => s.sublabels.map((l) => [l.id, l] as const)));

export function getSublabel(id: string): Sublabel | undefined {
  return SUBLABELS.get(id);
}

export function sectionOfSublabel(id: string): SectionId {
  return id[0] as SectionId;
}
