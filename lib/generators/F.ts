import { ELECTRON_GEOMETRIES, MOLECULAR_GEOMETRIES, MOLECULES, type Molecule } from "@/data/molecules";
import { mc, typed, type Generator } from "../question";
import type { Rng } from "../rng";

/** VSEPR questions: real central atom, no odd-electron or diatomic species. */
const POOL = MOLECULES.filter((m) => m.centralAtom && !m.skip?.includes("vsepr"));

const deg = (a: number) => `${a}°`;
const angleList = (m: Molecule) => m.idealAngles.map(deg).join(" and ");

export function domainWork(m: Molecule): string {
  const lp = `${m.lonePairs} lone pair${m.lonePairs === 1 ? "" : "s"}`;
  return `{${m.formula}}: ${m.bondingDomains} bonding + ${lp} = ${m.domains} domains`;
}

const F1: Generator = (rng) => {
  const m = rng.pick(POOL);
  return typed(
    "F1",
    m.formula,
    `How many electron domains are around the central atom (${m.centralAtom}) in {${m.formula}}?`,
    "integer",
    String(m.domains),
    `${domainWork(m)}. (A double or triple bond counts as one domain.)`,
  );
};

const F2: Generator = (rng) => {
  const m = rng.pick(POOL);
  return mc(
    "F2",
    m.formula,
    `What is the electron-domain geometry of {${m.formula}}?`,
    m.electronGeometry,
    rng.sample(ELECTRON_GEOMETRIES.filter((g) => g !== m.electronGeometry), 3),
    `${domainWork(m)} → ${m.electronGeometry}.`,
  rng,
  );
};

/** Distractors for shape: prefer shapes from the same electron geometry, then any. */
function shapeDistractors(m: Molecule, rng: Rng): string[] {
  const sameFamily = POOL.filter((x) => x.domains === m.domains).map((x) => x.molecularGeometry);
  const fam = rng.shuffle([...new Set(sameFamily)].filter((g) => g !== m.molecularGeometry));
  const rest = rng.shuffle(MOLECULAR_GEOMETRIES.filter((g) => g !== m.molecularGeometry && !fam.includes(g)));
  return [...fam, ...rest].slice(0, 3);
}

const F3: Generator = (rng) => {
  const m = rng.pick(POOL);
  return mc(
    "F3",
    m.formula,
    `What is the molecular geometry (shape) of {${m.formula}}?`,
    m.molecularGeometry,
    shapeDistractors(m, rng),
    `${domainWork(m)} → ${m.electronGeometry} electron geometry, ${m.molecularGeometry} shape.`,
    rng,
  );
};

/** Typed ideal angle only where the real angle equals the ideal (no lone pairs, or symmetric lone pairs). */
const TYPED_ANGLE = POOL.filter((m) => m.idealAngles.length === 1 && (m.lonePairs === 0 || m.angleVsIdeal === "equal"));
const COMPRESSED = POOL.filter((m) => m.angleVsIdeal);

const GEOMETRY_ANGLE = [
  { geom: "linear", angle: 180 },
  { geom: "trigonal planar", angle: 120 },
  { geom: "tetrahedral", angle: 109.5 },
  { geom: "octahedral", angle: 90 },
];

const F4: Generator = (rng) => {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const m = rng.pick(TYPED_ANGLE);
    const a = m.idealAngles[0];
    const why =
      m.lonePairs === 0
        ? `{${m.formula}} is ${m.molecularGeometry} with no lone pairs on ${m.centralAtom} → ${deg(a)}.`
        : `{${m.formula}}: the ${m.lonePairs} lone pairs sit symmetrically, so the ${m.molecularGeometry} angle stays ${deg(a)}.`;
    return typed("F4", `ideal:${m.formula}`, `What is the ideal bond angle in {${m.formula}}?`, "angle", String(a), why);
  }
  if (kind === 1) {
    const g = rng.pick(GEOMETRY_ANGLE);
    return typed(
      "F4",
      `geom:${g.geom}`,
      `What is the ideal bond angle for a ${g.geom} electron geometry?`,
      "angle",
      String(g.angle),
      `${g.geom[0].toUpperCase()}${g.geom.slice(1)} → ${deg(g.angle)}.`,
    );
  }
  const m = rng.pick(COMPRESSED);
  const ref = angleList(m);
  const less = `Slightly less than ${ref}`;
  const equal = `Exactly ${ref}`;
  const more = `Greater than ${ref}`;
  const answer = m.angleVsIdeal === "less" ? less : equal;
  const lp = `${m.lonePairs} lone pair${m.lonePairs === 1 ? "" : "s"}`;
  const push = m.lonePairs === 1 ? "pushes" : "push";
  const why =
    m.angleVsIdeal === "less"
      ? `{${m.formula}}: the ${lp} on ${m.centralAtom} ${push} the bonds a little closer, so the angle is a bit under the ideal ${ref}. Measured: ${m.actualAngle}.`
      : `{${m.formula}}: the ${lp} are arranged symmetrically, so the angle stays at ${m.actualAngle}.`;
  return mc(
    "F4",
    `compare:${m.formula}`,
    `${m.centralAtom} in {${m.formula}} has ${lp}. Compared with the ideal ${ref}, its bond angle is…`,
    answer,
    [less, equal, more],
    why,
    rng,
  );
};

export const generators: Record<string, Generator> = { F1, F2, F3, F4 };
