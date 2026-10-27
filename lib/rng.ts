// Small seeded PRNG (mulberry32) so generators and sessions are reproducible in tests.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  /** n distinct items from arr (n <= arr.length). */
  sample<T>(arr: readonly T[], n: number): T[];
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const shuffle = <T,>(arr: readonly T[]) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    pick: (arr) => {
      if (arr.length === 0) throw new Error("pick from empty array");
      return arr[int(0, arr.length - 1)];
    },
    shuffle,
    sample: (arr, n) => shuffle(arr).slice(0, n),
    chance: (p) => next() < p,
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
