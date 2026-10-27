"use client";

import Link from "next/link";
import { ALL_IONS, ionKey } from "@/data/polyatomic";
import { IONIC_MIN, NONPOLAR_MAX } from "@/lib/config";
import { masteredFraction } from "@/lib/drill";
import { SECTIONS, type Section } from "@/lib/sections";
import type { ProgressState, TileState } from "@/lib/storage";
import { useProgress } from "@/lib/useProgress";
import { btnPrimary, btnGhost, ConfirmReset, PageTitle, ProgressBar, Stars } from "./ui";

export function Dashboard() {
  const { state, update, loaded } = useProgress();
  const totalSelected = SECTIONS.reduce((n, s) => n + state.tiles[s.id].selected.length, 0);

  const setTile = (id: Section["id"], fn: (t: TileState) => TileState) =>
    update((s: ProgressState) => ({ ...s, tiles: { ...s.tiles, [id]: fn(s.tiles[id]) } }));

  const ionKeys = ALL_IONS.map(ionKey);
  const ionPct = masteredFraction(ionKeys, "mixed", state.polyatomic.levels);

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <PageTitle>Bonding &amp; Naming</PageTitle>
        <p className="text-lg leading-relaxed text-muted">
          Tick what each practice test should cover. Stars show how well you know each skill: three right in a row moves
          it up a level, a miss moves it down one.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {totalSelected > 0 ? (
            <Link href="/practice/mixed" className={btnPrimary}>
              Mixed test
            </Link>
          ) : (
            <button type="button" className={btnPrimary} disabled>
              Mixed test
            </button>
          )}
          <span className="text-sm text-muted">
            {totalSelected > 0
              ? `Every checked skill across all tiles (${totalSelected}).`
              : "Check at least one skill to build a mixed test."}
          </span>
        </div>
      </div>

      <ul
        aria-busy={!loaded}
        className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loaded ? "" : "opacity-60"}`}
      >
        {SECTIONS.map((section) => (
          <Tile key={section.id} section={section} tile={state.tiles[section.id]} onChange={(fn) => setTile(section.id, fn)} />
        ))}

        <li className="flex flex-col border border-border bg-surface">
          <div className="flex items-start gap-3 border-b border-border p-5">
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center bg-seg-active-bg font-mono text-sm font-semibold text-seg-active-fg">
              I
            </span>
            <h2 className="font-display text-xl leading-tight">Polyatomic ions</h2>
          </div>
          <div className="flex-1 space-y-3 p-5 text-sm leading-relaxed text-muted">
            <p>
              All 40 ions from your sheet, name to formula and back. Each ion has its own level in each direction.
            </p>
            <div className="space-y-1">
              <ProgressBar value={ionPct} label={`Polyatomic ions: ${Math.round(ionPct * 100)}% mastered`} />
              <p className="text-xs">{Math.round(ionPct * 100)}% at Mastery (both directions)</p>
            </div>
          </div>
          <div className="border-t border-border p-5">
            <Link href="/polyatomic" className={btnPrimary}>
              Open ion drill
            </Link>
          </div>
        </li>
      </ul>
    </div>
  );
}

function Tile({
  section,
  tile,
  onChange,
}: {
  section: Section;
  tile: TileState;
  onChange: (fn: (t: TileState) => TileState) => void;
}) {
  const allIds = section.sublabels.map((l) => l.id);
  const count = tile.selected.length;
  const allOn = count === allIds.length;
  const headingId = `tile-${section.id}`;

  const toggle = (id: string) =>
    onChange((t) => ({
      ...t,
      selected: allIds.filter((x) => (x === id ? !t.selected.includes(id) : t.selected.includes(x))),
    }));

  return (
    <li className="flex flex-col border border-border bg-surface" aria-labelledby={headingId}>
      <div className="border-b border-border p-5">
        <h2 id={headingId} className="flex items-start gap-3 font-display text-xl leading-tight">
          <span className="grid h-8 w-8 shrink-0 place-items-center bg-seg-active-bg font-mono text-sm font-semibold tracking-normal text-seg-active-fg">
            {section.id}
          </span>
          <span className="pt-0.5">
            <span className="sr-only">· </span>
            {section.title}
          </span>
        </h2>
      </div>

      <fieldset className="flex-1 px-5 py-3">
        <legend className="sr-only">Skills on the {section.title} test</legend>
        <ul className="divide-y divide-border">
          {section.sublabels.map((l) => {
            const level = tile.levels[l.id]?.level ?? 1;
            const cid = `sub-${l.id}`;
            return (
              <li key={l.id} className="flex items-start gap-3 py-2.5">
                <input
                  id={cid}
                  type="checkbox"
                  className="check mt-0.5"
                  checked={tile.selected.includes(l.id)}
                  onChange={() => toggle(l.id)}
                />
                <label htmlFor={cid} className="min-w-0 flex-1 cursor-pointer text-sm leading-snug">
                  <span className="mr-1.5 font-mono text-xs text-muted">{l.id}</span>
                  {l.text}
                </label>
                <Stars level={level} className="mt-0.5 text-sm" />
              </li>
            );
          })}
        </ul>
        {section.id === "A" && (
          <p className="mt-2 border-l-2 border-callout pl-3 text-xs leading-relaxed text-muted">
            Cutoffs: ΔEN ≤ {NONPOLAR_MAX} nonpolar · {NONPOLAR_MAX}–{IONIC_MIN} polar · ≥ {IONIC_MIN} ionic. Change them
            in <code className="font-mono">lib/config.ts</code> to match your class.
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            className={btnGhost}
            onClick={() => onChange((t) => ({ ...t, selected: allOn ? [] : allIds }))}
          >
            Select {allOn ? "none" : "all"}
          </button>
          <span className="text-sm text-muted" aria-live="polite">
            {count} of {allIds.length} selected
          </span>
        </div>
        {count > 0 ? (
          <Link href={`/practice/${section.id}`} className={btnPrimary}>
            Start practice<span className="sr-only">: {section.title}</span>
          </Link>
        ) : (
          <button type="button" className={btnPrimary} disabled>
            Start practice
          </button>
        )}
        <div className="w-full">
          <ConfirmReset what={`stars for ${section.id}`} onConfirm={() => onChange((t) => ({ ...t, levels: {} }))} />
        </div>
      </div>
    </li>
  );
}
