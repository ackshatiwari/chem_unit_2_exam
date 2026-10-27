import { MOLECULES, OCTET_LABELS, type Molecule, type OctetCategory } from "@/data/molecules";
import { mc, type Generator } from "../question";

const POOL = MOLECULES.filter((m) => !m.skip?.includes("octet"));
const byCat = (c: OctetCategory) => POOL.filter((m) => m.octet === c);
const CATS = Object.keys(OCTET_LABELS) as OctetCategory[];

/** One-line reason for a species' octet category. */
export function octetReason(m: Molecule): string {
  const f = `{${m.formula}}`;
  const around = 2 * (m.bondingDomains + m.lonePairs);
  const lp = m.lonePairs > 0 ? ` + ${m.lonePairs} lone pair${m.lonePairs === 1 ? "" : "s"}` : "";
  switch (m.octet) {
    case "odd":
      return `${f} has ${m.totalValence} valence electrons, an odd number, so one electron is unpaired.`;
    case "incomplete":
      return `${f}: ${m.centralAtom} has ${m.bondingDomains} single bonds${lp} = ${around} electrons, fewer than 8.`;
    case "expanded":
      return `${f}: ${m.centralAtom} has ${m.bondingDomains} bonds${lp} = ${around} electrons, more than 8.`;
    case "octet":
      return `${f}: every atom gets a full octet${/H(?![a-z])/.test(m.formula) ? " (H gets 2)" : ""}, with ${m.totalValence} valence electrons (even).`;
  }
}

function categoryQuestion(sub: string, cat: OctetCategory): Generator {
  return (rng) => {
    const m = rng.pick(byCat(cat));
    return mc(
      sub,
      `cat:${m.formula}`,
      `Which describes {${m.formula}}?`,
      OCTET_LABELS[cat],
      CATS.filter((c) => c !== cat).map((c) => OCTET_LABELS[c]),
      octetReason(m),
      rng,
    );
  };
}

function exampleQuestion(sub: string, cat: OctetCategory, ask: string): Generator {
  return (rng) => {
    const m = rng.pick(byCat(cat));
    const others = rng.sample(
      POOL.filter((x) => x.octet !== cat),
      3,
    );
    return mc(
      sub,
      `ex:${m.formula}:${others.map((o) => o.formula).sort().join(",")}`,
      ask,
      `{${m.formula}}`,
      others.map((o) => `{${o.formula}}`),
      octetReason(m),
      rng,
    );
  };
}

function either(a: Generator, b: Generator): Generator {
  return (rng) => (rng.chance(0.5) ? a(rng) : b(rng));
}

export const generators: Record<string, Generator> = {
  E1: either(categoryQuestion("E1", "octet"), exampleQuestion("E1", "octet", "Which of these follows the octet rule?")),
  E2: either(categoryQuestion("E2", "incomplete"), exampleQuestion("E2", "incomplete", "Which of these has an incomplete octet?")),
  E3: either(categoryQuestion("E3", "expanded"), exampleQuestion("E3", "expanded", "Which of these has an expanded octet?")),
  E4: either(categoryQuestion("E4", "odd"), exampleQuestion("E4", "odd", "Which of these is an odd-electron species?")),
};
