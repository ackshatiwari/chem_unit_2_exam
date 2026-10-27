import { ION_BY_KEY, ION_SETS } from "@/data/polyatomic";
import { SECTIONS, type SectionId } from "@/lib/sections";

export const STORAGE_KEY = "chemPractice.v1";

export type Level = 1 | 2 | 3 | 4;
export type Direction = "n2f" | "f2n";
export type DirectionMode = Direction | "mixed";

export interface SublabelProgress {
  level: Level;
  streak: number;
}

export interface TileState {
  selected: string[];
  levels: Record<string, SublabelProgress>;
}

export interface ProgressState {
  version: 1;
  tiles: Record<SectionId, TileState>;
  polyatomic: {
    selectedSets: string[];
    direction: DirectionMode;
    levels: Record<Direction, Record<string, Level>>;
  };
}

export function defaultState(): ProgressState {
  const tiles = {} as Record<SectionId, TileState>;
  for (const s of SECTIONS) {
    tiles[s.id] = { selected: s.sublabels.map((l) => l.id), levels: {} };
  }
  return {
    version: 1,
    tiles,
    polyatomic: { selectedSets: [], direction: "n2f", levels: { n2f: {}, f2n: {} } },
  };
}

function isLevel(v: unknown): v is Level {
  return v === 1 || v === 2 || v === 3 || v === 4;
}

/**
 * Merge whatever was stored onto a fresh default, dropping anything that
 * doesn't match the current data (renamed sublabels, removed ions, bad values).
 */
export function sanitize(raw: unknown): ProgressState {
  const out = defaultState();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return out;

  const tiles = (r.tiles ?? {}) as Record<string, unknown>;
  for (const s of SECTIONS) {
    const t = tiles[s.id] as Partial<TileState> | undefined;
    if (!t || typeof t !== "object") continue;
    const valid = new Set(s.sublabels.map((l) => l.id));
    if (Array.isArray(t.selected)) {
      out.tiles[s.id].selected = s.sublabels.map((l) => l.id).filter((id) => t.selected!.includes(id));
    }
    if (t.levels && typeof t.levels === "object") {
      for (const [id, p] of Object.entries(t.levels)) {
        if (!valid.has(id) || !p || typeof p !== "object") continue;
        const { level, streak } = p as Partial<SublabelProgress>;
        if (!isLevel(level)) continue;
        out.tiles[s.id].levels[id] = {
          level,
          streak: typeof streak === "number" && streak >= 0 && streak < 3 ? Math.floor(streak) : 0,
        };
      }
    }
  }

  const p = (r.polyatomic ?? {}) as Partial<ProgressState["polyatomic"]>;
  const setIds = new Set(ION_SETS.map((s) => s.id));
  if (Array.isArray(p.selectedSets)) {
    out.polyatomic.selectedSets = p.selectedSets.filter((id) => typeof id === "string" && setIds.has(id));
  }
  if (p.direction === "n2f" || p.direction === "f2n" || p.direction === "mixed") {
    out.polyatomic.direction = p.direction;
  }
  for (const dir of ["n2f", "f2n"] as const) {
    const lv = p.levels?.[dir];
    if (!lv || typeof lv !== "object") continue;
    for (const [key, level] of Object.entries(lv)) {
      if (ION_BY_KEY.has(key) && isLevel(level)) out.polyatomic.levels[dir][key] = level;
    }
  }
  return out;
}

/** Read saved progress. Any failure (no storage, private mode, bad JSON) gives a fresh state. */
export function loadState(): ProgressState {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultState();
    return sanitize(JSON.parse(text));
  } catch {
    return defaultState();
  }
}

export function saveState(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable or full: keep working in memory.
  }
}
