import { BOND_COMPARE_SETS, BOND_FAMILIES, BOND_SYMBOL, BONDING_CAPACITY } from "@/data/bonds";
import { mc, type Generator } from "../question";

const ORDER_WORD = { 1: "single only", 2: "up to a double bond", 3: "up to a triple bond" } as const;
const SINGLES = BONDING_CAPACITY.filter((a) => a.maxOrder === 1);
const TRIPLES = BONDING_CAPACITY.filter((a) => a.maxOrder === 3);

const capacityNote = "Typical bonds in neutral molecules: H 1, halogens 1, O 2, N 3, C 4.";

const B1: Generator = (rng) => {
  const kind = rng.int(0, 4);
  if (kind === 0) {
    const a = rng.pick(BONDING_CAPACITY);
    return mc(
      "B1",
      `count:${a.el}`,
      `How many bonds does ${a.el} (${a.name}) usually form in a neutral molecule?`,
      String(a.bonds),
      ["1", "2", "3", "4"],
      `${capacityNote}`,
      rng,
    );
  }
  if (kind === 1) {
    const a = rng.pick(TRIPLES);
    const others = rng.sample(
      BONDING_CAPACITY.filter((x) => x.maxOrder < 3),
      3,
    );
    return mc(
      "B1",
      `triple:${a.el}:${others.map((o) => o.el).sort().join("")}`,
      "Which atom can form a triple bond?",
      a.el,
      others.map((o) => o.el),
      "Only N and C can form triple bonds. O tops out at a double bond; H and the halogens form single bonds only.",
      rng,
    );
  }
  if (kind === 2) {
    const a = rng.pick(SINGLES);
    return mc(
      "B1",
      `single:${a.el}`,
      "Which atom forms only single bonds?",
      a.el,
      ["O", "N", "C"],
      `${a.el} forms one bond, so it can only be a single bond. O, N, and C can form multiple bonds.`,
      rng,
    );
  }
  if (kind === 3) {
    const a = rng.pick(BONDING_CAPACITY);
    return mc(
      "B1",
      `max:${a.el}`,
      `What is the highest bond order ${a.el} (${a.name}) forms in typical molecules?`,
      ORDER_WORD[a.maxOrder],
      Object.values(ORDER_WORD),
      "H and halogens: single only. O: up to double. N and C: up to triple.",
      rng,
    );
  }
  const halogen = rng.pick(SINGLES);
  return mc(
    "B1",
    `double-not-triple:${halogen.el}`,
    "Which atom can form a double bond but not a triple bond?",
    "O",
    ["N", "C", halogen.el],
    "O forms 2 bonds, so at most one double bond. N and C can go to triple; H and halogens only single.",
    rng,
  );
};

const B2: Generator = (rng) => {
  if (rng.chance(0.25)) {
    const strength = rng.chance(0.5);
    return mc(
      "B2",
      `trend:${strength ? "strength" : "length"}`,
      `As bond order increases (single → double → triple), bond ${strength ? "strength" : "length"}…`,
      strength ? "increases" : "decreases",
      ["increases", "decreases", "stays the same"],
      "More shared electron pairs pull the atoms closer: higher bond order = shorter and stronger.",
      rng,
    );
  }
  const [a, b] = rng.pick(BOND_FAMILIES);
  const bonds = ([1, 2, 3] as const).map((o) => `${a}${BOND_SYMBOL[o]}${b}`);
  const ask = rng.pick(["longest", "shortest", "strongest", "weakest"] as const);
  const answer = ask === "longest" || ask === "weakest" ? bonds[0] : bonds[2];
  return mc(
    "B2",
    `${ask}:${a}${b}`,
    `Which bond is the ${ask}: ${bonds.join(", ")}?`,
    answer,
    bonds,
    `${bonds[2]} (triple) is the shortest and strongest; ${bonds[0]} (single) is the longest and weakest.`,
    rng,
  );
};

const B3: Generator = (rng) => {
  const set = rng.pick(BOND_COMPARE_SETS);
  const n = set.items.length <= 3 ? set.items.length : rng.int(3, set.items.length);
  const items = rng.sample(set.items, n);
  // Lengths and strengths both follow bond order (higher order → shorter, stronger).
  const ask = rng.pick(["shortest", "longest", "strongest", "weakest"] as const);
  const wantHigh = ask === "shortest" || ask === "strongest";
  const target = items.reduce((best, x) => (wantHigh ? x.order > best.order : x.order < best.order) ? x : best);
  const work = items
    .slice()
    .sort((p, q) => q.order - p.order)
    .map((x) => `${x.label} ${x.orderText}${x.length ? `, ≈${x.length} pm` : ""}`)
    .join("; ");
  const what = set.id === "diatomic" ? "bond" : set.bond;
  return mc(
    "B3",
    `${set.id}:${ask}:${items.map((x) => x.label).sort().join("|")}`,
    `Which has the ${ask} ${what}?`,
    target.label,
    items.filter((x) => x !== target).map((x) => x.label),
    `Bond orders: ${work}. ${wantHigh ? "Highest" : "Lowest"} bond order → ${ask}.`,
    rng,
  );
};

export const generators: Record<string, Generator> = { B1, B2, B3 };
