import { lewis, type LewisStructure } from "@/data/lewis";
import { describeAtom, formalCharge, formalChargeWork } from "../lewis";
import { mc, trueFalse, typed, type Generator } from "../question";

/* ---------- D1: formal charge ---------- */

// Structures where formal charges are worth asking about (several are nonzero).
const FC_POOL = ["NO3 -", "CO3 2-", "O3", "CO", "NH4 +", "H3O +", "BF4 -", "CN -", "NO2 -", "HCN", "CO2", "H2O", "I3 -", "NH3"].map(lewis);

const D1: Generator = (rng) => {
  const s = rng.pick(FC_POOL);
  // H is always 0; ask about it rarely.
  const candidates = s.atoms.map((_, i) => i).filter((i) => s.atoms[i].el !== "H" || rng.chance(0.1));
  const i = rng.pick(candidates);
  const fc = formalCharge(s, i);
  const desc = describeAtom(s, i);
  return typed(
    "D1",
    `${s.formula}:${i}`,
    `What is the formal charge on ${desc} (circled) in this Lewis structure of {${s.formula}}?`,
    "integer",
    fc > 0 ? `+${fc}` : String(fc),
    `${s.atoms[i].el}: valence − nonbonding e⁻ − ½ bonding e⁻: ${formalChargeWork(s, i)}.`,
    { figure: { structure: s, highlight: i }, inputLabel: "Formal charge (e.g. 0, -1, +1)" },
  );
};

/* ---------- D2: resonance = electron placement only ---------- */

const D2_TF: [string, boolean, string][] = [
  [
    "Resonance structures differ only in where electrons (lone pairs and multiple bonds) are placed.",
    true,
    "Only electrons move between resonance forms; the atoms stay put.",
  ],
  [
    "To draw another resonance structure of {NO3 -}, you can move an O atom to a new position.",
    false,
    "Moving an atom makes a different arrangement (a different species), not a resonance form. Move electrons instead.",
  ],
  [
    "Every resonance structure of a species has the same arrangement of atoms.",
    true,
    "Same skeleton every time; only the placement of electrons changes.",
  ],
  [
    "Every resonance structure of a species has the same total number of valence electrons.",
    true,
    "Resonance forms are different drawings of the same species, so the electron count can't change.",
  ],
  [
    "Two resonance structures can have different numbers of valence electrons.",
    false,
    "The electron count is fixed by the formula and charge; resonance only rearranges those electrons.",
  ],
  [
    "Moving an H atom to a different atom gives a resonance structure.",
    false,
    "Moving an atom (even H) changes the structure itself. Resonance moves electrons only.",
  ],
  [
    "Going from one resonance form of {O3} to the other, the atoms stay in place and only the double bond moves.",
    true,
    "The O=O double bond and a lone pair swap ends; the three O atoms don't move.",
  ],
];

const D2: Generator = (rng) => {
  if (rng.chance(0.65)) {
    const k = rng.int(0, D2_TF.length - 1);
    const [st, t, why] = D2_TF[k];
    return trueFalse("D2", `tf:${k}`, st, t, why);
  }
  if (rng.chance(0.5)) {
    return mc(
      "D2",
      "change",
      "Which change turns one resonance structure of {CO3 2-} into another?",
      "Moving a lone pair and a double bond",
      ["Moving an O atom to the other side of C", "Removing an electron pair", "Swapping the C and an O atom"],
      "Resonance forms differ only in where electrons sit; the atoms never move.",
      rng,
    );
  }
  return mc(
    "D2",
    "same",
    "What must be the same in every resonance structure of a species?",
    "The positions of the atoms",
    ["Where the double bond is", "Which atom has the negative formal charge", "How many lone pairs each atom has"],
    "The skeleton is fixed; double bonds, lone pairs, and formal charges are what shift.",
    rng,
  );
};

/* ---------- D3: the resonance hybrid ---------- */

const FRACTION: Record<string, string> = {
  "0.333": "⅓", "0.5": "½", "0.667": "⅔", "1": "1", "1.333": "1⅓", "1.5": "1½", "1.667": "1⅔", "2": "2",
};
const frac = (x: number) => FRACTION[String(Math.round(x * 1000) / 1000)] ?? x.toFixed(2);

/** Resonance species where every terminal atom is the same element bonded to the center. */
const HYBRIDS = ["NO3 -", "CO3 2-", "O3", "NO2 -"].map(lewis);

function averageOrder(s: LewisStructure): number {
  return s.bonds.reduce((n, [, , o]) => n + o, 0) / s.bonds.length;
}

const D3_BANK: { prompt: string; answer: string; wrong: string[]; why: string }[] = [
  {
    prompt: "All N–O bonds in {NO3 -} are…",
    answer: "identical, each with bond order 1⅓",
    wrong: ["one double and two single, fixed in place", "switching between double and single very fast", "all double bonds"],
    why: "The real ion is the average of 3 forms: 4 bonding pairs over 3 N–O bonds = 1⅓ each.",
  },
  {
    prompt: "The real structure of {O3} is…",
    answer: "a hybrid (average) of its two resonance forms",
    wrong: ["the first resonance form drawn", "flipping back and forth between the two forms", "a mixture of two different molecules"],
    why: "Neither drawing exists on its own; both O–O bonds are equal, with bond order 1½.",
  },
  {
    prompt: "The double-headed arrow (↔) between resonance structures means…",
    answer: "the real structure is a blend of all the forms",
    wrong: ["the molecule switches between the forms", "the forms are in equilibrium", "the forms are different molecules"],
    why: "Resonance is not motion or equilibrium; it's one structure that no single drawing captures.",
  },
  {
    prompt: "In benzene ({C6H6}), the C–C bonds are…",
    answer: "all the same length, between single and double",
    wrong: ["alternating long and short", "all single bonds", "all double bonds"],
    why: "Benzene is a hybrid of two forms, so every C–C bond has order 1½.",
  },
  {
    prompt: "Compared with a normal C=O double bond, each C–O bond in {CO3 2-} is…",
    answer: "longer and weaker (bond order 1⅓)",
    wrong: ["shorter and stronger", "exactly the same", "a triple bond"],
    why: "4 bonding pairs spread over 3 C–O bonds gives 1⅓; lower bond order means longer and weaker than C=O.",
  },
];

const D3: Generator = (rng) => {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const k = rng.int(0, D3_BANK.length - 1);
    const b = D3_BANK[k];
    return mc("D3", `bank:${k}`, b.prompt, b.answer, b.wrong, b.why, rng);
  }
  const s = rng.pick(HYBRIDS);
  const center = s.atoms[0].el;
  const outer = s.atoms[1].el;
  const n = s.bonds.length;
  if (kind === 1) {
    const avg = averageOrder(s);
    const pairs = s.bonds.reduce((t, [, , o]) => t + o, 0);
    return mc(
      "D3",
      `order:${s.formula}`,
      `What is the bond order of each ${center}–${outer} bond in the resonance hybrid of {${s.formula}}?`,
      frac(avg),
      ["1", "1⅓", "1½", "2"],
      `${pairs} bonding pairs spread over ${n} equal bonds: ${pairs}/${n} = ${frac(avg)}.`,
      rng,
    );
  }
  // Average formal charge on the outer atoms.
  const outerFc = s.atoms.slice(1).reduce((t, _, i) => t + formalCharge(s, i + 1), 0);
  const each = outerFc / n;
  const label = (x: number) => (x === 0 ? "0" : `−${frac(-x)}`);
  return mc(
    "D3",
    `fc:${s.formula}`,
    `In the resonance hybrid of {${s.formula}}, what is the average formal charge on each outer ${outer}?`,
    label(each),
    ["0", "−⅓", "−½", "−⅔", "−1"].filter((x) => x !== label(each)).slice(0, 3),
    `In one form the outer ${outer} atoms carry ${label(outerFc)} in total; spread over ${n} equivalent atoms that's ${label(each)} each.`,
    rng,
  );
};

export const generators: Record<string, Generator> = { D1, D2, D3 };
