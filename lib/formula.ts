import { ALL_SYMBOLS } from "@/data/elements";

// Plain-text formula format used everywhere in the app:
//   formula, one space, then the charge with no caret — "Cr2O7 2-", "NH4 +", "NO3 -".
// Digits after an element or ")" are subscripts; a digit at the start or right
// after the hydrate dot is a coefficient ("CuSO4·5H2O").

export type FormulaToken =
  | { kind: "text"; value: string }
  | { kind: "sub"; value: string }
  | { kind: "sup"; value: string };

export interface ParsedFormula {
  body: string;
  /** Signed charge, 0 for neutral. */
  charge: number;
  tokens: FormulaToken[];
  /** Element symbols in order of appearance (with repeats). */
  symbols: string[];
}

const CHARGE_RE = /^(.*\S) (\d*)([+-])$/;

export function splitCharge(text: string): { body: string; charge: number } {
  const m = CHARGE_RE.exec(text);
  if (!m) return { body: text, charge: 0 };
  const n = m[2] === "" ? 1 : parseInt(m[2], 10);
  return { body: m[1], charge: m[3] === "-" ? -n : n };
}

/** Display form of a charge: −, 2−, +, 3+ (true minus sign). */
export function chargeLabel(charge: number): string {
  if (charge === 0) return "";
  const mag = Math.abs(charge);
  return `${mag === 1 ? "" : mag}${charge < 0 ? "−" : "+"}`;
}

/** Plain-text form used in answers: "SO3 2-", "NH4 +", or just the body when neutral. */
export function formatFormula(body: string, charge: number): string {
  if (charge === 0) return body;
  const mag = Math.abs(charge);
  return `${body} ${mag === 1 ? "" : mag}${charge < 0 ? "-" : "+"}`;
}

export function parseFormula(text: string): ParsedFormula {
  const { body, charge } = splitCharge(text);
  const tokens: FormulaToken[] = [];
  const symbols: string[] = [];
  const push = (kind: FormulaToken["kind"], value: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.value += value;
    else tokens.push({ kind, value });
  };

  // What the previous character was, so we know whether a digit is a subscript.
  let prev: "start" | "element" | "close" | "other" = "start";
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (/[A-Z]/.test(ch)) {
      let sym = ch;
      if (i + 1 < body.length && /[a-z]/.test(body[i + 1])) {
        sym += body[i + 1];
      }
      // Two-letter symbol only if it is a real element (so "Co" is cobalt but "CO" stays C + O).
      if (sym.length === 2 && !ALL_SYMBOLS.has(sym) && ALL_SYMBOLS.has(ch)) sym = ch;
      symbols.push(sym);
      push("text", sym);
      i += sym.length;
      prev = "element";
      continue;
    }
    if (/\d/.test(ch)) {
      let num = ch;
      while (i + 1 < body.length && /\d/.test(body[i + 1])) num += body[++i];
      i++;
      const isSub = prev === "element" || prev === "close";
      push(isSub ? "sub" : "text", num);
      // A coefficient ("5" in "·5H2O") is ordinary text.
      if (!isSub) prev = "other";
      continue;
    }
    if (ch === ")" || ch === "]") {
      push("text", ch);
      prev = "close";
      i++;
      continue;
    }
    push("text", ch);
    prev = "other";
    i++;
  }
  if (charge !== 0) push("sup", chargeLabel(charge));
  return { body, charge, tokens, symbols };
}

/**
 * Strict check for data files: every symbol must be a real element, parentheses
 * must balance, and there must be no stray lowercase letters. Returns a list of problems.
 */
export function validateFormula(text: string): string[] {
  const problems: string[] = [];
  const { body } = splitCharge(text);
  const parsed = parseFormula(text);
  for (const s of parsed.symbols) {
    if (!ALL_SYMBOLS.has(s)) problems.push(`unknown element "${s}"`);
  }
  let depth = 0;
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) problems.push("unbalanced parentheses");
  }
  if (depth !== 0) problems.push("unbalanced parentheses");
  // Lowercase letters must belong to a two-letter symbol.
  const stripped = body.replace(/[A-Z][a-z]?/g, (m) => (ALL_SYMBOLS.has(m) ? "" : m));
  if (/[a-z]/.test(stripped)) problems.push("stray lowercase letter");
  if (/[^A-Za-z0-9()·]/.test(body)) problems.push("unexpected character");
  if (/ /.test(text) && splitCharge(text).charge === 0) problems.push("space without a valid charge");
  return [...new Set(problems)];
}

/** Count atoms of each element, expanding parentheses and hydrate coefficients. */
export function countAtoms(text: string): Map<string, number> {
  const { body } = splitCharge(text);
  const total = new Map<string, number>();
  for (const part of body.split("·")) {
    const m = /^(\d+)(.*)$/.exec(part);
    const coef = m ? parseInt(m[1], 10) : 1;
    const counts = countGroup(m ? m[2] : part);
    for (const [k, v] of counts) total.set(k, (total.get(k) ?? 0) + v * coef);
  }
  return total;
}

function countGroup(s: string): Map<string, number> {
  const stack: Map<string, number>[] = [new Map()];
  let i = 0;
  const readNum = () => {
    let num = "";
    while (i < s.length && /\d/.test(s[i])) num += s[i++];
    return num === "" ? 1 : parseInt(num, 10);
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "(") {
      stack.push(new Map());
      i++;
    } else if (ch === ")") {
      i++;
      const n = readNum();
      const inner = stack.pop()!;
      const top = stack[stack.length - 1];
      for (const [k, v] of inner) top.set(k, (top.get(k) ?? 0) + v * n);
    } else if (/[A-Z]/.test(ch)) {
      let sym = ch;
      if (i + 1 < s.length && /[a-z]/.test(s[i + 1]) && ALL_SYMBOLS.has(ch + s[i + 1])) sym += s[i + 1];
      i += sym.length;
      const n = readNum();
      const top = stack[stack.length - 1];
      top.set(sym, (top.get(sym) ?? 0) + n);
    } else {
      i++;
    }
  }
  return stack[0];
}
