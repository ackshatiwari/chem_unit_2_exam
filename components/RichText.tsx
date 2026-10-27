import { Fragment } from "react";
import { Formula } from "./Formula";

/** Splits text on {braces}: braced segments render as formulas, the rest as plain text. */
export function splitRich(text: string): { formula: boolean; value: string }[] {
  const parts: { formula: boolean; value: string }[] = [];
  const re = /\{([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ formula: false, value: text.slice(last, m.index) });
    parts.push({ formula: true, value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ formula: false, value: text.slice(last) });
  return parts;
}

/** Remove the formula braces, for aria-labels and plain-text contexts. */
export function plainText(text: string): string {
  return text.replace(/\{([^}]+)\}/g, "$1");
}

export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitRich(text).map((p, i) =>
        p.formula ? <Formula key={i} text={p.value} /> : <Fragment key={i}>{p.value}</Fragment>,
      )}
    </>
  );
}
