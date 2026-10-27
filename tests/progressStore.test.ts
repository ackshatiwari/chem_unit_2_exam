import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultState, STORAGE_KEY } from "@/lib/storage";
import { ensureLoaded, getProgressSnapshot, resetProgressStore, updateProgress } from "@/lib/useProgress";

function fakeWindow() {
  const map = new Map<string, string>();
  return {
    localStorage: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    map,
  };
}

let win: ReturnType<typeof fakeWindow>;

beforeEach(() => {
  win = fakeWindow();
  vi.stubGlobal("window", win);
  resetProgressStore();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shared progress store", () => {
  it("starts at the defaults until loaded", () => {
    expect(getProgressSnapshot()).toEqual({ state: defaultState(), loaded: false });
  });

  it("loads saved progress once", () => {
    const saved = defaultState();
    saved.tiles.F.selected = ["F2"];
    win.map.set(STORAGE_KEY, JSON.stringify(saved));
    ensureLoaded();
    expect(getProgressSnapshot().state.tiles.F.selected).toEqual(["F2"]);
    // A second page mounting doesn't reload over newer in-memory changes.
    updateProgress((s) => ({ ...s, tiles: { ...s.tiles, F: { ...s.tiles.F, selected: ["F3"] } } }));
    ensureLoaded();
    expect(getProgressSnapshot().state.tiles.F.selected).toEqual(["F3"]);
  });

  it("saves every update immediately, so every page sees the same state", () => {
    ensureLoaded();
    updateProgress((s) => ({ ...s, tiles: { ...s.tiles, A: { ...s.tiles.A, selected: ["A1"] } } }));
    expect(JSON.parse(win.map.get(STORAGE_KEY)!).tiles.A.selected).toEqual(["A1"]);
    expect(getProgressSnapshot().state.tiles.A.selected).toEqual(["A1"]);
  });

  it("an update before loading builds on saved progress, not the defaults", () => {
    const saved = defaultState();
    saved.tiles.B.levels.B1 = { level: 3, streak: 0 };
    win.map.set(STORAGE_KEY, JSON.stringify(saved));
    updateProgress((s) => ({ ...s, tiles: { ...s.tiles, A: { ...s.tiles.A, selected: [] } } }));
    const state = getProgressSnapshot().state;
    expect(state.tiles.B.levels.B1).toEqual({ level: 3, streak: 0 });
    expect(state.tiles.A.selected).toEqual([]);
  });
});
