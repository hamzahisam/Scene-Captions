"use client";
import type { KeyboardEvent } from "react";
import { allowed } from "@/lib/captune/project";
import type { Project, Point } from "@/lib/captune/project";
import { Icon } from "../icon";
export function StyleGrid({
  project,
  value,
  onChange,
}: {
  project: Project;
  value: Point;
  onChange: (p: Point) => void;
}) {
  const first = {
    detail: Math.ceil(project.bounds.lower.detail),
    expression: Math.floor(project.bounds.upper.expression),
  };
  function navigate(e: KeyboardEvent<HTMLButtonElement>, p: Point) {
    const shift: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    if (!shift[e.key]) return;
    e.preventDefault();
    const [dx, dy] = shift[e.key],
      next = { detail: p.detail + dx, expression: p.expression + dy };
    if (allowed(project, next)) {
      const el = e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
        `[data-detail="${next.detail}"][data-expression="${next.expression}"]`,
      );
      el?.focus();
      onChange(next);
    }
  }
  const integerSelected =
    Number.isInteger(value.detail) && Number.isInteger(value.expression) && allowed(project, value);
  return (
    <section className="anchor-grid-section" aria-label="Detail and expressiveness style grid">
      <div className="style-grid">
        <p className="style-grid__y">
          <Icon name="arrow" size={16} style={{ transform: "rotate(-90deg)" }} />
          More expressive
        </p>
        <div className="style-grid__corners style-grid__corners--top" aria-hidden="true">
          <span>Evocative</span>
          <span>Cinematic</span>
        </div>
        <div className="anchor-grid" role="radiogroup" aria-label="Choose detail and expressiveness">
          {Array.from({ length: 100 }, (_, i) => {
            const detail = (i % 10) + 1,
              expression = 10 - Math.floor(i / 10),
              selected = value.detail === detail && value.expression === expression;
            return (
              <button
                key={i}
                type="button"
                data-detail={detail}
                data-expression={expression}
                disabled={!allowed(project, { detail, expression })}
                aria-label={`Detail ${detail}, expressiveness ${expression}`}
                role="radio"
                aria-checked={selected}
                tabIndex={
                  selected || (!integerSelected && detail === first.detail && expression === first.expression)
                    ? 0
                    : -1
                }
                onKeyDown={(e) => navigate(e, { detail, expression })}
                title={`Detail ${detail} / Expressiveness ${expression}`}
                onClick={() => onChange({ detail, expression })}
              >
                {selected ? <Icon name="check" size={16} /> : null}
              </button>
            );
          })}
        </div>
        <div className="style-grid__corners" aria-hidden="true">
          <span>Minimalist</span>
          <span>Informative</span>
        </div>
        <p className="style-grid__x">
          More detail
          <Icon name="arrow" size={16} />
        </p>
      </div>
      <ul className="style-grid__legend">
        <li>
          <span className="legend-cell legend-cell--allowed" aria-hidden="true" /> Within the creator’s anchors
        </li>
        <li>
          <span className="legend-cell legend-cell--outside" aria-hidden="true" /> Outside the anchors (striped)
        </li>
        <li>
          <span className="legend-cell legend-cell--selected" aria-hidden="true" /> Selected
        </li>
      </ul>
      <p className="helper-text">
        Selected: detail {value.detail}, expressiveness {value.expression}. Use arrow keys to choose a nearby style.
      </p>
    </section>
  );
}
