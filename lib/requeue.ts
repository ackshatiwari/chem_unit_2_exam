import type { Rng } from "./rng";

// "Comes back soon": a missed question is re-inserted 2–4 questions later.
// Positions are question indexes within the session (0, 1, 2, ...).

export interface Pending<T> {
  item: T;
  /** Question index at which this item becomes due. */
  due: number;
}

export const RETRY_MIN = 2;
export const RETRY_MAX = 4;

/** Schedule `item`, missed at question index `index`, to come back 2–4 questions later. */
export function scheduleRetry<T>(queue: Pending<T>[], item: T, index: number, rng: Rng): Pending<T>[] {
  return [...queue, { item, due: index + rng.int(RETRY_MIN, RETRY_MAX) }];
}

/** The earliest pending item due at or before question index `index`, if any. */
export function takeDue<T>(queue: Pending<T>[], index: number): { item: T; rest: Pending<T>[] } | null {
  const due = queue.filter((p) => p.due <= index);
  if (due.length === 0) return null;
  return takeEarliest(queue);
}

/** The earliest pending item regardless of due index (used to finish a session). */
export function takeEarliest<T>(queue: Pending<T>[]): { item: T; rest: Pending<T>[] } | null {
  if (queue.length === 0) return null;
  let best = 0;
  for (let i = 1; i < queue.length; i++) if (queue[i].due < queue[best].due) best = i;
  return { item: queue[best].item, rest: queue.filter((_, i) => i !== best) };
}
