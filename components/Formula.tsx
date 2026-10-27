import { parseFormula } from "@/lib/formula";

/** Renders plain-text formulas like "Cr2O7 2-" as Cr₂O₇²⁻ with real sub/sup elements. */
export function Formula({ text, className = "" }: { text: string; className?: string }) {
  const { tokens } = parseFormula(text);
  return (
    <span className={`font-mono whitespace-nowrap ${className}`}>
      {tokens.map((t, i) =>
        t.kind === "sub" ? (
          <sub key={i}>{t.value}</sub>
        ) : t.kind === "sup" ? (
          <sup key={i}>{t.value}</sup>
        ) : (
          <span key={i}>{t.value}</span>
        ),
      )}
    </span>
  );
}
