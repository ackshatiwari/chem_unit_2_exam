import { formatFormula } from "@/lib/formula";

export interface Ion {
  /** Formula body without the charge, e.g. "SO3". */
  formula: string;
  /** Signed charge, e.g. -2. */
  charge: number;
  name: string;
  alt?: string[];
}

export interface IonSet {
  id: string;
  title: string;
  ions: Ion[];
}

const OX_1_PLUS: Ion[] = [{ formula: "NH4", charge: 1, name: "ammonium" }];

const OX_1_MINUS: Ion[] = [
  { formula: "H2PO3", charge: -1, name: "dihydrogen phosphite" },
  { formula: "H2PO4", charge: -1, name: "dihydrogen phosphate" },
  { formula: "HSO3", charge: -1, name: "hydrogen sulfite" },
  { formula: "HSO4", charge: -1, name: "hydrogen sulfate" },
  { formula: "HC2O4", charge: -1, name: "hydrogen oxalate" },
  { formula: "SCN", charge: -1, name: "thiocyanate" },
  { formula: "CN", charge: -1, name: "cyanide" },
  { formula: "C2H3O2", charge: -1, name: "acetate" },
  { formula: "MnO4", charge: -1, name: "permanganate" },
  { formula: "HCO3", charge: -1, name: "hydrogen carbonate", alt: ["bicarbonate"] },
  { formula: "OH", charge: -1, name: "hydroxide" },
  { formula: "NO2", charge: -1, name: "nitrite" },
  { formula: "NO3", charge: -1, name: "nitrate" },
  { formula: "ClO", charge: -1, name: "hypochlorite" },
  { formula: "ClO2", charge: -1, name: "chlorite" },
  { formula: "ClO3", charge: -1, name: "chlorate" },
  { formula: "ClO4", charge: -1, name: "perchlorate" },
  { formula: "IO", charge: -1, name: "hypoiodite" },
  { formula: "IO2", charge: -1, name: "iodite" },
  { formula: "IO3", charge: -1, name: "iodate" },
  { formula: "IO4", charge: -1, name: "periodate" },
  { formula: "BrO", charge: -1, name: "hypobromite" },
  { formula: "BrO2", charge: -1, name: "bromite" },
  { formula: "BrO3", charge: -1, name: "bromate" },
  { formula: "BrO4", charge: -1, name: "perbromate" },
];

const OX_2_MINUS: Ion[] = [
  { formula: "HPO3", charge: -2, name: "hydrogen phosphite" },
  { formula: "HPO4", charge: -2, name: "hydrogen phosphate" },
  { formula: "SO3", charge: -2, name: "sulfite" },
  { formula: "SO4", charge: -2, name: "sulfate" },
  { formula: "C2O4", charge: -2, name: "oxalate" },
  { formula: "S2O3", charge: -2, name: "thiosulfate" },
  { formula: "SiO3", charge: -2, name: "silicate" },
  { formula: "CrO4", charge: -2, name: "chromate" },
  { formula: "Cr2O7", charge: -2, name: "dichromate" },
  { formula: "CO3", charge: -2, name: "carbonate" },
];

const OX_3_MINUS: Ion[] = [
  { formula: "PO3", charge: -3, name: "phosphite" },
  { formula: "PO4", charge: -3, name: "phosphate" },
  { formula: "AsO4", charge: -3, name: "arsenate" },
  { formula: "BO3", charge: -3, name: "borate" },
];

export const ALL_IONS: Ion[] = [...OX_1_PLUS, ...OX_1_MINUS, ...OX_2_MINUS, ...OX_3_MINUS];

export const ION_SETS: IonSet[] = [
  { id: "ox1p", title: "Oxidation State 1+", ions: OX_1_PLUS },
  { id: "ox1m", title: "Oxidation State 1−", ions: OX_1_MINUS },
  { id: "ox2m", title: "Oxidation State 2−", ions: OX_2_MINUS },
  { id: "ox3m", title: "Oxidation State 3−", ions: OX_3_MINUS },
  { id: "all", title: "All ions (cumulative)", ions: ALL_IONS },
];

/** Storage key and typed answer for an ion, e.g. "SO3 2-". */
export function ionKey(ion: Ion): string {
  return formatFormula(ion.formula, ion.charge);
}

export const ION_BY_KEY = new Map(ALL_IONS.map((ion) => [ionKey(ion), ion]));

/** Polyatomic anions only (for compounds and acids). */
export const POLYATOMIC_ANIONS = ALL_IONS.filter((i) => i.charge < 0);
