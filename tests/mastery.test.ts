import { describe, expect, it } from "vitest";
import { applyIonResult, applySublabelResult } from "@/lib/mastery";

describe("sublabel levels", () => {
  it("moves up after 3 correct in a row", () => {
    let p = applySublabelResult(undefined, true);
    expect(p).toEqual({ level: 1, streak: 1 });
    p = applySublabelResult(p, true);
    expect(p).toEqual({ level: 1, streak: 2 });
    p = applySublabelResult(p, true);
    expect(p).toEqual({ level: 2, streak: 0 });
  });
  it("needs a fresh streak at the new level", () => {
    const p = applySublabelResult(applySublabelResult({ level: 2, streak: 0 }, true), true);
    expect(p).toEqual({ level: 2, streak: 2 });
  });
  it("a miss drops a level and resets the streak", () => {
    expect(applySublabelResult({ level: 3, streak: 2 }, false)).toEqual({ level: 2, streak: 0 });
  });
  it("never drops below Beginner or rises above Mastery", () => {
    expect(applySublabelResult({ level: 1, streak: 2 }, false)).toEqual({ level: 1, streak: 0 });
    expect(applySublabelResult({ level: 4, streak: 0 }, true)).toEqual({ level: 4, streak: 0 });
  });
});

describe("ion levels", () => {
  it("one correct moves up, one miss moves down, within 1–4", () => {
    expect(applyIonResult(undefined, true)).toBe(2);
    expect(applyIonResult(3, true)).toBe(4);
    expect(applyIonResult(4, true)).toBe(4);
    expect(applyIonResult(3, false)).toBe(2);
    expect(applyIonResult(1, false)).toBe(1);
    expect(applyIonResult(undefined, false)).toBe(1);
  });
});
