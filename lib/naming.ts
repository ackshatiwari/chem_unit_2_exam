import { ELEMENT_NAMES, IDE_NAMES, PREFIXES, type Cation } from "@/data/naming";
import { splitCharge } from "./formula";

export interface IonPart {
  formula: string;
  charge: number;
  name: string;
  polyatomic: boolean;
  alt?: string[];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Counts of cation and anion that balance charge, in lowest whole-number ratio. */
export function chargeBalance(catCharge: number, anCharge: number): [number, number] {
  const c = Math.abs(catCharge);
  const a = Math.abs(anCharge);
  const lcm = (c * a) / gcd(c, a);
  return [lcm / c, lcm / a];
}

function part(formula: string, n: number, polyatomic: boolean): string {
  if (n === 1) return formula;
  return polyatomic ? `(${formula})${n}` : `${formula}${n}`;
}

/** Neutral formula for a cation + anion, e.g. Fe 3+ and NO3 - → Fe(NO3)3. */
export function compoundFormula(cat: IonPart, an: IonPart): string {
  const [nc, na] = chargeBalance(cat.charge, an.charge);
  return part(cat.formula, nc, cat.polyatomic) + part(an.formula, na, an.polyatomic);
}

/** All accepted names: every cation spelling × every anion spelling. */
export function compoundNames(cat: IonPart, an: IonPart): string[] {
  const cats = [cat.name, ...(cat.alt ?? [])];
  const ans = [an.name, ...(an.alt ?? [])];
  return cats.flatMap((c) => ans.map((a) => `${c} ${a}`));
}

export function cationPart(c: Cation): IonPart {
  return { formula: c.formula, charge: c.charge, name: c.name, polyatomic: !!c.polyatomic, alt: c.alt };
}

/** "Fe(NO3)3" + "3 × NO3− = 3− total, so Fe is 3+" style reasoning for formula → name. */
export function chargeReasoning(cat: IonPart, an: IonPart): string {
  const [nc, na] = chargeBalance(cat.charge, an.charge);
  const anTotal = na * Math.abs(an.charge);
  const anText = `${na === 1 ? "" : `${na} × `}{${an.formula} ${Math.abs(an.charge) === 1 ? "" : Math.abs(an.charge)}-}`;
  const per = anTotal / nc;
  const catSym = cat.formula;
  return nc === 1
    ? `${anText} = ${anTotal}− total, so ${catSym} is ${per}+`
    : `${anText} = ${anTotal}− shared by ${nc} ${catSym}, so each ${catSym} is ${per}+`;
}

/* ---------- binary covalent ---------- */

/** Prefix + word, dropping the prefix's final a/o before a vowel-initial "oxide". */
function prefixed(n: number, word: string, elide: boolean): string {
  const p = PREFIXES[n];
  if (elide && word.startsWith("o") && /[ao]$/.test(p)) return p.slice(0, -1) + word;
  return p + word;
}

/**
 * Binary covalent name. "mono" is dropped on the first element, and the doubled
 * vowel is dropped before "oxide" (monoxide, tetroxide).
 * Returns the preferred name first, then accepted alternates (tetraoxide, but never monooxide).
 */
export function covalentNames(a: string, na: number, b: string, nb: number): string[] {
  const first = (na === 1 ? "" : PREFIXES[na]) + ELEMENT_NAMES[a];
  const second = IDE_NAMES[b];
  const preferred = `${first} ${prefixed(nb, second, true)}`;
  const names = [preferred];
  const unelided = `${first} ${prefixed(nb, second, false)}`;
  // Keep "tetraoxide"-style spellings as alternates, but not the doubled "oo" of "monooxide".
  if (unelided !== preferred && !/oo/.test(unelided)) names.push(unelided);
  return names;
}

/* ---------- acids ---------- */

/** Oxyacid / -ide acid name from an anion name (sulfate → sulfuric acid, cyanide → hydrocyanic acid). */
export function acidNameFromAnion(anion: string): string {
  if (anion.endsWith("ide")) return `hydro${anion.slice(0, -3)}ic acid`;
  const special: [RegExp, string][] = [
    [/sulfate$/, "sulfuric"],
    [/sulfite$/, "sulfurous"],
    [/phosphate$/, "phosphoric"],
    [/phosphite$/, "phosphorous"],
  ];
  for (const [re, rep] of special) if (re.test(anion)) return `${anion.replace(re, rep)} acid`;
  if (anion.endsWith("ate")) return `${anion.slice(0, -3)}ic acid`;
  if (anion.endsWith("ite")) return `${anion.slice(0, -3)}ous acid`;
  throw new Error(`Can't make an acid name from ${anion}`);
}

export function acidFormula(anionFormula: string, anionCharge: number): string {
  const n = Math.abs(anionCharge);
  return `H${n === 1 ? "" : n}${anionFormula}`;
}

/* ---------- hydrates ---------- */

export function hydrateFormula(salt: string, water: number): string {
  return `${salt}·${water === 1 ? "" : water}H2O`;
}

export function hydrateName(saltName: string, water: number): string {
  return `${saltName} ${PREFIXES[water]}hydrate`;
}

/** Parse "Cu 2+" style ion text into formula + charge. */
export function ionText(text: string): { formula: string; charge: number } {
  const { body, charge } = splitCharge(text);
  return { formula: body, charge };
}
