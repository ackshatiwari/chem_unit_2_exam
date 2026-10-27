import type { LewisStructure } from "@/data/lewis";
import { chargeLabel } from "@/lib/formula";
import { formalCharge, signed } from "@/lib/lewis";
import { freeDiagonal, layoutLewis, lpRadius, pointAt } from "@/lib/lewisLayout";

const ATOM_GAP = 11; // bond lines stop this far from an atom's center
const DOT_R = 1.9;
const DOT_SPREAD = 3.4;

/** Renders a Lewis structure as SVG from its atoms, bonds, and lone pairs. */
export function LewisDiagram({
  structure,
  highlight,
  showFormalCharges = false,
}: {
  structure: LewisStructure;
  highlight?: number;
  showFormalCharges?: boolean;
}) {
  const layout = layoutLewis(structure);
  const isIon = structure.charge !== 0;
  const b = layout.bounds;
  const bracketPad = isIon ? 12 : 0;
  const minX = b.minX - bracketPad - 4;
  const maxX = b.maxX + bracketPad + (isIon ? 22 : 4);
  const minY = b.minY - 6;
  const maxY = b.maxY + 6;
  const w = maxX - minX;
  const h = maxY - minY;

  const label = `Lewis structure of ${structure.formula}${highlight !== undefined ? `, atom ${highlight + 1} highlighted` : ""}`;

  return (
    <figure className="flex justify-center border border-border bg-bg/60 px-2 py-4">
      <svg
        role="img"
        aria-label={label}
        viewBox={`${minX} ${minY} ${w} ${h}`}
        width={w * 1.7}
        height={h * 1.7}
        className="h-auto max-w-full text-fg"
        style={{ maxHeight: 300 }}
      >
        {/* bonds */}
        {layout.bonds.map(({ a, b: c, order }, i) => {
          const p = layout.atoms[a].pos;
          const q = layout.atoms[c].pos;
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          const offsets = order === 1 ? [0] : order === 2 ? [-2.8, 2.8] : [-4.4, 0, 4.4];
          return offsets.map((o, k) => (
            <line
              key={`${i}-${k}`}
              x1={p.x + ux * ATOM_GAP - uy * o}
              y1={p.y + uy * ATOM_GAP + ux * o}
              x2={q.x - ux * ATOM_GAP - uy * o}
              y2={q.y - uy * ATOM_GAP + ux * o}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ));
        })}

        {/* atoms, lone pairs, formal charges */}
        {layout.atoms.map((atom, i) => {
          const fc = formalCharge(structure, i);
          const bondDirs = layout.bonds
            .filter((bd) => bd.a === i || bd.b === i)
            .map((bd) => {
              const o = layout.atoms[bd.a === i ? bd.b : bd.a].pos;
              return (Math.atan2(o.y - atom.pos.y, o.x - atom.pos.x) * 180) / Math.PI;
            });
          const fcPos = pointAt(atom.pos, freeDiagonal([...bondDirs, ...atom.lonePairs]), 20);
          return (
            <g key={i}>
              {highlight === i && (
                <circle cx={atom.pos.x} cy={atom.pos.y} r={10.5} fill="none" stroke="var(--callout)" strokeWidth={1.8} />
              )}
              <text
                x={atom.pos.x}
                y={atom.pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={atom.el.length > 1 ? 13 : 15}
                fontWeight={500}
                fill="currentColor"
              >
                {atom.el}
              </text>
              {atom.lonePairs.map((ang, k) => {
                const c = pointAt(atom.pos, ang, lpRadius(atom.el));
                const perp = ang + 90;
                const d1 = pointAt(c, perp, DOT_SPREAD);
                const d2 = pointAt(c, perp, -DOT_SPREAD);
                return (
                  <g key={k}>
                    <circle cx={d1.x} cy={d1.y} r={DOT_R} fill="currentColor" />
                    <circle cx={d2.x} cy={d2.y} r={DOT_R} fill="currentColor" />
                  </g>
                );
              })}
              {showFormalCharges && fc !== 0 && (
                <text
                  x={fcPos.x}
                  y={fcPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="var(--callout)"
                >
                  {signed(fc)}
                </text>
              )}
            </g>
          );
        })}

        {/* brackets and overall charge for ions */}
        {isIon && (
          <g stroke="currentColor" strokeWidth={1.3} fill="none">
            <path d={`M ${b.minX - 2} ${b.minY} h -6 V ${b.maxY} h 6`} />
            <path d={`M ${b.maxX + 2} ${b.minY} h 6 V ${b.maxY} h -6`} />
            <text
              x={b.maxX + 11}
              y={b.minY + 3}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="currentColor"
              stroke="none"
            >
              {chargeLabel(structure.charge)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
