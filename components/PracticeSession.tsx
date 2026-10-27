"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { checkAnswer } from "@/lib/check";
import { GENERATORS } from "@/lib/generators";
import { LEVEL_NAMES } from "@/lib/mastery";
import type { Question } from "@/lib/question";
import { createRng, randomSeed, type Rng } from "@/lib/rng";
import { getSection, getSublabel, sectionOfSublabel, SECTIONS, type SectionId } from "@/lib/sections";
import {
  advanceSession,
  answerSession,
  sessionScore,
  startSession,
  type Levels,
  type SessionLength,
  type SessionState,
} from "@/lib/session";
import type { Level, ProgressState } from "@/lib/storage";
import { useProgress } from "@/lib/useProgress";
import { Formula } from "./Formula";
import { LewisDiagram } from "./LewisDiagram";
import { QuestionCard, type Feedback } from "./QuestionCard";
import { RichText } from "./RichText";
import { btnPrimary, btnSecondary, PageTitle, ProgressBar, SegmentedControl, Stars } from "./ui";

const LENGTHS: { value: string; label: string }[] = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "mastery", label: "Until mastered" },
];

function toLength(v: string): SessionLength {
  return v === "mastery" ? "mastery" : (parseInt(v, 10) as 10 | 20 | 30);
}

function mergedLevels(p: ProgressState): Levels {
  return Object.assign({}, ...SECTIONS.map((s) => p.tiles[s.id].levels));
}

/** Write changed sublabel levels back into their tiles. */
function withLevels(p: ProgressState, levels: Levels, ids: string[]): ProgressState {
  const tiles = { ...p.tiles };
  for (const id of ids) {
    const sec = sectionOfSublabel(id);
    if (!levels[id]) continue;
    tiles[sec] = { ...tiles[sec], levels: { ...tiles[sec].levels, [id]: levels[id] } };
  }
  return { ...p, tiles };
}

function AnswerText({ q }: { q: Question }) {
  if (q.kind === "formula") return <Formula text={q.answer} />;
  if (q.kind === "angle") return <>{q.answer}°</>;
  return <RichText text={q.answer} />;
}

interface Running {
  session: SessionState;
  rng: Rng;
  feedback: Feedback | null;
}

export function PracticeSession({ sectionId }: { sectionId: SectionId | "mixed" }) {
  const { state: progress, update, loaded } = useProgress();
  const [lengthChoice, setLengthChoice] = useState("10");
  const [run, setRun] = useState<Running | null>(null);
  const [finished, setFinished] = useState<SessionState | null>(null);

  // Next keeps visited pages mounted but hidden. When this page is hidden, drop the
  // in-progress session or summary so coming back starts at the setup screen with
  // whatever is checked now. (Answers already saved their stars.)
  useLayoutEffect(
    () => () => {
      setRun(null);
      setFinished(null);
    },
    [],
  );

  const section = sectionId === "mixed" ? null : getSection(sectionId)!;
  const title = section ? `${section.id} · ${section.title}` : "Mixed test";
  const selected =
    sectionId === "mixed"
      ? SECTIONS.flatMap((s) => progress.tiles[s.id].selected)
      : progress.tiles[sectionId].selected;
  const sublabelIds = selected.filter((id) => GENERATORS[id]);
  const levels = mergedLevels(progress);

  const start = () => {
    const rng = createRng(randomSeed());
    setFinished(null);
    setRun({ session: startSession(sublabelIds, toLength(lengthChoice), levels, GENERATORS, rng), rng, feedback: null });
    window.scrollTo({ top: 0 });
  };

  const submit = (input: string) => {
    if (!run?.session.current) return;
    const q = run.session.current.question;
    const result = input === "" ? { correct: false as const } : checkAnswer(input, q.kind, q.acceptedAnswers);
    const r = answerSession(run.session, levels, input, result.correct, run.rng);
    update((p) => withLevels(p, r.levels, [q.sublabelId]));
    setRun({
      ...run,
      session: r.state,
      feedback: {
        correct: result.correct,
        given: input,
        hint: "hint" in result ? result.hint : undefined,
        answer: <AnswerText q={q} />,
        explanation: <RichText text={q.explanation} />,
      },
    });
  };

  const next = () => {
    if (!run) return;
    const session = advanceSession(run.session, levels, GENERATORS, run.rng);
    if (session.done) {
      setFinished(session);
      setRun(null);
      window.scrollTo({ top: 0 });
      return;
    }
    setRun({ ...run, session, feedback: null });
  };

  const end = () => {
    if (!run) return;
    setFinished(run.session);
    setRun(null);
  };

  if (!loaded) {
    return (
      <div className="space-y-6" aria-busy>
        <PageTitle>{title}</PageTitle>
        <p className="text-muted">Loading your progress…</p>
      </div>
    );
  }

  if (finished) {
    return (
      <Summary
        title={title}
        session={finished}
        levels={levels}
        onAgain={start}
        onSetup={() => setFinished(null)}
      />
    );
  }

  if (run?.session.current) {
    const { session, feedback } = run;
    const { question: q, isRetry } = session.current!;
    const level: Level = levels[q.sublabelId]?.level ?? 1;
    const fixed = session.length !== "mastery";
    const masteredCount = session.sublabelIds.filter((id) => (levels[id]?.level ?? 1) === 4).length;
    const pct = fixed ? (session.served - (feedback ? 0 : 1)) / (session.length as number) : masteredCount / session.sublabelIds.length;
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{title}</p>
              <p className="font-display text-3xl leading-tight sm:text-4xl" aria-live="polite">
                {fixed ? `Question ${session.served} of ${session.length}` : `${masteredCount} of ${session.sublabelIds.length} mastered`}
              </p>
            </div>
            <button type="button" className={btnSecondary} onClick={end}>
              End session
            </button>
          </div>
          <ProgressBar value={pct} label={fixed ? "Session progress" : "Skills mastered"} />
        </div>
        <QuestionCard
          key={session.index}
          meta={
            <>
              <span className="font-mono text-xs">{q.sublabelId}</span>
              <Stars level={level} />
              <span>{LEVEL_NAMES[level]}</span>
              {isRetry && <span className="text-accent">Back again</span>}
            </>
          }
          prompt={<RichText text={q.prompt} />}
          figure={
            q.figure ? (
              <LewisDiagram
                structure={q.figure.structure}
                highlight={q.figure.highlight}
                showFormalCharges={q.figure.showFormalCharges || (feedback !== null && q.figure.highlight !== undefined)}
              />
            ) : undefined
          }
          format={q.format}
          choices={q.choices}
          correctChoice={q.format === "mc" ? q.answer : undefined}
          inputLabel={q.inputLabel}
          feedback={feedback}
          onSubmit={submit}
          onContinue={next}
        />
        <p className="text-sm text-muted">{getSublabel(q.sublabelId)?.text}</p>
      </div>
    );
  }

  // Setup
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-muted hover:text-fg">
          ← Dashboard
        </Link>
        <PageTitle>{title}</PageTitle>
      </div>

      {sublabelIds.length === 0 ? (
        <div className="max-w-2xl space-y-4 border border-border bg-surface p-5 sm:p-7">
          <p className="font-display text-2xl">Nothing checked yet</p>
          <p className="text-muted">
            {section
              ? `Check at least one skill on the ${section.title} tile to build this test.`
              : "Check at least one skill on any tile to build a mixed test."}
          </p>
          <Link href="/" className={btnPrimary}>
            Back to dashboard
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="on-test" className="max-w-3xl space-y-3">
            <h2 id="on-test" className="font-display text-2xl">
              On this test
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {sublabelIds.map((id) => {
                const lv: Level = levels[id]?.level ?? 1;
                return (
                  <li key={id} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className="w-6 shrink-0 font-mono text-xs leading-5 text-muted">{id}</span>
                    <span className="flex-1 leading-snug">{getSublabel(id)?.text}</span>
                    <Stars level={lv} />
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-muted">
              Questions rotate through these skills; lower-star skills come up more often. Change the list on the{" "}
              <Link href="/" className="underline underline-offset-4 hover:text-fg">
                dashboard
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="len" className="space-y-3">
            <h2 id="len" className="font-display text-2xl">
              Length
            </h2>
            <SegmentedControl label="Session length" options={LENGTHS} value={lengthChoice} onChange={setLengthChoice} />
            <p className="text-sm text-muted">
              {lengthChoice === "mastery"
                ? "Keeps going until every skill above reaches Mastery (three stars)."
                : `${lengthChoice} questions. Misses come back a few questions later.`}
            </p>
          </section>

          <button type="button" className={btnPrimary} onClick={start}>
            Start
          </button>
        </>
      )}
    </div>
  );
}

function Summary({
  title,
  session,
  levels,
  onAgain,
  onSetup,
}: {
  title: string;
  session: SessionState;
  levels: Levels;
  onAgain: () => void;
  onSetup: () => void;
}) {
  const score = sessionScore(session);
  const seen = new Set<string>();
  const missed = session.results.filter((r) => {
    if (r.correct || seen.has(r.question.id)) return false;
    seen.add(r.question.id);
    return true;
  });
  const asked = session.sublabelIds.filter((id) => session.results.some((r) => r.question.sublabelId === id));
  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm text-muted">{title}</p>
        <PageTitle>
          {score.correct} / {score.total}
        </PageTitle>
        <p className="text-muted">
          {score.total === 0
            ? "No questions answered."
            : `${pct}% on first tries${session.results.length > score.total ? `, plus ${session.results.length - score.total} retries` : ""}.`}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" className={btnPrimary} onClick={onAgain} autoFocus>
            Practice again
          </button>
          <button type="button" className={btnSecondary} onClick={onSetup}>
            Change length
          </button>
          <Link href="/" className={btnSecondary}>
            Dashboard
          </Link>
        </div>
      </div>

      {asked.length > 0 && (
        <section aria-labelledby="stars-h" className="max-w-3xl space-y-3">
          <h2 id="stars-h" className="font-display text-2xl">
            Star changes
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {asked.map((id) => {
              const before: Level = session.startLevels[id]?.level ?? 1;
              const after: Level = levels[id]?.level ?? 1;
              const change = after > before ? "up" : after < before ? "down" : "same";
              return (
                <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="w-6 shrink-0 font-mono text-xs text-muted">{id}</span>
                  <span className="min-w-0 flex-1 basis-48 leading-snug">{getSublabel(id)?.text}</span>
                  <span className="flex items-center gap-2">
                    <Stars level={before} />
                    <span aria-hidden className="text-muted">
                      →
                    </span>
                    <span className="sr-only">to</span>
                    <Stars level={after} />
                    <span
                      className={`w-12 text-right text-xs ${change === "up" ? "text-success" : change === "down" ? "text-accent" : "text-muted"}`}
                    >
                      {change === "same" ? "same" : change}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="missed-h" className="max-w-3xl space-y-3">
        <h2 id="missed-h" className="font-display text-2xl">
          Missed questions
        </h2>
        {missed.length === 0 ? (
          <p className="text-muted">{score.total === 0 ? "Nothing to show yet." : "None. Clean run."}</p>
        ) : (
          <ol className="space-y-3">
            {missed.map((r) => (
              <li key={r.question.id} className="space-y-1.5 border border-border bg-surface p-4">
                <p className="font-medium">
                  <RichText text={r.question.prompt} />
                </p>
                <p className="text-sm">
                  <span className="text-muted">You: </span>
                  <span className={`text-accent ${r.question.format === "typed" ? "font-mono" : ""}`}>
                    {r.input === "" ? "(showed answer)" : r.question.format === "mc" ? <RichText text={r.input} /> : r.input}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted">Answer: </span>
                  <span className="text-success">
                    <AnswerText q={r.question} />
                  </span>
                </p>
                <p className="text-sm text-muted">
                  <RichText text={r.question.explanation} />
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
