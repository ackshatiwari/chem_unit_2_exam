"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { LEVEL_NAMES } from "@/lib/mastery";
import type { Level } from "@/lib/storage";

/* ---------- Segmented control ---------- */

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** A single bordered box; the selected segment is light with dark text. Arrow keys move the selection. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % options.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = options.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex w-full max-w-full border border-border sm:w-auto"
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`min-h-10 flex-1 px-3 py-2 text-center text-sm leading-tight font-medium sm:flex-none sm:px-4 ${
              i > 0 ? "border-l border-border" : ""
            } ${active ? "bg-seg-active-bg text-seg-active-fg" : "text-muted hover:bg-surface-2 hover:text-fg"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Callout ---------- */

export function Callout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-callout bg-callout-bg px-4 py-3 text-sm leading-relaxed text-fg ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Progress bar ---------- */

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-1 w-full bg-surface-2"
    >
      <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Stars ---------- */

export function Stars({ level, className = "" }: { level: Level; className?: string }) {
  const filled = level - 1;
  return (
    <span
      role="img"
      aria-label={`${LEVEL_NAMES[level]}, ${filled} of 3 stars`}
      title={LEVEL_NAMES[level]}
      className={`inline-flex shrink-0 tracking-[0.1em] whitespace-nowrap ${className}`}
    >
      <span aria-hidden className="text-callout">
        {"★".repeat(filled)}
      </span>
      <span aria-hidden className="text-muted/60">
        {"☆".repeat(3 - filled)}
      </span>
    </span>
  );
}

/* ---------- Buttons ---------- */

export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center border border-seg-active-bg bg-seg-active-bg px-4 py-2 text-sm font-semibold text-seg-active-fg hover:bg-fg disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted";

export const btnSecondary =
  "inline-flex min-h-10 items-center justify-center border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted";

export const btnGhost =
  "inline-flex min-h-8 items-center px-1 text-sm text-muted underline-offset-4 hover:text-fg hover:underline";

/** A small "Reset progress" action with an inline confirm step. */
export function ConfirmReset({ what, onConfirm }: { what: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={btnGhost} onClick={() => setAsking(true)}>
        Reset progress
      </button>
    );
  }
  return (
    <span role="group" aria-label={`Confirm reset of ${what}`} className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Reset {what}?</span>
      <button
        type="button"
        autoFocus
        className="border border-accent px-2 py-1 text-accent hover:bg-accent hover:text-bg"
        onClick={() => {
          onConfirm();
          setAsking(false);
        }}
      >
        Reset
      </button>
      <button type="button" className="border border-border px-2 py-1 text-fg hover:bg-surface-2" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  );
}

/* ---------- Headings ---------- */

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-[2.75rem] leading-[0.95] sm:text-[3.5rem] lg:text-[4rem]">{children}</h1>;
}

export function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-2xl leading-tight">
      {children}
    </h2>
  );
}
