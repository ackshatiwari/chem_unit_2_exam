import { BINARY_ACIDS, CATIONS, COVALENT, HYDRATES, MONATOMIC_ANIONS, PREFIXES } from "@/data/naming";
import { POLYATOMIC_ANIONS } from "@/data/polyatomic";
import { formatFormula } from "../formula";
import {
  acidFormula,
  acidNameFromAnion,
  cationPart,
  chargeBalance,
  chargeReasoning,
  compoundFormula,
  compoundNames,
  covalentNames,
  type IonPart,
} from "../naming";
import { mc, typed, type Generator, type Question } from "../question";
import type { Rng } from "../rng";

const METALS = CATIONS.filter((c) => !c.polyatomic).map(cationPart);
const AMMONIUM = cationPart(CATIONS.find((c) => c.polyatomic)!);
const MONO: IonPart[] = MONATOMIC_ANIONS.map((a) => ({ ...a, polyatomic: false }));
const POLY: IonPart[] = POLYATOMIC_ANIONS.map((a) => ({ ...a, polyatomic: true }));
/** Ammonium pairs with halides and sulfide; ammonium oxide/nitride/phosphide aren't real compounds. */
const AMMONIUM_MONO = MONO.filter((a) => ["F", "Cl", "Br", "I", "S"].includes(a.formula));

const ion = (p: IonPart) => `{${formatFormula(p.formula, p.charge)}}`;

function compoundQuestion(sub: string, cat: IonPart, an: IonPart, rng: Rng): Question {
  const formula = compoundFormula(cat, an);
  const names = compoundNames(cat, an);
  const [nc, na] = chargeBalance(cat.charge, an.charge);
  const parens =
    (nc > 1 && cat.polyatomic) || (na > 1 && an.polyatomic)
      ? " Parentheses go around a polyatomic ion when there is more than one."
      : "";
  if (rng.chance(0.5)) {
    return typed(
      sub,
      `n2f:${formula}`,
      `Write the formula for ${names[0]}.`,
      "formula",
      formula,
      `${ion(cat)} and ${ion(an)} balance at ${nc} : ${na} → {${formula}}.${parens}`,
    );
  }
  const isVariable = CATIONS.some((c) => c.formula === cat.formula && c.variable);
  const why = isVariable
    ? `{${formula}}: ${chargeReasoning(cat, an)} → ${names[0]}.`
    : `{${formula}}: ${cat.name.split("(")[0]} has one common charge, so no Roman numeral → ${names[0]}.`;
  return typed(sub, `f2n:${formula}`, `Name {${formula}}.`, "name", names[0], why, { accepted: names.slice(1) });
}

const H1: Generator = (rng) => compoundQuestion("H1", rng.pick(METALS), rng.pick(MONO), rng);

const H4: Generator = (rng) => {
  if (rng.chance(0.15)) return compoundQuestion("H4", AMMONIUM, rng.pick(AMMONIUM_MONO), rng);
  const cat = rng.chance(0.15) ? AMMONIUM : rng.pick(METALS);
  return compoundQuestion("H4", cat, rng.pick(POLY), rng);
};

/* ---------- acids ---------- */

interface Acid {
  formula: string;
  name: string;
  why: string;
}

const ACIDS: Acid[] = [
  ...BINARY_ACIDS.map((a) => ({ ...a, why: `Binary acid (H + one nonmetal): hydro- + root + -ic acid.` })),
  // Oxyacids and -ide polyatomic acids, only from anions with no H already in them.
  // VERIFY: silicate (SiO3 2-) gives H2SiO3 "silicic acid" (metasilicic); some texts use H4SiO4.
  ...POLYATOMIC_ANIONS.filter((a) => !a.formula.includes("H")).map((a) => {
    const name = acidNameFromAnion(a.name);
    const rule = a.name.endsWith("ate")
      ? "-ate → -ic acid"
      : a.name.endsWith("ite")
        ? "-ite → -ous acid"
        : "-ide → hydro-…-ic acid";
    const n = Math.abs(a.charge);
    return {
      formula: acidFormula(a.formula, a.charge),
      name,
      why: `${a.name} (${ion({ ...a, polyatomic: true })}): ${rule}; ${n} H⁺ balance${n === 1 ? "s" : ""} the ${n === 1 ? "" : n}− charge.`,
    };
  }),
];

const H2: Generator = (rng) => {
  const a = rng.pick(ACIDS);
  if (rng.chance(0.5)) {
    return typed("H2", `f2n:${a.formula}`, `Name the acid {${a.formula}}.`, "name", a.name, `{${a.formula}} → ${a.name}. ${a.why}`);
  }
  return typed(
    "H2",
    `n2f:${a.formula}`,
    `Write the formula for ${a.name}.`,
    "formula",
    a.formula,
    `${a.name} → {${a.formula}}. ${a.why}`,
    { accepted: [`${a.formula}(aq)`] },
  );
};

/* ---------- hydrates ---------- */

const H3: Generator = (rng) => {
  if (rng.chance(0.2)) {
    const n = rng.int(1, 10);
    const wrong = rng.sample(
      PREFIXES.slice(1).filter((p) => p !== PREFIXES[n]),
      3,
    );
    return mc(
      "H3",
      `prefix:${n}`,
      `Which prefix means ${n} water${n === 1 ? "" : "s"} in a hydrate name?`,
      `${PREFIXES[n]}hydrate`,
      wrong.map((p) => `${p}hydrate`),
      "mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10.",
      rng,
    );
  }
  const h = rng.pick(HYDRATES);
  const why = `{${h.formula}}: ${h.name.replace(/ \w+hydrate$/, "")} + ${h.water} water${h.water === 1 ? "" : "s"} (${PREFIXES[h.water]}) → ${h.name}.`;
  if (rng.chance(0.5)) {
    return typed("H3", `f2n:${h.formula}`, `Name {${h.formula}}.`, "name", h.name, why);
  }
  return typed("H3", `n2f:${h.formula}`, `Write the formula for ${h.name}.`, "formula", h.formula, `${why} Type the dot as ·, *, or a period.`);
};

/* ---------- binary covalent ---------- */

const H5: Generator = (rng) => {
  const c = rng.pick(COVALENT);
  const [a, na, b, nb] = c.parts;
  const names = covalentNames(a, na, b, nb);
  const rules = [
    na === 1 ? "no “mono” on the first element" : null,
    /monoxide|tetroxide|pentoxide|hexoxide|heptoxide|octoxide|nonoxide|decoxide/.test(names[0])
      ? "the prefix's final vowel drops before “oxide”"
      : null,
  ].filter(Boolean);
  const why = `{${c.formula}}: ${na} ${a}, ${nb} ${b} → ${names[0]}${rules.length ? ` (${rules.join("; ")})` : ""}.`;
  if (rng.chance(0.5)) {
    return typed("H5", `f2n:${c.formula}`, `Name {${c.formula}}.`, "name", names[0], why, { accepted: names.slice(1) });
  }
  return typed("H5", `n2f:${c.formula}`, `Write the formula for ${names[0]}.`, "formula", c.formula, why);
};

export const generators: Record<string, Generator> = { H1, H2, H3, H4, H5 };
