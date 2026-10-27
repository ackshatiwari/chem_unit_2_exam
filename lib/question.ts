import type { AnswerKind } from "./check";
import type { LewisStructure } from "@/data/lewis";
import type { Rng } from "./rng";

/**
 * One practice question. `prompt`, `choices`, and `explanation` are rich text:
 * anything in {braces} renders as a formula, e.g. "Name {Fe(NO3)3}."
 */
export interface Question {
  id: string;
  sublabelId: string;
  prompt: string;
  format: "typed" | "mc";
  choices?: string[];
  answer: string;
  acceptedAnswers: string[];
  explanation: string;
  /** How typed input is checked ("choice" for multiple choice). */
  kind: AnswerKind;
  inputLabel?: string;
  /** Optional Lewis drawing shown with the prompt. */
  figure?: { structure: LewisStructure; highlight?: number; showFormalCharges?: boolean };
}

export type Generator = (rng: Rng) => Question;

export function typed(
  sublabelId: string,
  id: string,
  prompt: string,
  kind: Exclude<AnswerKind, "choice">,
  answer: string,
  explanation: string,
  opts: { accepted?: string[]; inputLabel?: string; figure?: Question["figure"] } = {},
): Question {
  return {
    id: `${sublabelId}:${id}`,
    sublabelId,
    prompt,
    format: "typed",
    answer,
    acceptedAnswers: [answer, ...(opts.accepted ?? [])],
    explanation,
    kind,
    inputLabel: opts.inputLabel ?? defaultLabel(kind),
    figure: opts.figure,
  };
}

function defaultLabel(kind: AnswerKind): string {
  switch (kind) {
    case "formula":
      return "Formula";
    case "name":
      return "Name";
    case "integer":
      return "Whole number";
    case "angle":
      return "Angle in degrees";
    default:
      return "Your answer";
  }
}

/** Multiple choice with shuffled options (up to 4). */
export function mc(
  sublabelId: string,
  id: string,
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  rng: Rng,
  opts: { figure?: Question["figure"]; shuffle?: boolean } = {},
): Question {
  const unique = [...new Set(distractors.filter((d) => d !== correct))].slice(0, 3);
  const all = [correct, ...unique];
  return {
    id: `${sublabelId}:${id}`,
    sublabelId,
    prompt,
    format: "mc",
    choices: opts.shuffle === false ? all : rng.shuffle(all),
    answer: correct,
    acceptedAnswers: [correct],
    explanation,
    kind: "choice",
    figure: opts.figure,
  };
}

/** True/false: fixed order so "True" is always key 1. */
export function trueFalse(
  sublabelId: string,
  id: string,
  statement: string,
  isTrue: boolean,
  explanation: string,
  opts: { figure?: Question["figure"] } = {},
): Question {
  const answer = isTrue ? "True" : "False";
  return {
    id: `${sublabelId}:${id}`,
    sublabelId,
    prompt: statement,
    format: "mc",
    choices: ["True", "False"],
    answer,
    acceptedAnswers: [answer],
    explanation,
    kind: "choice",
    figure: opts.figure,
  };
}
