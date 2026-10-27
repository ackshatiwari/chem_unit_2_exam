import { MOLECULES, type Molecule, type PolarityReason } from "@/data/molecules";
import { mc, trueFalse, type Generator } from "../question";

/** Neutral species only: ions aren't labeled polar/nonpolar. */
const NEUTRAL = MOLECULES.filter((m) => m.charge === 0 && !m.skip?.includes("polarity"));
const WHY_POOL = NEUTRAL.filter((m) => m.polarityReason && !m.skip?.includes("polarity-why"));

const CHOICE: Record<PolarityReason, string> = {
  polar: "Polar: it has polar bonds that don't cancel",
  cancel: "Nonpolar: its polar bonds cancel by symmetry",
  "no-polar-bonds": "Nonpolar: it has no polar bonds",
};

function shapeText(m: Molecule): string {
  return m.centralAtom ? m.molecularGeometry : "diatomic";
}

/** "Polar bonds? Symmetric shape? → polar/nonpolar" */
export function polarityWork(m: Molecule): string {
  const f = `{${m.formula}}`;
  const verdict = m.polar ? "polar" : "nonpolar";
  if (m.polarityReason === "no-polar-bonds") {
    return `${f}: polar bonds? No (both atoms are the same) → ${verdict}.`;
  }
  const sym = m.polar ? "No" : "Yes, the dipoles cancel";
  const base = `${f}: polar bonds? Yes. Symmetric shape (${shapeText(m)})? ${sym} → ${verdict}.`;
  return m.polarityNote ? `${base} ${m.polarityNote}` : base;
}

const G1: Generator = (rng) => {
  const m = rng.pick(WHY_POOL);
  const reason = m.polarityReason!;
  return mc(
    "G1",
    m.formula,
    `Is {${m.formula}} polar or nonpolar, and why?`,
    CHOICE[reason],
    Object.values(CHOICE),
    polarityWork(m),
    rng,
  );
};

const G2: Generator = (rng) => {
  const m = rng.pick(NEUTRAL);
  const claim = rng.chance(0.5);
  const statement = `{${m.formula}} is ${claim ? "polar" : "nonpolar"}.`;
  const isTrue = claim === m.polar;
  const work = m.polarityReason
    ? polarityWork(m)
    : `{${m.formula}} is ${m.polar ? "polar" : "nonpolar"} (${shapeText(m)}).${m.polarityNote ? ` ${m.polarityNote}` : ""}`;
  return trueFalse("G2", `${m.formula}:${claim ? "p" : "np"}`, statement, isTrue, work);
};

export const generators: Record<string, Generator> = { G1, G2 };
