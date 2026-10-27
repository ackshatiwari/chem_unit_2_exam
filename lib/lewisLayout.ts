import type { LewisStructure } from "@/data/lewis";

// Computes 2D positions for a Lewis drawing. Angles are in degrees, SVG style
// (0 = right, 90 = down, -90 = up).

export interface Point {
  x: number;
  y: number;
}

export interface LaidOutAtom {
  el: string;
  pos: Point;
  /** Directions of each lone pair, in degrees. */
  lonePairs: number[];
}

export interface Layout {
  atoms: LaidOutAtom[];
  bonds: { a: number; b: number; order: number }[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export const BOND_LENGTH = 58;
export const LP_RADIUS = 15;

/** Two-letter symbols are wider, so their lone pairs sit a little farther out. */
export function lpRadius(el: string): number {
  return el.length > 1 ? LP_RADIUS + 3 : LP_RADIUS;
}

const rad = (d: number) => (d * Math.PI) / 180;
const norm = (d: number) => ((d % 360) + 360) % 360;
const angDist = (a: number, b: number) => {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
};

/** Directions for the terminal atoms around a central atom. */
export function terminalAngles(n: number, centralLonePairs: number): number[] {
  switch (n) {
    case 1:
      return [0];
    case 2:
      return [180, 0];
    case 3:
      return centralLonePairs > 0 ? [180, 0, 90] : [-90, 150, 30];
    case 4:
      return [-90, 0, 90, 180];
    case 5:
      return centralLonePairs > 0 ? [-30, 30, 90, 150, 210] : [-90, -18, 54, 126, 198];
    case 6:
      return [-90, -30, 30, 90, 150, 210];
    default:
      return Array.from({ length: n }, (_, i) => -90 + (360 * i) / n);
  }
}

/**
 * Spread lone pairs into the widest gaps: try every combination of candidate
 * directions (every 15°) and keep the one whose closest pair of directions
 * (bonds or lone pairs) is farthest apart. Ties go to the larger total spread,
 * then to the first found, which starts at the top.
 */
export function placeCentralLonePairs(bondAngles: number[], count: number): number[] {
  if (count === 0) return [];
  const candidates = Array.from({ length: 24 }, (_, i) => -90 + i * 15);
  let best: number[] = [];
  let bestMin = -1;
  let bestSum = -1;
  const score = (chosen: number[]) => {
    const all = [...bondAngles, ...chosen];
    let min = 360;
    let sum = 0;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        if (i < bondAngles.length && j < bondAngles.length) continue;
        const d = angDist(all[i], all[j]);
        min = Math.min(min, d);
        sum += d;
      }
    }
    return { min, sum };
  };
  const recurse = (start: number, chosen: number[]) => {
    if (chosen.length === count) {
      const { min, sum } = score(chosen);
      if (min > bestMin + 1e-9 || (Math.abs(min - bestMin) < 1e-9 && sum > bestSum + 1e-9)) {
        best = [...chosen];
        bestMin = min;
        bestSum = sum;
      }
      return;
    }
    for (let i = start; i < candidates.length; i++) recurse(i + 1, [...chosen, candidates[i]]);
  };
  recurse(0, []);
  return best;
}

/** Emptiest diagonal around an atom, for its formal-charge label. */
export function freeDiagonal(taken: number[]): number {
  const diagonals = [-45, -135, 45, 135];
  let best = diagonals[0];
  let bestScore = -1;
  for (const d of diagonals) {
    const s = taken.length ? Math.min(...taken.map((t) => angDist(d, t))) : 360;
    if (s > bestScore + 1e-9) {
      best = d;
      bestScore = s;
    }
  }
  return best;
}

/** Lone pairs on a terminal atom: away from the bond, then the two sides. */
function terminalLonePairs(outward: number, count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [outward];
  if (count === 2) return [outward - 90, outward + 90];
  return [outward, outward - 90, outward + 90].slice(0, count);
}

export function layoutLewis(s: LewisStructure): Layout {
  const atoms: LaidOutAtom[] = [];
  if (s.diatomic) {
    const half = BOND_LENGTH / 2;
    atoms.push({ el: s.atoms[0].el, pos: { x: -half, y: 0 }, lonePairs: terminalLonePairs(180, s.atoms[0].lp) });
    atoms.push({ el: s.atoms[1].el, pos: { x: half, y: 0 }, lonePairs: terminalLonePairs(0, s.atoms[1].lp) });
  } else {
    const n = s.atoms.length - 1;
    const angles = terminalAngles(n, s.atoms[0].lp);
    atoms.push({ el: s.atoms[0].el, pos: { x: 0, y: 0 }, lonePairs: placeCentralLonePairs(angles, s.atoms[0].lp) });
    s.atoms.slice(1).forEach((a, i) => {
      const t = angles[i];
      atoms.push({
        el: a.el,
        pos: { x: BOND_LENGTH * Math.cos(rad(t)), y: BOND_LENGTH * Math.sin(rad(t)) },
        lonePairs: terminalLonePairs(t, a.lp),
      });
    });
  }

  const pad = LP_RADIUS + 8;
  const xs = atoms.map((a) => a.pos.x);
  const ys = atoms.map((a) => a.pos.y);
  return {
    atoms,
    bonds: s.bonds.map(([a, b, order]) => ({ a, b, order })),
    bounds: {
      minX: Math.min(...xs) - pad,
      minY: Math.min(...ys) - pad,
      maxX: Math.max(...xs) + pad,
      maxY: Math.max(...ys) + pad,
    },
  };
}

export function pointAt(p: Point, angle: number, r: number): Point {
  return { x: p.x + r * Math.cos(rad(angle)), y: p.y + r * Math.sin(rad(angle)) };
}

export { angDist };
