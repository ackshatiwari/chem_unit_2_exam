import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultState, loadState, sanitize, saveState, STORAGE_KEY } from "@/lib/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    map,
  };
}

describe("storage", () => {
  it("round-trips through localStorage under the versioned key", () => {
    const ls = fakeStorage();
    vi.stubGlobal("window", { localStorage: ls });
    const s = defaultState();
    s.tiles.F.levels.F3 = { level: 3, streak: 1 };
    s.polyatomic.levels.n2f["SO3 2-"] = 4;
    saveState(s);
    expect(ls.map.has(STORAGE_KEY)).toBe(true);
    expect(loadState()).toEqual(s);
  });

  it("falls back to defaults when storage throws", () => {
    const boom = () => {
      throw new Error("denied");
    };
    vi.stubGlobal("window", { localStorage: { getItem: boom, setItem: boom } });
    expect(loadState()).toEqual(defaultState());
    expect(() => saveState(defaultState())).not.toThrow();
  });

  it("falls back to defaults when there is no window at all", () => {
    vi.stubGlobal("window", undefined);
    expect(loadState()).toEqual(defaultState());
    expect(() => saveState(defaultState())).not.toThrow();
  });

  it("falls back to defaults on bad JSON", () => {
    const ls = fakeStorage();
    ls.setItem(STORAGE_KEY, "{not json");
    vi.stubGlobal("window", { localStorage: ls });
    expect(loadState()).toEqual(defaultState());
  });

  it("sanitize drops unknown ids and invalid levels", () => {
    const s = sanitize({
      version: 1,
      tiles: {
        A: {
          selected: ["A1", "Z9"],
          levels: { A1: { level: 9, streak: 0 }, A2: { level: 2, streak: 7 }, Q: { level: 1 } },
        },
      },
      polyatomic: {
        selectedSets: ["ox1m", "nope"],
        direction: "sideways",
        levels: { n2f: { "SO3 2-": 3, "XX 9-": 2 }, f2n: { "NH4 +": 0 } },
      },
    });
    expect(s.tiles.A.selected).toEqual(["A1"]);
    expect(s.tiles.A.levels).toEqual({ A2: { level: 2, streak: 0 } });
    expect(s.tiles.B).toEqual(defaultState().tiles.B);
    expect(s.polyatomic.selectedSets).toEqual(["ox1m"]);
    expect(s.polyatomic.direction).toBe("n2f");
    expect(s.polyatomic.levels).toEqual({ n2f: { "SO3 2-": 3 }, f2n: {} });
  });

  it("ignores a different version", () => {
    expect(sanitize({ version: 2, tiles: {} })).toEqual(defaultState());
  });
});
