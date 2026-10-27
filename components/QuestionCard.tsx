"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RichText } from "./RichText";
import { btnPrimary, btnSecondary } from "./ui";

export interface Feedback {
  correct: boolean;
  /** What the student entered or picked ("" when skipped). */
  given: string;
  answer: ReactNode;
  explanation?: ReactNode;
  hint?: string;
}

interface Props {
  /** Small line above the prompt: sublabel, stars, retry marker. */
  meta?: ReactNode;
  prompt: ReactNode;
  figure?: ReactNode;
  format: "typed" | "mc";
  choices?: string[];
  /** The right choice, highlighted after answering. */
  correctChoice?: string;
  inputLabel?: string;
  placeholder?: string;
  feedback: Feedback | null;
  onSubmit: (value: string) => void;
  onContinue: () => void;
  continueLabel?: string;
}

/**
 * One question. Typed: mono input, Enter submits. Multiple choice: keys 1–4 pick.
 * After answering: correct/wrong state, the answer, a one-line explanation; Enter continues.
 */
export function QuestionCard({
  meta,
  prompt,
  figure,
  format,
  choices = [],
  correctChoice,
  inputLabel = "Your answer",
  placeholder,
  feedback,
  onSubmit,
  onContinue,
  continueLabel = "Continue",
}: Props) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const answered = feedback !== null;

  // MC: number keys pick an option.
  useEffect(() => {
    if (format !== "mc" || answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= choices.length) {
        e.preventDefault();
        onSubmit(choices[n - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [format, answered, choices, onSubmit]);

  // After answering: focus Continue so Enter moves on. If focus wandered off
  // to the page body, Enter still continues.
  useEffect(() => {
    if (!answered) return;
    continueRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const el = document.activeElement;
      if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement || el instanceof HTMLInputElement) return;
      e.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, onContinue]);

  return (
    <div className="border border-border bg-surface">
      <div className="space-y-5 p-5 sm:p-7">
        {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">{meta}</div>}
        <div className="text-xl leading-snug font-medium sm:text-2xl" id={`${inputId}-prompt`}>
          {prompt}
        </div>
        {figure}

        {format === "typed" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (answered) return;
              if (value.trim() === "") return;
              onSubmit(value);
            }}
            className="space-y-3"
          >
            <label htmlFor={inputId} className="block text-sm text-muted">
              {inputLabel}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id={inputId}
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                readOnly={answered}
                aria-describedby={`${inputId}-prompt`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={placeholder}
                className={`min-h-11 w-full min-w-0 flex-1 border bg-surface-2 px-3 py-2 font-mono text-lg text-fg placeholder:text-muted/60 focus:outline-none focus-visible:outline-2 ${
                  answered ? (feedback.correct ? "border-success" : "border-accent") : "border-border focus:border-fg"
                }`}
              />
              {!answered && (
                <div className="flex gap-2">
                  <button type="submit" className={`${btnPrimary} flex-1 sm:flex-none`} disabled={value.trim() === ""}>
                    Check
                  </button>
                  <button type="button" className={`${btnSecondary} flex-1 sm:flex-none`} onClick={() => onSubmit("")}>
                    Show answer
                  </button>
                </div>
              )}
            </div>
          </form>
        ) : (
          <div role="group" aria-label="Choices" className="grid gap-2">
            {choices.map((c, i) => {
              const picked = answered && feedback.given === c;
              let tone = "border-border hover:bg-surface-2";
              if (answered) {
                tone = "border-border text-muted";
                if (c === correctChoice) tone = "border-success text-success";
                else if (picked) tone = "border-accent text-accent";
              }
              return (
                <button
                  key={c}
                  type="button"
                  disabled={answered}
                  aria-pressed={picked}
                  onClick={() => onSubmit(c)}
                  className={`flex min-h-11 items-center gap-3 border px-3 py-2 text-left text-base ${tone} disabled:cursor-default`}
                >
                  <span aria-hidden className="w-5 shrink-0 font-mono text-sm text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <RichText text={c} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {answered && (
        <div
          role="status"
          className={`space-y-2 border-t p-5 sm:px-7 ${feedback.correct ? "border-success" : "border-accent"}`}
        >
          <p className={`font-display text-xl ${feedback.correct ? "text-success" : "text-accent"}`}>
            {feedback.correct ? "Correct" : feedback.given === "" ? "Answer" : "Not quite"}
          </p>
          {!feedback.correct && feedback.hint && <p className="text-sm text-callout">{feedback.hint}</p>}
          <p className="text-base">
            <span className="text-muted">Answer: </span>
            <span className="font-medium">{feedback.answer}</span>
          </p>
          {feedback.explanation && <p className="text-sm leading-relaxed text-muted">{feedback.explanation}</p>}
          <div className="pt-2">
            <button ref={continueRef} type="button" className={btnPrimary} onClick={onContinue}>
              {continueLabel} <span className="ml-2 text-xs font-normal opacity-70">Enter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
