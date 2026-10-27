// Answer checking rules.
//
// - Input is trimmed and repeated spaces collapse to one.
// - Names: case-insensitive; listed alternates also count ("bicarbonate").
// - Formulas: case-sensitive (Cl, not CL). Formula, one space, then the charge,
//   no carets: "SO3 2-", "NH4 +". For 1− ions "NO3 -" and "NO3 1-" both count
//   (likewise "NH4 +" and "NH4 1+"). Neutral formulas have no charge.
// - Hydrates: ·, *, or . all count as the dot.
// - Numbers: exact integers. Angles accept an optional ° sign.

export type AnswerKind = "name" | "formula" | "integer" | "angle" | "choice";

export interface CheckResult {
  correct: boolean;
  /** Formatting hint for near-misses, e.g. wrong capitalization. */
  hint?: string;
}

export function collapse(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Unicode minus and dashes → ASCII hyphen, so "SO3 2−" typed on a phone still parses. */
function asciiMinus(s: string): string {
  return s.replace(/[−–—]/g, "-");
}

export function normalizeName(s: string): string {
  return collapse(s)
    .toLowerCase()
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
    .replace(/\.$/, "");
}

/**
 * Canonical formula text: one hydrate dot style, "1-" folded into "-".
 * Malformed input (e.g. a charge with no space) passes through and simply won't match.
 */
export function canonicalFormula(raw: string): string {
  let s = asciiMinus(collapse(raw));
  // Hydrate dot: ·, *, . (and bullet look-alikes), with or without spaces around it.
  s = s.replace(/\s*[·•∙⋅*.]\s*/g, "·");
  // "HCl (aq)" → "HCl(aq)"
  s = s.replace(/\s+\(aq\)$/i, "(aq)");
  const m = /^(.*\S) (\d*)([+-])$/.exec(s);
  if (!m) return s;
  const n = m[2] === "" ? 1 : parseInt(m[2], 10);
  return `${m[1]} ${n === 1 ? "" : n}${m[3]}`;
}

export function parseInteger(raw: string): number | null {
  const s = asciiMinus(collapse(raw)).replace(/\s/g, "");
  if (!/^[+-]?\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

export function parseAngle(raw: string): number | null {
  const s = collapse(raw).replace(/\s*(°|º|degrees?|deg)$/i, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

function formulaHint(input: string, accepted: string[]): string | undefined {
  const s = collapse(input);
  if (s.includes("^")) return "Leave out the caret: write SO3 2-, not SO3^2-.";
  const canon = canonicalFormula(s);
  const target = accepted.map(canonicalFormula);
  if (target.some((t) => t.toLowerCase() === canon.toLowerCase())) {
    return "Capital letters count (Cl, not CL).";
  }
  if (/ [+-]\d+$/.test(asciiMinus(s))) return "Put the number before the sign: 2-, not -2.";
  const squash = (x: string) => x.replace(/\s/g, "");
  if (target.some((t) => squash(t) === squash(canon) || squash(t).replace(/1([+-])$/, "$1") === squash(canon))) {
    return "Put one space between the formula and the charge.";
  }
  const targetHasCharge = target.some((t) => / \d*[+-]$/.test(t));
  const inputHasCharge = / \d*[+-]$/.test(canon);
  if (targetHasCharge && !inputHasCharge) {
    const bodies = target.map((t) => t.replace(/ \d*[+-]$/, ""));
    if (bodies.includes(canon)) return "Include the charge.";
  }
  if (!targetHasCharge && inputHasCharge) {
    if (target.includes(canon.replace(/ \d*[+-]$/, ""))) return "This one is neutral, so leave off the charge.";
  }
  return undefined;
}

export function checkAnswer(input: string, kind: AnswerKind, accepted: string[]): CheckResult {
  switch (kind) {
    case "choice":
      return { correct: accepted.includes(input) };

    case "name": {
      const n = normalizeName(input);
      return { correct: accepted.some((a) => normalizeName(a) === n) };
    }

    case "formula": {
      const canon = canonicalFormula(input);
      if (accepted.some((a) => canonicalFormula(a) === canon)) return { correct: true };
      return { correct: false, hint: formulaHint(input, accepted) };
    }

    case "integer": {
      const n = parseInteger(input);
      if (n === null) return { correct: false, hint: "Type a whole number." };
      return { correct: accepted.some((a) => parseInteger(a) === n) };
    }

    case "angle": {
      const n = parseAngle(input);
      if (n === null) return { correct: false, hint: "Type the angle as a number, like 109.5." };
      return { correct: accepted.some((a) => parseAngle(a) === n) };
    }
  }
}
