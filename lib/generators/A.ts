import { electronegativity, EN_QUIZ_POOL, MAIN_GROUP, valenceElectrons } from "@/data/elements";
import { ALL_IONS, ionKey } from "@/data/polyatomic";
import { bondType, deltaEN, totalValence, type BondType } from "../chem";
import { IONIC_MIN, NONPOLAR_MAX } from "../config";
import { countAtoms } from "../formula";
import { mc, typed, type Generator } from "../question";

const groupText = (g: number) => `group ${g}`;

const A1: Generator = (rng) => {
  const el = rng.pick(MAIN_GROUP);
  const v = valenceElectrons(el.symbol);
  const why =
    el.symbol === "He"
      ? "He has only 2 electrons, and both are valence electrons (a full first shell)."
      : `${el.symbol} is in ${groupText(el.group)} → ${v} valence electron${v === 1 ? "" : "s"}.`;
  return typed("A1", el.symbol, `How many valence electrons does ${el.symbol} (${el.name}) have?`, "integer", String(v), why);
};

/** Monatomic anions: each ends up with 8 valence electrons. */
const MONO_ANIONS = ["F -", "Cl -", "Br -", "I -", "O 2-", "S 2-", "Se 2-", "N 3-", "P 3-"];

/** Polyatomic ions made only of main-group atoms (so valence counts come from the group). */
const MAIN_GROUP_SYMBOLS = new Set(MAIN_GROUP.map((e) => e.symbol));
const POLY_IONS = [
  ...ALL_IONS.map(ionKey),
  "H3O +",
  "NO2 -",
].filter((k, i, arr) => arr.indexOf(k) === i && [...countAtoms(k).keys()].every((s) => MAIN_GROUP_SYMBOLS.has(s)));

const A2: Generator = (rng) => {
  if (rng.chance(0.3)) {
    const ion = rng.pick(MONO_ANIONS);
    const { total, work } = totalValence(ion);
    return typed("A2", ion, `How many valence electrons does {${ion}} have?`, "integer", String(total), `${work}.`);
  }
  const ion = rng.pick(POLY_IONS);
  const { total, work } = totalValence(ion);
  return typed("A2", ion, `Total valence electrons in {${ion}}?`, "integer", String(total), `${work}.`);
};

const BOND_TYPES: BondType[] = ["Ionic", "Polar covalent", "Nonpolar covalent"];

/** Skip pairs this close to a cutoff so the answer never hinges on ≤ vs <. */
const MARGIN = 0.06;

function nearCutoff(d: number): boolean {
  return Math.abs(d - NONPOLAR_MAX) < MARGIN || Math.abs(d - IONIC_MIN) < MARGIN;
}

function bondLabel(a: string, b: string): string {
  return `${a}–${b}`;
}

function enPair(a: string, b: string): string {
  return `${a} (EN ${electronegativity(a).toFixed(2)}) and ${b} (EN ${electronegativity(b).toFixed(2)})`;
}

function cutoffText(type: BondType): string {
  if (type === "Nonpolar covalent") return `≤ ${NONPOLAR_MAX} → nonpolar covalent`;
  if (type === "Ionic") return `≥ ${IONIC_MIN} → ionic`;
  return `between ${NONPOLAR_MAX} and ${IONIC_MIN} → polar covalent`;
}

/** Metals in the EN pool. Two metals bond metallically, so every A3 pair includes a nonmetal. */
const METALS = new Set(["Li", "Be", "Na", "Mg", "Al", "K", "Ca", "Cs", "Ba"]);
const NONMETALS = EN_QUIZ_POOL.filter((e) => !METALS.has(e));

const A3: Generator = (rng) => {
  // Pick the answer type first so the three types come up about equally.
  const target = rng.pick(BOND_TYPES);
  for (let tries = 0; tries < 500; tries++) {
    const a = rng.pick(NONMETALS);
    const b = target === "Nonpolar covalent" && rng.chance(0.25) ? a : rng.pick(EN_QUIZ_POOL);
    const d = deltaEN(a, b);
    if (nearCutoff(d) || bondType(d) !== target) continue;
    const [x, y] = electronegativity(a) <= electronegativity(b) ? [a, b] : [b, a];
    return mc(
      "A3",
      `${x}-${y}`,
      `A bond forms between ${enPair(x, y)}. What type of bond is it?`,
      target,
      BOND_TYPES,
      `ΔEN = |${electronegativity(y).toFixed(2)} − ${electronegativity(x).toFixed(2)}| = ${d.toFixed(2)}, ${cutoffText(target)}.`,
      rng,
    );
  }
  throw new Error("A3: no pair found");
};

/** Nonmetals + H: the bonds you'd compare for polarity. */
const A4_POOL = ["H", "B", "C", "N", "O", "F", "Si", "P", "S", "Cl", "Se", "Br", "I"];

const A4: Generator = (rng) => {
  const most = rng.chance(0.5);
  for (let tries = 0; tries < 500; tries++) {
    const bonds: [string, string][] = [];
    const seen = new Set<string>();
    while (bonds.length < 4) {
      const [a, b] = rng.sample(A4_POOL, 2);
      const key = [a, b].sort().join("");
      if (seen.has(key)) continue;
      seen.add(key);
      bonds.push(electronegativity(a) <= electronegativity(b) ? [a, b] : [b, a]);
    }
    const ds = bonds.map(([a, b]) => deltaEN(a, b));
    const sorted = [...ds].sort((p, q) => p - q);
    // The answer must win clearly (by 0.1 or more).
    if (most ? sorted[3] - sorted[2] < 0.1 : sorted[1] - sorted[0] < 0.1) continue;
    const target = most ? sorted[3] : sorted[0];
    const idx = ds.indexOf(target);
    const label = (i: number) => `${bondLabel(...bonds[i])}  (${electronegativity(bonds[i][0]).toFixed(2)} / ${electronegativity(bonds[i][1]).toFixed(2)})`;
    const work = bonds.map((b, i) => `${bondLabel(...b)} ${ds[i].toFixed(2)}`).join(", ");
    return mc(
      "A4",
      `${most ? "most" : "least"}:${bonds.map((b) => b.join("")).sort().join(",")}`,
      `Which bond is the ${most ? "most" : "least"} polar? (EN values in parentheses)`,
      label(idx),
      bonds.map((_, i) => label(i)).filter((_, i) => i !== idx),
      `ΔEN: ${work}. The ${most ? "largest" : "smallest"} difference, ${bondLabel(...bonds[idx])}, is the ${most ? "most" : "least"} polar.`,
      rng,
    );
  }
  throw new Error("A4: no set found");
};

export const generators: Record<string, Generator> = { A1, A2, A3, A4 };
