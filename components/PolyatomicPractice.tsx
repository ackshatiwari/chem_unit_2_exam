"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { ION_BY_KEY, ION_SETS, ionKey } from "@/data/polyatomic";
import { checkAnswer } from "@/lib/check";
import {
  advance,
  answerDrill,
  buildQuestion,
  directionsFor,
  masteredFraction,
  setStatus,
  startDrill,
  type DrillState,
  type IonLevels,
} from "@/lib/drill";
import { LEVEL_NAMES } from "@/lib/mastery";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import type { DirectionMode } from "@/lib/storage";
import { useProgress } from "@/lib/useProgress";
import { Formula } from "./Formula";
import { QuestionCard, type Feedback } from "./QuestionCard";
import {
  btnPrimary,
  btnSecondary,
  Callout,
  ConfirmReset,
  PageTitle,
  ProgressBar,
  SectionHeading,
  SegmentedControl,
  Stars,
} from "./ui";

const DIRECTION_OPTIONS: { value: DirectionMode; label: string }[] = [
  { value: "n2f", label: "Name → formula" },
  { value: "f2n", label: "Formula → name" },
  { value: "mixed", label: "Mixed" },
];

const directionLabel = (d: DirectionMode) => DIRECTION_OPTIONS.find((o) => o.value === d)!.label;

interface ActiveDrill {
  setIds: string[];
  state: DrillState;
  feedback: Feedback | null;
  rng: Rng;
}

export function PolyatomicPractice() {
  const { state: progress, update } = useProgress();
  const { direction, selectedSets, levels } = progress.polyatomic;
  const [drill, setDrill] = useState<ActiveDrill | null>(null);

  // Hidden by a navigation (Next keeps the page mounted): come back to the set list.
  useLayoutEffect(() => () => setDrill(null), []);

  const setLevels = useCallback(
    (next: IonLevels) => update((s) => ({ ...s, polyatomic: { ...s.polyatomic, levels: next } })),
    [update],
  );

  const begin = (setIds: string[]) => {
    const keys = [...new Set(setIds.flatMap((id) => ION_SETS.find((s) => s.id === id)!.ions.map(ionKey)))];
    const rng = createRng(randomSeed());
    setDrill({ setIds, state: startDrill(keys, direction, levels, rng), feedback: null, rng });
    window.scrollTo({ top: 0 });
  };

  if (drill) {
    return (
      <DrillView
        drill={drill}
        levels={levels}
        onChange={setDrill}
        onLevels={setLevels}
        onExit={() => setDrill(null)}
        onRestart={() => begin(drill.setIds)}
      />
    );
  }

  const toggleSet = (id: string) =>
    update((s) => {
      const cur = s.polyatomic.selectedSets;
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...s, polyatomic: { ...s.polyatomic, selectedSets: ION_SETS.map((x) => x.id).filter((x) => next.includes(x)) } };
    });

  const resetSet = (id: string) =>
    update((s) => {
      const keys = new Set(ION_SETS.find((x) => x.id === id)!.ions.map(ionKey));
      const lv = { ...s.polyatomic.levels };
      for (const d of directionsFor(direction)) {
        lv[d] = Object.fromEntries(Object.entries(lv[d]).filter(([k]) => !keys.has(k)));
      }
      return { ...s, polyatomic: { ...s.polyatomic, levels: lv } };
    });

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <PageTitle>Polyatomic Practices</PageTitle>
        <p className="text-lg leading-relaxed text-muted">
          Name to formula, formula to name. Get one right and it moves up a level; miss it and it drops a level and
          comes back soon. A set is done when every ion reaches Mastered.
        </p>
      </div>

      <section aria-labelledby="dir-h" className="space-y-3">
        <SectionHeading id="dir-h">Direction</SectionHeading>
        <SegmentedControl
          label="Direction"
          options={DIRECTION_OPTIONS}
          value={direction}
          onChange={(d) => update((s) => ({ ...s, polyatomic: { ...s.polyatomic, direction: d } }))}
        />
      </section>

      <section aria-labelledby="fmt-h" className="max-w-3xl space-y-3">
        <SectionHeading id="fmt-h">Answer format</SectionHeading>
        <Callout>
          <strong>Every answer is typed.</strong> Formulas go formula, one space, then the charge, with no carets:
          sulfite is <code className="font-mono">SO3 2-</code>, ammonium is <code className="font-mono">NH4 +</code>.
          For 1– ions, <code className="font-mono">NO3 -</code> and <code className="font-mono">NO3 1-</code> both
          count. Capital letters count too (Cl, not CL).
        </Callout>
      </section>

      <section aria-labelledby="sets-h" className="space-y-4">
        <div className="space-y-1">
          <SectionHeading id="sets-h">Sets</SectionHeading>
          <p className="text-muted">
            Matching the tables on your sheet, plus one cumulative set with every ion. Progress is saved separately for
            each direction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={selectedSets.length === 0}
            onClick={() => begin(selectedSets)}
          >
            Drill selected sets{selectedSets.length > 0 ? ` (${selectedSets.length})` : ""}
          </button>
          <span className="text-sm text-muted">
            {selectedSets.length === 0 ? "Tick sets to drill them together." : `Direction: ${directionLabel(direction)}`}
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ION_SETS.map((set) => {
            const keys = set.ions.map(ionKey);
            const status = setStatus(keys, direction, levels);
            const pct = masteredFraction(keys, direction, levels);
            const checkId = `set-${set.id}`;
            return (
              <li key={set.id} className="flex flex-col gap-4 border border-border bg-surface p-5">
                <div className="flex items-start gap-3">
                  <input
                    id={checkId}
                    type="checkbox"
                    className="check mt-1.5"
                    checked={selectedSets.includes(set.id)}
                    onChange={() => toggleSet(set.id)}
                  />
                  <label htmlFor={checkId} className="min-w-0 cursor-pointer">
                    <span className="font-display block text-xl leading-tight">{set.title}</span>
                    <span className="text-sm text-muted">
                      {set.ions.length} {set.ions.length === 1 ? "ion" : "ions"}, {status}
                    </span>
                  </label>
                </div>
                <div className="space-y-1">
                  <ProgressBar value={pct} label={`${set.title}: ${Math.round(pct * 100)}% mastered`} />
                  <p className="text-xs text-muted">{Math.round(pct * 100)}% at Mastery</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <button type="button" className={btnSecondary} onClick={() => begin([set.id])}>
                    {status === "Done" ? "Review" : "Start"}
                    <span className="sr-only"> {set.title}</span>
                  </button>
                  <ConfirmReset what={`${set.title} (${directionLabel(direction)})`} onConfirm={() => resetSet(set.id)} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DrillView({
  drill,
  levels,
  onChange,
  onLevels,
  onExit,
  onRestart,
}: {
  drill: ActiveDrill;
  levels: IonLevels;
  onChange: (d: ActiveDrill) => void;
  onLevels: (l: IonLevels) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const { state, feedback, rng } = drill;
  const titles = drill.setIds.map((id) => ION_SETS.find((s) => s.id === id)!.title);
  const question = state.current ? buildQuestion(state.current) : null;

  const submit = useCallback(
    (input: string) => {
      if (!question) return;
      const result = input === "" ? { correct: false } : checkAnswer(input, question.kind, question.accepted);
      const r = answerDrill(state, levels, input, result.correct, rng);
      onLevels(r.levels);
      const ion = ION_BY_KEY.get(question.key)!;
      onChange({
        ...drill,
        state: r.state,
        feedback: {
          correct: result.correct,
          given: input,
          hint: "hint" in result ? result.hint : undefined,
          answer: question.dir === "n2f" ? <Formula text={question.answer} /> : question.answer,
          explanation:
            question.dir === "f2n" && ion.alt ? `Also accepted: ${ion.alt.join(", ")}.` : result.correct ? undefined : "It comes back in a few questions.",
        },
      });
    },
    [question, state, levels, rng, onLevels, onChange, drill],
  );

  const next = useCallback(() => {
    onChange({ ...drill, state: advance(state, levels, rng), feedback: null });
  }, [drill, state, levels, rng, onChange]);

  const pct = masteredFraction(state.keys, state.mode, levels);
  const answered = state.results.length;
  const right = state.results.filter((r) => r.correct).length;

  const header = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {directionLabel(state.mode)}
            {state.review ? " · Review pass" : ""}
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{titles.join(" + ")}</h1>
        </div>
        <button type="button" className={btnSecondary} onClick={onExit}>
          {state.done ? "Back to sets" : "End drill"}
        </button>
      </div>
      <div className="space-y-1">
        <ProgressBar value={pct} label={`${Math.round(pct * 100)}% mastered`} />
        <p className="text-xs text-muted">
          {Math.round(pct * 100)}% at Mastery · {answered} answered · {right} correct
        </p>
      </div>
    </div>
  );

  if (state.done || !question) {
    const misses = state.results.filter((r) => !r.correct);
    const missedKeys = [...new Set(misses.map((m) => `${m.dir}|${m.key}`))];
    return (
      <div className="space-y-8">
        {header}
        <div className="space-y-4 border border-border bg-surface p-5 sm:p-7">
          <p className="font-display text-3xl">{state.review ? "Review done" : "Set done"}</p>
          <p className="text-muted">
            {right} of {answered} correct.{" "}
            {state.review ? "Everything here was already at Mastery." : "Every ion in this drill is at Mastery."}
          </p>
          {missedKeys.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display text-xl">Missed along the way</h2>
              <ul className="divide-y divide-border border-y border-border">
                {missedKeys.map((k) => {
                  const [dir, key] = k.split("|");
                  const ion = ION_BY_KEY.get(key)!;
                  return (
                    <li key={k} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>{ion.name}</span>
                      <Formula text={key} />
                      <span className="w-full text-xs text-muted sm:w-auto">{dir === "n2f" ? "name → formula" : "formula → name"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className={btnPrimary} onClick={onRestart} autoFocus>
              Drill again
            </button>
            <button type="button" className={btnSecondary} onClick={onExit}>
              Back to sets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const level = levels[question.dir][question.key] ?? 1;
  return (
    <div className="space-y-8">
      {header}
      <QuestionCard
        key={state.index}
        meta={
          <>
            <Stars level={level} />
            <span>{LEVEL_NAMES[level]}</span>
            <span aria-hidden>·</span>
            <span>{question.dir === "n2f" ? "Write the formula" : "Write the name"}</span>
            {state.current?.isRetry && <span className="text-accent">Back again</span>}
          </>
        }
        prompt={question.dir === "n2f" ? question.prompt : <Formula text={question.prompt} />}
        format="typed"
        inputLabel={question.dir === "n2f" ? "Formula, one space, then the charge" : "Name"}
        feedback={feedback}
        onSubmit={submit}
        onContinue={next}
      />
    </div>
  );
}
