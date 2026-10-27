import { LEWIS, type LewisStructure } from "@/data/lewis";
import { MOLECULE_BY_FORMULA, MOLECULES } from "@/data/molecules";
import { ALL_IONS, ionKey } from "@/data/polyatomic";
import { totalValence } from "../chem";
import { countAtoms } from "../formula";
import { electronCount } from "../lewis";
import { mc, trueFalse, typed, type Generator } from "../question";
import type { Rng } from "../rng";

/** Structures with a true central atom (not diatomic, not all one element). */
const CENTERED = LEWIS.filter((s) => !s.diatomic && countAtoms(s.formula).size > 1);

const bondingPairs = (s: LewisStructure) => s.bonds.reduce((n, [, , o]) => n + o, 0);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A structure with one deliberate mistake, for "is this drawing right?" questions. */
function mutate(s: LewisStructure, rng: Rng): { structure: LewisStructure; problem: string } {
  const atoms = s.atoms.map((a) => ({ ...a }));
  const bonds = s.bonds.map((b) => [...b] as [number, number, 1 | 2 | 3]);
  const multiple = bonds.findIndex(([, , o]) => o > 1);
  const withLp = atoms.map((a, i) => (a.lp > 0 && i > 0 ? i : -1)).filter((i) => i >= 0);
  const kind = rng.pick([multiple >= 0 ? "bond" : "remove", withLp.length ? "remove" : "add", "add"]);

  if (kind === "bond" && multiple >= 0) {
    bonds[multiple][2] = 1;
    const shown = electronCount({ ...s, atoms, bonds });
    return {
      structure: { ...s, atoms, bonds },
      problem: `It shows ${shown} electrons but needs ${electronCount(s)}: a multiple bond is missing, so an atom is short of an octet.`,
    };
  }
  if (kind === "remove" && withLp.length) {
    const i = rng.pick(withLp);
    atoms[i].lp -= 1;
    return {
      structure: { ...s, atoms, bonds },
      problem: `It shows ${electronCount(s) - 2} electrons but needs ${electronCount(s)}: one ${atoms[i].el} is missing a lone pair.`,
    };
  }
  atoms[0].lp += 1;
  return {
    structure: { ...s, atoms, bonds },
    problem: `It shows ${electronCount(s) + 2} electrons but needs ${electronCount(s)}: there is an extra lone pair on ${atoms[0].el}.`,
  };
}

const C1: Generator = (rng) => {
  // 0 central atom, 1 bonding pairs, 2 lone pairs, 3 "is this drawing right?" (shown more often)
  const kind = rng.pick([0, 1, 2, 3, 3]);
  const s = rng.pick(CENTERED);
  const f = `{${s.formula}}`;
  const central = s.atoms[0].el;

  if (kind === 0) {
    const els = [...countAtoms(s.formula).keys()];
    const fillers = ["C", "N", "O", "S", "P", "H"].filter((e) => !els.includes(e));
    const others = [...els.filter((e) => e !== central), ...rng.shuffle(fillers)];
    return mc(
      "C1",
      `central:${s.formula}`,
      `What is the central atom in the Lewis structure of ${f}?`,
      central,
      others,
      `${central} goes in the center: the least electronegative atom that can bond to the others (H is never central).`,
      rng,
    );
  }
  if (kind === 1) {
    const n = bondingPairs(s);
    return typed(
      "C1",
      `pairs:${s.formula}`,
      `How many bonding (shared) pairs are in the best Lewis structure of ${f}?`,
      "integer",
      String(n),
      `${f}: ${s.bonds.map(([, , o]) => (o === 1 ? "single" : o === 2 ? "double" : "triple")).join(" + ")} = ${plural(n, "bonding pair")}.`,
    );
  }
  if (kind === 2) {
    const lp = s.atoms[0].lp;
    return typed(
      "C1",
      `lp:${s.formula}`,
      `How many lone pairs are on the central atom (${central}) in ${f}?`,
      "integer",
      String(lp),
      `${f} has ${totalValence(s.formula).total} valence electrons; after bonds and the outer atoms' octets, ${plural(lp, "lone pair")} ${lp === 1 ? "is" : "are"} left on ${central}.`,
    );
  }
  // Drawing check: correct half the time, one mistake otherwise.
  const correct = rng.chance(0.5);
  const shown = correct ? { structure: s, problem: "" } : mutate(s, rng);
  const total = totalValence(s.formula).total;
  return trueFalse(
    "C1",
    `drawing:${s.formula}:${correct ? "ok" : shown.problem}`,
    `Is this a correct Lewis structure for ${f}?`,
    correct,
    correct
      ? `Yes: ${total} valence electrons, all shown, and every atom has the electrons it needs.`
      : `No. ${shown.problem}`,
    { figure: { structure: shown.structure } },
  );
};

/** Species to count valence electrons for: the molecules table plus the polyatomic list (main-group only). */
const MAIN_GROUP_IONS = ALL_IONS.map(ionKey).filter((k) => !/Mn|Cr/.test(k));
const C2_POOL = [...new Set([...MOLECULES.map((m) => m.formula), ...MAIN_GROUP_IONS])];

const C2: Generator = (rng) => {
  const f = rng.pick(C2_POOL);
  const { total, work } = totalValence(f);
  return typed("C2", f, `How many total valence electrons go into the Lewis structure of {${f}}?`, "integer", String(total), `${work}.`);
};

/** Multiple-bond counting: skip I3- and the all-single expanded octets so the pool isn't mostly zeros. */
const MULTI = LEWIS.filter((s) => s.bonds.some(([, , o]) => o > 1));
const SINGLE_ONLY = LEWIS.filter((s) => !s.bonds.some(([, , o]) => o > 1) && ["H2O", "CH4", "NH3", "CCl4", "HF", "PCl3"].includes(s.formula));

const C3: Generator = (rng) => {
  const s = rng.chance(0.8) ? rng.pick(MULTI) : rng.pick(SINGLE_ONLY);
  const doubles = s.bonds.filter(([, , o]) => o === 2).length;
  const triples = s.bonds.filter(([, , o]) => o === 3).length;
  const ask: 2 | 3 = triples > 0 ? 3 : doubles > 0 ? 2 : rng.pick([2, 3] as const);
  const n = ask === 2 ? doubles : triples;
  const word = ask === 2 ? "double" : "triple";
  const res = MOLECULE_BY_FORMULA.get(s.formula)?.resonance ? " (in any one resonance form)" : "";
  const why =
    n === 0
      ? `{${s.formula}}: single bonds already give every atom a full octet, so no ${word} bonds are needed.`
      : `{${s.formula}}: with only single bonds an atom would be short of an octet, so atoms share extra pairs → ${plural(n, `${word} bond`)}${res}.`;
  return typed("C3", `${word}:${s.formula}`, `How many ${word} bonds are in the best Lewis structure of {${s.formula}}${res}?`, "integer", String(n), why);
};

// From the spec: resonance examples and non-resonance foils.
const RESONANCE: Record<string, string> = {
  O3: "the double bond can sit on either end O, giving 2 equivalent forms",
  "NO3 -": "the N=O double bond can go to any of the 3 O atoms",
  "CO3 2-": "the C=O double bond can go to any of the 3 O atoms",
  SO2: "the S=O double bond can be drawn to either O",
  "NO2 -": "the N=O double bond can be drawn to either O",
  C6H6: "the three C=C double bonds can alternate two ways around the ring",
};
const NO_RESONANCE: Record<string, string> = {
  H2O: "only single bonds, and there is one way to place the electrons",
  CH4: "only single bonds, and there is one way to place the electrons",
  NH3: "only single bonds, and there is one way to place the electrons",
  CO2: "one best structure, O=C=O",
  HCN: "one best structure, H–C≡N",
};

const C4: Generator = (rng) => {
  const res = Object.keys(RESONANCE);
  const non = Object.keys(NO_RESONANCE);
  if (rng.chance(0.65)) {
    const a = rng.pick(res);
    const foils = rng.sample(non, 3);
    return mc(
      "C4",
      `has:${a}:${foils.sort().join(",")}`,
      "Which of these has resonance structures?",
      `{${a}}`,
      foils.map((x) => `{${x}}`),
      `{${a}}: ${RESONANCE[a]}. The others have ${foils.map((x) => `{${x}}`).join(", ")}: one valid structure each.`,
      rng,
    );
  }
  const a = rng.pick(non);
  const others = rng.sample(res, 3);
  return mc(
    "C4",
    `not:${a}:${others.sort().join(",")}`,
    "Which of these does NOT have resonance structures?",
    `{${a}}`,
    others.map((x) => `{${x}}`),
    `{${a}}: ${NO_RESONANCE[a]}. The other three can place a double bond more than one way.`,
    rng,
  );
};

export const generators: Record<string, Generator> = { C1, C2, C3, C4 };
